/* Motor de simulação do AP, controles do player e testes em lote */
// ----------------- MOTOR DE SIMULAÇÃO DE AUTÔMATOS DE PILHA -----------------
/*
  Uma configuração instantânea é um objeto:
  {
     stateId: 'q0',
     stack: ['Z0'], // stack[stack.length - 1] é o topo da pilha
     tapeIndex: 0,
     history: [ { stateId, op, tapeIndex, transitionId } ],
     isAccepted: false,
     isDeadEnd: false
  }
*/

function switchSimTab(tab) {
    const isSingle = (tab === 'single');
    document.getElementById('tab-content-single').classList.toggle('hidden', !isSingle);
    document.getElementById('tab-content-batch').classList.toggle('hidden', isSingle);

    document.getElementById('tab-btn-single').className = isSingle
        ? 'px-3 py-1.5 rounded-xl text-xs font-bold transition bg-indigo-600 text-white shadow-sm'
        : 'px-3 py-1.5 rounded-xl text-xs font-semibold transition text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200';
    
    document.getElementById('tab-btn-batch').className = !isSingle
        ? 'px-3 py-1.5 rounded-xl text-xs font-bold transition bg-indigo-600 text-white shadow-sm'
        : 'px-3 py-1.5 rounded-xl text-xs font-semibold transition text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200';
}

function startSingleSimulation() {
    const rawInput = document.getElementById('sim-input-string').value.trim();
    simString = (rawInput === 'ε') ? '' : rawInput; // 'ε' digitado = palavra vazia
    simTape = simString.split('');
    resetSimulation();
    precomputeSimulationTrace();
    simStepIndex = 0;
    simSelectedBranchIndex = 0;
    updateSimulationView();
}

function resetSimulation() {
    if (isSimPlaying) simTogglePlay();
    simStepIndex = 0;
    simTrace = [];
    simSelectedBranchIndex = 0;
    renderTape();
    updateStackVisual();
    document.getElementById('active-branches-container').innerHTML = '';
    document.getElementById('branch-count-badge').innerText = '0 ramos';
    redrawGraph();
}

function precomputeSimulationTrace() {
    if (!initialStateId) return;

    simTrace = [];
    const maxSteps = 100; // Proteção contra loops infinitos de transições ε
    const initialConfig = {
        id: 'c_0',
        stateId: initialStateId,
        stack: initialStackSymbol ? [initialStackSymbol] : [],
        tapeIndex: 0,
        path: [{ stateId: initialStateId, op: 'Início', stackSnapshot: initialStackSymbol ? [initialStackSymbol] : [] }]
    };

    // Passo 0
    let currentLevel = [initialConfig];
    
    // Computa fecho-épsilon inicial
    currentLevel = expandEpsilonMoves(currentLevel, simTape, 0);

    simTrace.push({
        step: 0,
        configurations: cloneConfigs(currentLevel),
        activeStates: [...new Set(currentLevel.map(c => c.stateId))],
        activeTransitions: []
    });

    // Itera consumindo os caracteres da fita
    let stepNum = 1;
    while (stepNum <= maxSteps) {
        const nextLevel = [];
        const activeTrans = [];

        currentLevel.forEach(cfg => {
            const char = (cfg.tapeIndex < simTape.length) ? simTape[cfg.tapeIndex] : null;
            const top = cfg.stack.length > 0 ? cfg.stack[cfg.stack.length - 1] : 'ε';

            if (char !== null) {
                // Busca transições que consom o caractere atual
                const matching = transitions.filter(t => 
                    t.from === cfg.stateId && 
                    t.read === char && 
                    (t.pop === 'ε' || t.pop === top)
                );

                matching.forEach(t => {
                    const newStack = applyStackOperation(cfg.stack, t.pop, t.push);
                    if (newStack !== null) {
                        activeTrans.push({ from: t.from, to: t.to, id: t.id });
                        nextLevel.push({
                            id: 'c_' + Math.random().toString(36).substr(2, 5),
                            stateId: t.to,
                            stack: newStack,
                            tapeIndex: cfg.tapeIndex + 1,
                            lastOp: `Lê ${char} | Pop: ${t.pop} | Push: ${t.push}`,
                    lastRuleId: t.id,
                            path: [...cfg.path, { stateId: t.to, op: `Lê ${char}, Pop ${t.pop} → Push ${t.push}`, stackSnapshot: [...newStack] }]
                        });
                    }
                });
            }
        });

        if (nextLevel.length === 0) {
            break;
        }

        // Expande movimentos espontâneos (ε-moves) após consumo
        const expanded = expandEpsilonMoves(nextLevel, simTape, stepNum);

        simTrace.push({
            step: stepNum,
            configurations: cloneConfigs(expanded),
            activeStates: [...new Set(expanded.map(c => c.stateId))],
            activeTransitions: activeTrans
        });

        currentLevel = expanded;
        stepNum++;

        // Se todas as configurações atingiram o fim da fita e não há mais expansão
        const allDone = currentLevel.every(c => c.tapeIndex >= simTape.length);
        if (allDone && stepNum > simTape.length + 5) break;
    }
}

