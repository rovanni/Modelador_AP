/*
  Testes de interface do Modelador de Autômatos com Pilha.

  Como rodar: abra index.html no navegador, abra o console (F12), cole TODO este arquivo e tecle Enter.
  O resultado aparece no console (linhas PASS / FAIL e um resumo).
  Ao final, o exemplo aⁿbⁿ é recarregado (o trabalho salvo no navegador é substituído por ele).
*/
(() => {
    const out = [];
    let pass = 0, fail = 0;
    const check = (name, cond, extra) => {
        if (cond) { pass++; out.push('PASS  ' + name); }
        else { fail++; out.push('FAIL  ' + name + (extra !== undefined ? '  -> ' + extra : '')); }
    };
    const rect = () => canvas.getBoundingClientRect();
    const ev = (type, x, y, target, extra) => (target || window).dispatchEvent(
        new MouseEvent(type, Object.assign({ clientX: x, clientY: y, bubbles: true, button: 0 }, extra || {})));
    const at = (s) => ({ x: rect().left + s.x, y: rect().top + s.y });
    const byId = (id) => states.find((s) => s.id === id);
    const snapPos = () => states.map((s) => Math.round(s.x) + ',' + Math.round(s.y)).join('|');

    // ---------- 1. mover e desfazer ----------
    loadExample('anbn');
    let s = byId('q1');
    const before = [s.x, s.y];
    let p = at(s);
    ev('mousedown', p.x, p.y, canvas); ev('mousemove', p.x + 60, p.y + 50); ev('mouseup', p.x + 60, p.y + 50);
    check('arrastar um estado o move', s.x !== before[0] || s.y !== before[1], [s.x, s.y]);

    // ---------- 2. conectar com Shift ----------
    loadExample('anbn');
    const a = byId('q0'), b = byId('q2');
    const pa = at(a), pb = at(b);
    ev('mousedown', pa.x, pa.y, canvas, { shiftKey: true }); ev('mousemove', pb.x, pb.y); ev('mouseup', pb.x, pb.y);
    check('Shift+arrastar abre o modal de transição',
        !document.getElementById('transition-modal').classList.contains('hidden') &&
        document.getElementById('modal-from-state').value === 'q0' && document.getElementById('modal-to-state').value === 'q2');
    closeTransitionModal();

    // ---------- 3. duplo clique ----------
    const n0 = states.length;
    canvas.dispatchEvent(new MouseEvent('dblclick', { clientX: rect().left + 300, clientY: rect().top + 60, bubbles: true }));
    check('duplo clique no vazio cria estado', states.length === n0 + 1, states.length);
    undo();
    const q1 = byId('q1'); const wasAcc = acceptingStateIds.includes('q1'); const pq = at(q1);
    canvas.dispatchEvent(new MouseEvent('dblclick', { clientX: pq.x, clientY: pq.y, bubbles: true }));
    check('duplo clique no estado alterna aceitação', acceptingStateIds.includes('q1') === !wasAcc);
    undo();

    // ---------- 4. modo criar transições, menu de contexto ----------
    toggleDrawMode();
    check('botão alterna para criar transições', canvasMode === 'transition');
    toggleDrawMode();
    check('botão volta para mover nós', canvasMode === 'drag');
    const pc = at(byId('q0'));
    canvas.dispatchEvent(new MouseEvent('contextmenu', { clientX: pc.x, clientY: pc.y, bubbles: true }));
    check('botão direito no estado abre o menu', !document.getElementById('canvas-context-menu').classList.contains('hidden'));
    document.getElementById('canvas-context-menu').classList.add('hidden');

    // ---------- 5. layouts ----------
    loadExample('anbn');
    const p0 = snapPos();
    autoLayoutCircle(); const pcirc = snapPos();
    check('layout em círculo reposiciona', pcirc !== p0);
    layoutGrid(); const pgrid = snapPos();
    check('layout em grade reposiciona', pgrid !== pcirc);
    undo(); undo();
    check('desfazer x2 restaura as posições', snapPos() === p0);

    // ---------- 6. simulação ----------
    loadExample('anbn');
    document.getElementById('sim-input-string').value = 'aabb';
    startSingleSimulation();
    check('simulação pré-calcula os passos', simTrace.length > 1, simTrace.length);
    simStepForward(); simStepForward();
    check('avançar 2 passos', simStepIndex === 2, simStepIndex);
    simStepBack();
    check('voltar 1 passo', simStepIndex === 1, simStepIndex);
    simStepLast();
    const banner = document.getElementById('sim-result-banner').textContent;
    check('ir ao fim mostra ACEITA', /aceit/i.test(banner), banner.trim().slice(0, 60));
    simStepFirst();
    check('ir ao início volta ao passo 0', simStepIndex === 0);
    simStepForward();
    const hi = [...document.querySelectorAll('#transition-table-body tr')].filter((r) => r.className.includes('bg-indigo-500/20'));
    check('regra aplicada fica destacada na tabela', hi.length >= 1, hi.length);
    simTogglePlay();
    check('Play liga a reprodução', isSimPlaying === true);
    simTogglePlay();
    check('Pausar desliga a reprodução', isSimPlaying === false);

    // ---------- 7. salvar no navegador ----------
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('ap_model_autosave')); } catch (e) { /* ignora */ }
    saveToLocalStorage();
    try { saved = JSON.parse(localStorage.getItem('ap_model_autosave')); } catch (e) { /* ignora */ }
    check('máquina é salva no navegador', !!saved && saved.states.length === states.length);
    const keep = states.length;
    const restored = loadFromLocalStorage();
    check('loadFromLocalStorage devolve o modelo salvo', !!restored && restored.states.length === keep);

    // ---------- 8. exportações ----------
    loadExample('anbn');
    const tex = generateTikzCode();
    check('TikZ: \\varepsilon só aparece dentro de $...$', !tex.replace(/\$[^$]*\$/g, '').includes('\\varepsilon'));
    check('TikZ: laços usam loop above', tex.includes('loop above'));
    check('documento .tex completo (standalone)', generateFullTeX().includes('\\documentclass') && generateFullTeX().includes('\\end{document}'));
    const dark0 = isDarkTheme();
    exportCanvasToPNG();
    check('PNG exportado e tema restaurado', isDarkTheme() === dark0);

    // ---------- 9. lote ----------
    document.getElementById('batch-input-textarea').value = 'ab\naabb\naab\nba';
    runBatchTests();
    check('lote: 2 aceitas e 2 rejeitadas', document.getElementById('batch-stats-accepted').textContent.startsWith('2') &&
        document.getElementById('batch-stats-rejected').textContent.startsWith('2'),
        document.getElementById('batch-stats-accepted').textContent + ' / ' + document.getElementById('batch-stats-rejected').textContent);

    loadExample('anbn');
    const summary = 'RESUMO UI: PASS=' + pass + ' FAIL=' + fail;
    out.push(summary);
    console.log(out.join('\n'));
    return out.join('\n');
})()
