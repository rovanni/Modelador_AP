/* Exportação JSON, PNG e LaTeX (TikZ) */
// ----------------- EXPORTAÇÃO JSON / IMPORTAÇÃO -----------------
function exportToJSON() {
    const project = {
        name: "Automato_de_Pilha",
        type: "AP",
        version: "1.0",
        date: new Date().toISOString(),
        alphabet,
        stackAlphabet,
        initialStackSymbol,
        acceptanceMode,
        states,
        initialStateId,
        acceptingStateIds,
        transitions
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `automato-pilha-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            recordSnapshot();
            applyModelData(data);
            alert('Autômato de Pilha importado com sucesso!');
        } catch (err) {
            alert('Erro ao carregar o arquivo JSON. Formato inválido.');
            console.error(err);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ----------------- EXPORTAÇÃO PNG EM ALTA DEFINIÇÃO -----------------
/* PNG sempre em fundo branco e paleta clara (serve para slides e artigos), qualquer que seja o tema da tela. */
function exportCanvasToPNG() {
    const exportCanvas = document.createElement('canvas');
    const dpr = 2; // Alta resolução para impressão / relatórios
    const rect = canvas.getBoundingClientRect();
    exportCanvas.width = rect.width * dpr;
    exportCanvas.height = rect.height * dpr;
    const expCtx = exportCanvas.getContext('2d');
    expCtx.scale(dpr, dpr);

    const wasDark = isDarkTheme();
    if (wasDark) document.documentElement.classList.remove('dark');   // as rotinas de desenho leem o tema da página
    try {
        expCtx.fillStyle = '#ffffff';
        expCtx.fillRect(0, 0, rect.width, rect.height);

        drawTransitions(expCtx, null);
        states.forEach(node => {
            const isInitial = (node.id === initialStateId);
            const isAccepting = acceptingStateIds.includes(node.id);
            drawNode(expCtx, node, isInitial, isAccepting, false, false, false);
        });
    } finally {
        if (wasDark) document.documentElement.classList.add('dark');
    }

    const link = document.createElement('a');
    link.download = `automato-pilha-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
}

function openLatexModal() {
    const code = generateTikzCode();
    document.getElementById('latex-code-textarea').value = code;
    document.getElementById('latex-modal').classList.remove('hidden');
}

function closeLatexModal() {
    document.getElementById('latex-modal').classList.add('hidden');
}

function copyLatexCode() {
    const textarea = document.getElementById('latex-code-textarea');
    textarea.select();
    document.execCommand('copy');
    const btn = document.getElementById('btn-copy-latex');
    btn.innerText = "Copiado!";
    setTimeout(() => btn.innerText = "Copiar Código", 2000);
}

/* Símbolo em modo matemático: ε vira \varepsilon, Z0 vira Z_{0} e caracteres especiais são escapados. */
function texMath(sym) {
    const str = String(sym);
    if (str === 'ε') return '\\varepsilon';
    return str.replace(/([#%&_{}])/g, '\\$1').replace(/^([A-Za-z]+)(\d+)$/, '$1_{$2}');
}
function texStateName(name) {
    const m = String(name).match(/^(.*?)(\d+)$/);
    return '$' + (m && m[1] ? m[1] + '_{' + m[2] + '}' : String(name)) + '$';
}

function generateTikzCode() {
    let code = "% Requer no preâmbulo: \\usepackage[utf8]{inputenc} \\usepackage[T1]{fontenc} \\usepackage{tikz} \\usetikzlibrary{automata,positioning,arrows.meta}\n";
    code += "\\begin{tikzpicture}[shorten >=1pt, node distance=2.5cm, on grid, auto, >={Stealth[length=2.5mm]}]\n";

    // Nós
    code += "  % Estados\n";
    states.forEach((s) => {
        const opts = ['state'];
        if (s.id === initialStateId) opts.push('initial');
        if (acceptingStateIds.includes(s.id)) opts.push('accepting');
        const posX = (s.x / 60).toFixed(2);
        const posY = (-s.y / 60).toFixed(2);
        code += `  \\node[${opts.join(', ')}] (${s.id}) at (${posX}, ${posY}) {${texStateName(s.id)}};\n`;
    });

    // Agrupa arestas
    const edgeMap = {};
    transitions.forEach(t => {
        const key = `${t.from}->${t.to}`;
        if (!edgeMap[key]) edgeMap[key] = [];
        edgeMap[key].push(t);
    });

    code += "\n  % Transições do AP\n";
    code += "  \\path[->]\n";

    Object.keys(edgeMap).forEach(key => {
        const [from, to] = key.split('->');
        const list = edgeMap[key];
        const labels = list.map(t => {
            const push = String(t.push).split('').length > 1 && t.push !== 'ε'
                ? String(t.push).replace(/([A-Za-z]+?)(\d+)/g, '$1_{$2}')   // AZ0 -> AZ_{0}
                : texMath(t.push);
            return `$${texMath(t.read)}, ${texMath(t.pop)} / ${push}$`;
        }).join(' \\\\ ');

        if (from === to) {
            code += `    (${from}) edge [loop above] node[align=center] {${labels}} (${to})\n`;
        } else {
            const reverseKey = `${to}->${from}`;
            const bend = edgeMap[reverseKey] ? "bend left=20" : "";
            code += `    (${from}) edge [${bend}] node[align=center] {${labels}} (${to})\n`;
        }
    });

    code += "  ;\n";
    code += "\\end{tikzpicture}\n";
    return code;
}

/* Documento completo e compilável (classe standalone): basta compilar o .tex, sem montar o preâmbulo. */
function generateFullTeX() {
    return [
        '\\documentclass[border=10pt,varwidth]{standalone}',
        '\\usepackage[utf8]{inputenc}',
        '\\usepackage[T1]{fontenc}',
        '\\usepackage{tikz}',
        '\\usetikzlibrary{automata,positioning,arrows.meta}',
        '\\begin{document}',
        generateTikzCode(),
        '\\end{document}',
        ''
    ].join('\n');
}

function downloadFullTeX() {
    const blob = new Blob([generateFullTeX()], { type: 'text/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automato-pilha.tex';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}