// Expande transições com leitura de ε (sem consumir fita)
function expandEpsilonMoves(configs, tape, currentStep) {
    const queue = [...configs];
    const result = [...configs];
    const visited = new Set(configs.map(c => `${c.stateId}|${c.stack.join(',')}|${c.tapeIndex}`));
    const maxEpsDepth = 50;
    let depth = 0;

    while (queue.length > 0 && depth < maxEpsDepth) {
        depth++;
        const curr = queue.shift();
        const top = curr.stack.length > 0 ? curr.stack[curr.stack.length - 1] : 'ε';

        const epsMoves = transitions.filter(t => 
            t.from === curr.stateId && 
            t.read === 'ε' && 
            (t.pop === 'ε' || t.pop === top)
        );

        epsMoves.forEach(t => {
            const newStack = applyStackOperation(curr.stack, t.pop, t.push);
            if (newStack !== null) {
                const sig = `${t.to}|${newStack.join(',')}|${curr.tapeIndex}`;
                if (!visited.has(sig)) {
                    visited.add(sig);
                    const nextCfg = {
                        id: 'c_' + Math.random().toString(36).substr(2, 5),
                        stateId: t.to,
                        stack: newStack,
                        tapeIndex: curr.tapeIndex,
                        lastOp: `ε-move | Pop: ${t.pop} | Push: ${t.push}`,
                lastRuleId: t.id,
                        path: [...(curr.path || []), { stateId: t.to, op: `ε, Pop ${t.pop} → Push ${t.push}`, stackSnapshot: [...newStack] }]
                    };
                    result.push(nextCfg);
                    queue.push(nextCfg);
                }
            }
        });
    }

    return result;
}

// Aplica desempilhamento e empilhamento na pilha
function applyStackOperation(stack, popSym, pushStr) {
    const newStack = [...stack];
    // 1. Desempilha se popSym !== 'ε'
    if (popSym !== 'ε') {
        if (newStack.length === 0) return null; // Não há como desempilhar
        const popped = newStack.pop();
        if (popped !== popSym) return null; // Topo não confere
    }

    // 2. Empilha se pushStr !== 'ε'
    if (pushStr !== 'ε') {
        // Decompõe a cadeia empilhada:
        // Notação pedagógica padrão (Sipser / Hopcroft): ao empilhar "AZ0",
        // os símbolos são inseridos de modo que o primeiro caractere (A) termine no TOPO.
        const symbolsToPush = parsePushSymbols(pushStr);
        // Insere na ordem reversa para que o primeiro elemento fique no topo
        for (let i = symbolsToPush.length - 1; i >= 0; i--) {
            newStack.push(symbolsToPush[i]);
        }
    }

    return newStack;
}

function parsePushSymbols(pushStr) {
    // Se houver espaços ou vírgulas
    if (pushStr.includes(' ') || pushStr.includes(',')) {
        return pushStr.split(/[ ,]+/).map(s => s.trim()).filter(s => s.length > 0);
    }
    // Reconhece tokens do alfabeto da pilha (ex: Z0, A) de forma gulosa
    const result = [];
    let rem = pushStr;
    while (rem.length > 0) {
        let match = null;
        // Tenta casar com o maior símbolo de Γ
        const sortedGamma = [...stackAlphabet].sort((a, b) => b.length - a.length);
        for (let s of sortedGamma) {
            if (rem.startsWith(s)) {
                match = s;
                break;
            }
        }
        if (match) {
            result.push(match);
            rem = rem.slice(match.length);
        } else {
            result.push(rem[0]);
            rem = rem.slice(1);
        }
    }
    return result;
}

function cloneConfigs(configs) {
    return configs.map(c => ({
        id: c.id,
        stateId: c.stateId,
        stack: [...c.stack],
        tapeIndex: c.tapeIndex,
        lastOp: c.lastOp,
        lastRuleId: c.lastRuleId,
        path: c.path ? [...c.path] : []
    }));
}

// Verifica se uma configuração é aceita segundo o critério selecionado
function isConfigAccepted(cfg, tapeLen) {
    if (cfg.tapeIndex < tapeLen) return false;
    const isFinalState = acceptingStateIds.includes(cfg.stateId);
    const isStackEmpty = (cfg.stack.length === 0);

    if (acceptanceMode === 'final_state') {
        return isFinalState;
    } else if (acceptanceMode === 'empty_stack') {
        return isStackEmpty;
    } else if (acceptanceMode === 'both') {
        return isFinalState && isStackEmpty;
    }
    return false;
}

// ----------------- VISUALIZAÇÃO E CONTROLES DE SIMULAÇÃO -----------------
function updateSimulationView() {
    if (simTrace.length === 0) return;

    const currentStepData = simTrace[simStepIndex] || simTrace[0];
    const configs = currentStepData.configurations || [];

    // 1. Atualiza Fita
    const activeTapeIndices = configs.map(c => c.tapeIndex);
    const currentHeadPos = activeTapeIndices.length > 0 ? Math.min(...activeTapeIndices) : 0;
    renderTape(currentHeadPos);
    document.getElementById('tape-status-text').innerText = `Lendo índice: ${currentHeadPos} / ${simTape.length}`;

    // 2. Atualiza Passo
    document.getElementById('sim-step-indicator').innerText = `Passo: ${simStepIndex} / ${simTrace.length - 1}`;

    // 3. Atualiza Ramos Ativos
    renderActiveBranches(configs);

    // 4. Configuração selecionada para a Pilha Visual
    const selectedCfg = configs[simSelectedBranchIndex] || configs[0];
    if (selectedCfg) {
        updateStackVisual(selectedCfg.stack, selectedCfg.lastOp);
    } else {
        updateStackVisual([], 'Sem configuração ativa');
    }

    // 5. Atualiza Banner de Resultado
    updateResultBanner(configs);

    // 6. Atualiza Canvas com estados e transições ativas
    redrawGraph(currentStepData);

    // 7. Destaca na tabela de δ as regras aplicadas neste passo
    renderTransitionTable();
}

/* Regras (ids) aplicadas no passo exibido da simulação: usadas para destacar linhas da tabela de δ. */
function activeRuleIds() {
    const ids = new Set();
    const step = simTrace[simStepIndex];
    if (!step) return ids;
    (step.configurations || []).forEach((c) => { if (c.lastRuleId) ids.add(c.lastRuleId); });
    return ids;
}

function renderTape(currentPos = -1) {
    const container = document.getElementById('tape-cells-container');
    container.innerHTML = '';

    if (simTape.length === 0) {
        container.innerHTML = '<span class="text-xs text-slate-400 italic">Palavra vazia (ε)</span>';
        return;
    }

    simTape.forEach((char, idx) => {
        const cell = document.createElement('div');
        const isCurrent = (idx === currentPos);
        const isPassed = (idx < currentPos);

        cell.className = `min-w-[34px] h-9 flex flex-col items-center justify-center rounded-lg border font-bold text-xs code-font transition-all ${
                    isCurrent 
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-md scale-105 z-10' 
                        : isPassed 
                            ? 'border-slate-200 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/40 text-slate-400' 
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                }`;
        cell.innerHTML = `
                    <span>${char}</span>
                    <span class="text-[8px] opacity-70">${idx}</span>
                `;
        container.appendChild(cell);
    });

    // Marcador de Fim de Fita (EOF / ⊣)
    const eofCell = document.createElement('div');
    const isEof = (currentPos >= simTape.length);
    eofCell.className = `min-w-[34px] h-9 flex flex-col items-center justify-center rounded-lg border font-bold text-xs code-font transition-all ${
                isEof
                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-md scale-105'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-400'
            }`;
    eofCell.innerHTML = `<span>⊣</span><span class="text-[8px] opacity-70">Fim</span>`;
    container.appendChild(eofCell);
}

function renderActiveBranches(configs) {
    const container = document.getElementById('active-branches-container');
    container.innerHTML = '';
    document.getElementById('branch-count-badge').innerText = `${configs.length} ramo${configs.length > 1 ? 's' : ''}`;

    if (configs.length === 0) {
        container.innerHTML = '<span class="text-rose-500 text-xs italic font-semibold">Travamento: Nenhuma transição válida encontrada.</span>';
        return;
    }

    configs.forEach((cfg, idx) => {
        const isSelected = (idx === simSelectedBranchIndex);
        const isAcc = isConfigAccepted(cfg, simTape.length);

        const card = document.createElement('button');
        card.onclick = () => {
            simSelectedBranchIndex = idx;
            updateSimulationView();
        };

        const stackPreview = cfg.stack.length > 0 ? `[${cfg.stack.slice(-3).reverse().join(', ')}]` : '[]';

        card.className = `text-left px-2.5 py-1.5 rounded-xl border text-xs transition-all flex items-center gap-2 ${
                    isAcc
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : isSelected
                            ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                }`;

        card.innerHTML = `
                    <span class="w-2 h-2 rounded-full ${isAcc ? 'bg-emerald-500' : (isSelected ? 'bg-indigo-500' : 'bg-slate-400')}"></span>
                    <span class="code-font font-bold">${cfg.stateId}</span>
                    <span class="text-[10px] text-slate-400 font-mono">P: ${stackPreview}</span>
                    ${isAcc ? '<span class="text-[10px] font-bold bg-emerald-500 text-white px-1 rounded">ACEITA</span>' : ''}
                `;

        container.appendChild(card);
    });
}

function updateStackVisual(stack = [], lastOpText = null) {
    const container = document.getElementById('stack-visual-container');
    const heightBadge = document.getElementById('stack-height-badge');
    const opBadge = document.getElementById('stack-op-badge');

    container.innerHTML = '';
    heightBadge.innerText = `Tam: ${stack.length}`;

    if (lastOpText) {
        opBadge.innerText = lastOpText;
        if (lastOpText.includes('Push') && !lastOpText.includes('Push: ε')) {
            opBadge.className = "w-full text-center py-1 px-2 mb-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
        } else if (lastOpText.includes('Pop') && !lastOpText.includes('Pop: ε')) {
            opBadge.className = "w-full text-center py-1 px-2 mb-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
        } else {
            opBadge.className = "w-full text-center py-1 px-2 mb-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-900 text-slate-500 border border-slate-300/40 dark:border-slate-800";
        }
    }

    if (stack.length === 0) {
        const emptyCell = document.createElement('div');
        emptyCell.className = "w-full py-4 text-center text-xs font-semibold text-rose-500 italic";
        emptyCell.innerText = "Pilha Vazia";
        container.appendChild(emptyCell);
        return;
    }

    stack.forEach((sym, idx) => {
        const cell = document.createElement('div');
        const isTop = (idx === stack.length - 1);
        const isBase = (idx === 0);

        cell.className = `w-full py-2 px-3 rounded-lg border font-bold text-xs code-font text-center shadow-sm stack-item-push transition-all flex items-center justify-between ${
                    isTop
                        ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/30 font-black'
                        : isBase
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`;

        cell.innerHTML = `
                    <span class="text-[9px] opacity-70">${idx}</span>
                    <span class="text-sm">${sym}</span>
                    <span class="text-[9px] opacity-80">${isTop ? 'Topo' : (isBase ? 'Base' : '')}</span>
                `;

        container.appendChild(cell);
    });
}

function updateResultBanner(configs) {
    const banner = document.getElementById('sim-result-banner');
    const icon = document.getElementById('sim-status-icon');
    const title = document.getElementById('sim-status-title');
    const desc = document.getElementById('sim-status-desc');

    const hasAnyAccepted = configs.some(c => isConfigAccepted(c, simTape.length));
    const isLastStep = (simStepIndex === simTrace.length - 1);

    if (hasAnyAccepted) {
        banner.className = "p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between";
        icon.innerText = "🏆";
        title.className = "text-xs font-bold text-emerald-600 dark:text-emerald-400";
        title.innerText = "Palavra Aceita pelo Autômato!";
        desc.innerText = getAcceptanceExplanation();
    } else if (isLastStep) {
        banner.className = "p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between";
        icon.innerText = "❌";
        title.className = "text-xs font-bold text-rose-600 dark:text-rose-400";
        title.innerText = "Palavra Rejeitada!";
        desc.innerText = "Nenhum ramo alcançou o critério de aceitação após o processamento.";
    } else {
        banner.className = "p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between";
        icon.innerText = "⚙";
        title.className = "text-xs font-bold text-slate-700 dark:text-slate-200";
        title.innerText = "Simulando execução...";
        desc.innerText = `Processando passo ${simStepIndex}. Fita em leitura.`;
    }
}

function getAcceptanceExplanation() {
    if (acceptanceMode === 'final_state') {
        return "Cadeia consumida por completo e atingiu um Estado Final L(M).";
    } else if (acceptanceMode === 'empty_stack') {
        return "Cadeia consumida por completo e esvaziou a pilha com sucesso N(M).";
    } else {
        return "Cadeia consumida por completo, atingiu Estado Final E esvaziou a pilha.";
    }
}

// ----------------- CONTROLES DO PLAYER (PLAY / STEP / PAUSE) -----------------
function simStepForward() {
    if (simStepIndex < simTrace.length - 1) {
        simStepIndex++;
        updateSimulationView();
    } else if (isSimPlaying) {
        simTogglePlay();
    }
}

function simStepBack() {
    if (simStepIndex > 0) {
        simStepIndex--;
        updateSimulationView();
    }
}

function simStepFirst() {
    simStepIndex = 0;
    updateSimulationView();
}

function simStepLast() {
    if (simTrace.length > 0) {
        simStepIndex = simTrace.length - 1;
        updateSimulationView();
    }
}

function simTogglePlay() {
    const btn = document.getElementById('btn-play-pause');
    if (isSimPlaying) {
        clearInterval(simPlayTimer);
        isSimPlaying = false;
        btn.innerHTML = "▶ Play";
        btn.classList.replace('bg-amber-600', 'bg-indigo-600');
    } else {
        if (simTrace.length === 0) startSingleSimulation();
        if (simStepIndex >= simTrace.length - 1) simStepIndex = 0;

        isSimPlaying = true;
        btn.innerHTML = "⏸ Pausar";
        btn.classList.replace('bg-indigo-600', 'bg-amber-600');

        const speed = parseInt(document.getElementById('sim-speed-range').value) || 800;
        simPlayTimer = setInterval(() => {
            simStepForward();
        }, speed);
    }
}

// ----------------- TESTES EM LOTE (BATCH TESTING) -----------------
function runBatchTests() {
    const rawText = document.getElementById('batch-input-textarea').value;
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const listContainer = document.getElementById('batch-results-list');
    listContainer.innerHTML = '';

    if (lines.length === 0) {
        listContainer.innerHTML = '<span class="text-rose-500 text-xs italic">Nenhuma palavra informada. Digite uma por linha.</span>';
        return;
    }

    let acceptedCount = 0;
    let rejectedCount = 0;

    lines.forEach((word) => {
        const testWord = (word === 'ε') ? '' : word; // 'ε' digitado = palavra vazia
        const isAccepted = evaluateWord(testWord);
        if (isAccepted) acceptedCount++;
        else rejectedCount++;

        const row = document.createElement('div');
        row.className = `p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                    isAccepted
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-rose-500/30 bg-rose-500/5'
                }`;

        row.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded-md font-bold code-font text-xs ${
                            isAccepted 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-rose-500 text-white'
                        }">
                            ${isAccepted ? 'ACEITA' : 'REJEITADA'}
                        </span>
                        <span class="font-bold code-font text-slate-800 dark:text-slate-100">${word}</span>
                    </div>
                    <button onclick="loadWordToSimulator('${word}')" class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                        Simular Passo a Passo ➔
                    </button>
                `;

        listContainer.appendChild(row);
    });

    document.getElementById('batch-stats-accepted').innerText = `${acceptedCount} Aceita${acceptedCount !== 1 ? 's' : ''}`;
    document.getElementById('batch-stats-rejected').innerText = `${rejectedCount} Rejeitada${rejectedCount !== 1 ? 's' : ''}`;
}

function loadWordToSimulator(word) {
    document.getElementById('sim-input-string').value = word;
    switchSimTab('single');
    startSingleSimulation();
}

function evaluateWord(word) {
    if (!initialStateId) return false;
    const tape = word.split('');
    const initialConfig = {
        stateId: initialStateId,
        stack: initialStackSymbol ? [initialStackSymbol] : [],
        tapeIndex: 0,
        path: []
    };

    let currentLevel = expandEpsilonMoves([initialConfig], tape, 0);

    // Verifica aceitação imediata (para palavra vazia)
    if (tape.length === 0 && currentLevel.some(c => isConfigAccepted(c, 0))) {
        return true;
    }

    const maxSteps = 120;
    let step = 0;

    while (step < maxSteps && currentLevel.length > 0) {
        step++;
        const nextLevel = [];

        currentLevel.forEach(cfg => {
            if (cfg.tapeIndex < tape.length) {
                const char = tape[cfg.tapeIndex];
                const top = cfg.stack.length > 0 ? cfg.stack[cfg.stack.length - 1] : 'ε';

                const matching = transitions.filter(t => 
                    t.from === cfg.stateId && 
                    t.read === char && 
                    (t.pop === 'ε' || t.pop === top)
                );

                matching.forEach(t => {
                    const newStack = applyStackOperation(cfg.stack, t.pop, t.push);
                    if (newStack !== null) {
                        nextLevel.push({
                            stateId: t.to,
                            stack: newStack,
                            tapeIndex: cfg.tapeIndex + 1,
                            path: []
                        });
                    }
                });
            }
        });

        if (nextLevel.length === 0) break;

        const expanded = expandEpsilonMoves(nextLevel, tape, step);
        if (expanded.some(c => isConfigAccepted(c, tape.length))) {
            return true;
        }

        currentLevel = expanded;
    }

    return currentLevel.some(c => isConfigAccepted(c, tape.length));
}
