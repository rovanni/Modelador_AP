/* Estado do autômato, tema, desfazer/refazer, alfabetos, estados/transições e validador */
// ----------------- ESTADO GLOBAL DO AUTÔMATO COM PILHA -----------------
let alphabet = ['a', 'b'];           // Σ (Alfabeto de Entrada)
let stackAlphabet = ['A', 'Z0'];     // Γ (Alfabeto da Pilha)
let initialStackSymbol = 'Z0';       // Z0 (Base da Pilha)
let acceptanceMode = 'final_state';  // 'final_state' | 'empty_stack' | 'both'

let states = [];                     // [{ id: 'q0', x: 180, y: 220 }]
let initialStateId = 'q0';
let acceptingStateIds = [];          // F (Conjunto de Estados Finais)

// Transições: array de objetos { id, from, to, read, pop, push }
// Lê: read (ex: 'a' ou 'ε')
// Desempilha: pop (ex: 'Z0' ou 'ε')
// Empilha: push (ex: 'AZ0' ou 'ε')
let transitions = [];

// Histórico para Desfazer / Refazer (Undo / Redo)
let historyStack = [];
let redoStack = [];

// Modo do Canvas: 'drag' (mover nós) ou 'transition' (arrastar para criar transição)
let canvasMode = 'drag';
let isDrawingTransition = false;
let transitionSourceNode = null;
let transitionTempTargetPos = { x: 0, y: 0 };
const nodeRadius = 24;

// Visual Canvas State
const canvas = document.getElementById('automaton-canvas');
const ctx = canvas.getContext('2d');
let selectedNode = null;
let selectedStateIds = [];
let isDragging = false;
let dragStartPos = { x: 0, y: 0 };
let initialSelectedPositions = [];
let contextNode = null;
let isToolbarCompact = false;

// Estado do Modal de Transição
let modalCurrentFrom = null;
let modalCurrentTo = null;
let renameTargetId = null;

// Estado do Simulador Passo a Passo
let simString = "";
let simTape = [];
let simStepIndex = 0;
let simTrace = []; // Array de passos: cada passo contém { configurations: [...], activeTransitions: [...] }
let simSelectedBranchIndex = 0;
let isSimPlaying = false;
let simPlayTimer = null;

// ----------------- CONTROLE DE TEMA (DARK / LIGHT) -----------------
function initTheme() {
    const savedTheme = localStorage.getItem('ap_theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
    updateThemeIcons();
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ap_theme', isDark ? 'dark' : 'light');
    updateThemeIcons();
    redrawGraph();
    updateStackVisual();
}

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('theme-sun').classList.toggle('hidden', !isDark);
    document.getElementById('theme-moon').classList.toggle('hidden', isDark);
}

function isDarkTheme() {
    return document.documentElement.classList.contains('dark');
}

// ----------------- SNAPSHOT & DESFAZER / REFAZER -----------------
function recordSnapshot() {
    const snapshot = JSON.stringify({
        alphabet,
        stackAlphabet,
        initialStackSymbol,
        acceptanceMode,
        states,
        initialStateId,
        acceptingStateIds,
        transitions
    });
    historyStack.push(snapshot);
    if (historyStack.length > 50) historyStack.shift();
    redoStack = [];
    updateUndoRedoButtons();
    saveToLocalStorage();
}

function undo() {
    if (historyStack.length === 0) return;
    const current = JSON.stringify({
        alphabet,
        stackAlphabet,
        initialStackSymbol,
        acceptanceMode,
        states,
        initialStateId,
        acceptingStateIds,
        transitions
    });
    redoStack.push(current);
    const prev = JSON.parse(historyStack.pop());
    applyModelData(prev);
    updateUndoRedoButtons();
    saveToLocalStorage();
}

function redo() {
    if (redoStack.length === 0) return;
    const current = JSON.stringify({
        alphabet,
        stackAlphabet,
        initialStackSymbol,
        acceptanceMode,
        states,
        initialStateId,
        acceptingStateIds,
        transitions
    });
    historyStack.push(current);
    const next = JSON.parse(redoStack.pop());
    applyModelData(next);
    updateUndoRedoButtons();
    saveToLocalStorage();
}

function updateUndoRedoButtons() {
    document.getElementById('btn-undo').disabled = historyStack.length === 0;
    document.getElementById('btn-redo').disabled = redoStack.length === 0;
}

function applyModelData(data) {
    alphabet = data.alphabet || ['a', 'b'];
    stackAlphabet = data.stackAlphabet || ['A', 'Z0'];
    initialStackSymbol = data.initialStackSymbol || 'Z0';
    acceptanceMode = data.acceptanceMode || 'final_state';
    states = data.states || [];
    initialStateId = data.initialStateId || '';
    acceptingStateIds = data.acceptingStateIds || [];
    transitions = data.transitions || [];

    // Sincroniza campos visuais
    document.getElementById('alphabet-input').value = alphabet.join(', ');
    document.getElementById('stack-alphabet-input').value = stackAlphabet.join(', ');
    document.getElementById('initial-stack-symbol-input').value = initialStackSymbol;
    
    const radios = document.getElementsByName('acceptanceMode');
    radios.forEach(r => r.checked = (r.value === acceptanceMode));

    updateStateCount();
    renderTransitionTable();
    validateAutomaton();
    redrawGraph();
    resetSimulation();
}

const AUTOSAVE_KEY = 'ap_model_autosave';
let lastAutosave = '';

function currentModel() {
    return { alphabet, stackAlphabet, initialStackSymbol, acceptanceMode, states, initialStateId, acceptingStateIds, transitions };
}

function saveToLocalStorage() {
    try {
        if (!states.length) return;   // nunca grava o estado vazio do início da página por cima do trabalho salvo
        const payload = JSON.stringify(currentModel());
        if (payload === lastAutosave) return;
        localStorage.setItem(AUTOSAVE_KEY, payload);
        lastAutosave = payload;
    } catch (e) {
        console.error('Falha ao salvar no LocalStorage:', e);
    }
}

/* Devolve o modelo salvo (ou null se não houver / estiver vazio). */
function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(AUTOSAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.states) || !data.states.length) return null;
        lastAutosave = raw;
        return data;
    } catch (e) {
        return null;
    }
}

// ----------------- PARÂMETROS FORMAIS & ALFABETOS -----------------
function updateFormalParams() {
    recordSnapshot();

    const alphaStr = document.getElementById('alphabet-input').value;
    alphabet = alphaStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (alphabet.length === 0) alphabet = ['a', 'b'];

    const stackStr = document.getElementById('stack-alphabet-input').value;
    stackAlphabet = stackStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (stackAlphabet.length === 0) stackAlphabet = ['A', 'Z0'];

    const initStackStr = document.getElementById('initial-stack-symbol-input').value.trim();
    initialStackSymbol = initStackStr || (stackAlphabet[0] || 'Z0');

    if (!stackAlphabet.includes(initialStackSymbol)) {
        stackAlphabet.push(initialStackSymbol);
        document.getElementById('stack-alphabet-input').value = stackAlphabet.join(', ');
    }

    validateAutomaton();
    renderTransitionTable();
    redrawGraph();
    resetSimulation();
}

function changeAcceptanceMode(mode) {
    recordSnapshot();
    acceptanceMode = mode;
    validateAutomaton();
    if (simTrace.length > 0) {
        updateSimulationView();
    }
}

// ----------------- GESTÃO DE ESTADOS E TRANSIÇÕES -----------------
function handleAddStateClick() {
    recordSnapshot();
    const id = getNextStateId();
    const x = 120 + (states.length % 5) * 110;
    const y = 140 + Math.floor(states.length / 5) * 90;
    states.push({ id, x, y });

    if (!initialStateId) {
        initialStateId = id;
    }

    updateStateCount();
    renderTransitionTable();
    validateAutomaton();
    redrawGraph();
}

function getNextStateId() {
    let idx = 0;
    while (states.some(s => s.id === 'q' + idx)) {
        idx++;
    }
    return 'q' + idx;
}

function updateStateCount() {
    document.getElementById('state-count').innerText = states.length;
    document.getElementById('transition-count').innerText = transitions.length;
    updateFilterOptions();
}

function updateFilterOptions() {
    const select = document.getElementById('state-table-filter');
    const currentVal = select.value;
    select.innerHTML = '<option value="all">Todos os Estados</option>';
    states.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.innerText = s.id + (s.id === initialStateId ? ' (Inicial)' : '') + (acceptingStateIds.includes(s.id) ? ' ★' : '');
        select.appendChild(opt);
    });
    if (currentVal && states.some(s => s.id === currentVal)) {
        select.value = currentVal;
    } else {
        select.value = 'all';
    }
}

function renderTransitionTable() {
    const tbody = document.getElementById('transition-table-body');
    const filterState = document.getElementById('state-table-filter').value;
    tbody.innerHTML = '';

    let filtered = transitions;
    if (filterState !== 'all') {
        filtered = transitions.filter(t => t.from === filterState);
    }

    if (filtered.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" class="text-center py-6 text-slate-400 italic">Nenhuma transição cadastrada</td>`;
        tbody.appendChild(tr);
        return;
    }

    const activeRules = activeRuleIds();
    let firstActive = null;
    filtered.forEach((t) => {
        const tr = document.createElement('tr');
        const isActive = activeRules.has(t.id);
        tr.className = isActive
            ? "bg-indigo-500/20 ring-1 ring-inset ring-indigo-500/60 transition-colors"
            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors";
        if (isActive && !firstActive) firstActive = tr;
        tr.innerHTML = `
                    <td class="py-2 px-2.5 font-bold code-font text-indigo-600 dark:text-indigo-400">${t.from}</td>
                    <td class="py-2 px-2 text-center font-bold code-font">${t.read === 'ε' ? '<span class="text-amber-500">ε</span>' : t.read}</td>
                    <td class="py-2 px-2 text-center font-bold code-font">${t.pop === 'ε' ? '<span class="text-amber-500">ε</span>' : t.pop}</td>
                    <td class="py-2 px-2.5 font-bold code-font text-indigo-600 dark:text-indigo-400">${t.to}</td>
                    <td class="py-2 px-2 text-center font-bold code-font">${t.push === 'ε' ? '<span class="text-amber-500">ε</span>' : t.push}</td>
                    <td class="py-2 px-2 text-center">
                        <button onclick="deleteTransition('${t.id}')" class="text-rose-500 hover:text-rose-400 p-1 rounded transition" title="Excluir Transição">
                            ✕
                        </button>
                    </td>
                `;
        tbody.appendChild(tr);
    });
    const scroller = document.getElementById('transition-table-scroll');
    if (firstActive && scroller) scroller.scrollTop = Math.max(0, firstActive.offsetTop - scroller.clientHeight / 2);
}

function deleteTransition(transId) {
    recordSnapshot();
    transitions = transitions.filter(t => t.id !== transId);
    updateStateCount();
    renderTransitionTable();
    validateAutomaton();
    redrawGraph();
    resetSimulation();
}

function clearAutomaton() {
    if (!confirm('Deseja realmente apagar todos os estados e transições?')) return;
    recordSnapshot();
    states = [];
    initialStateId = '';
    acceptingStateIds = [];
    transitions = [];
    updateStateCount();
    renderTransitionTable();
    validateAutomaton();
    redrawGraph();
    resetSimulation();
}

// ----------------- VALIDADOR E DETECTOR DE DETERMINISMO -----------------
function validateAutomaton() {
    const container = document.getElementById('validator-status');
    const classBadge = document.getElementById('pda-class-badge');
    container.innerHTML = '';

    let errors = [];
    let warnings = [];
    let isDeterministic = true;
    let nonDetReasons = [];

    // 1. Estado inicial
    if (!initialStateId || !states.some(s => s.id === initialStateId)) {
        errors.push("Nenhum estado inicial definido (clique com botão direito num estado).");
    }

    // 2. Base da pilha
    if (!initialStackSymbol) {
        errors.push("Símbolo da base da pilha (Z₀) não pode ser vazio.");
    } else if (!stackAlphabet.includes(initialStackSymbol)) {
        warnings.push(`O símbolo da base '${initialStackSymbol}' não consta no alfabeto da pilha Γ.`);
    }

    // 3. Estados finais (se aceitação por estado final ou ambos)
    if ((acceptanceMode === 'final_state' || acceptanceMode === 'both') && acceptingStateIds.length === 0) {
        warnings.push("Nenhum estado final configurado para o critério de aceitação atual.");
    }

    // 4. Análise de Determinismo (APD vs APN)
    // Em um APD, para cada estado q, símbolo de fita a ∈ Σ ∪ {ε} e topo X ∈ Γ ∪ {ε}:
    // - Não pode haver mais de uma transição aplicável simultaneamente.
    // - Se houver transição espontânea com ε na entrada para o topo X, não pode haver transição lendo símbolo para o mesmo topo.
    const fromGroups = {};
    transitions.forEach(t => {
        if (!fromGroups[t.from]) fromGroups[t.from] = [];
        fromGroups[t.from].push(t);
    });

    Object.keys(fromGroups).forEach(fromState => {
        const list = fromGroups[fromState];
        // Checa regras idênticas de leitura/desempilhamento
        for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                const t1 = list[i];
                const t2 = list[j];
                // Mesmo input e mesmo topo
                if (t1.read === t2.read && t1.pop === t2.pop) {
                    isDeterministic = false;
                    const reason = `${fromState}: Múltiplas escolhas com entrada '${t1.read}' e topo '${t1.pop}'`;
                    if (!nonDetReasons.includes(reason)) nonDetReasons.push(reason);
                }
                // Um lê ε e outro lê símbolo no mesmo topo
                if ((t1.read === 'ε' && t2.read !== 'ε' && (t1.pop === t2.pop || t1.pop === 'ε' || t2.pop === 'ε')) ||
                    (t2.read === 'ε' && t1.read !== 'ε' && (t1.pop === t2.pop || t1.pop === 'ε' || t2.pop === 'ε'))) {
                    isDeterministic = false;
                    const reason = `${fromState}: Conflito entre transição ε e transição consumindo entrada`;
                    if (!nonDetReasons.includes(reason)) nonDetReasons.push(reason);
                }
            }
        }
    });

    // Atualiza Badge
    if (isDeterministic) {
        classBadge.className = "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30";
        classBadge.innerText = "APD (Determinístico)";
    } else {
        classBadge.className = "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30";
        classBadge.innerText = "APN (Não Determinístico)";
    }

    // Exibe status formatado
    if (errors.length === 0 && warnings.length === 0) {
        const item = document.createElement('div');
        item.className = "text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium";
        item.innerHTML = `<span>✔</span> <span>Autômato consistente e pronto para simulação.</span>`;
        container.appendChild(item);
    } else {
        errors.forEach(err => {
            const item = document.createElement('div');
            item.className = "text-rose-600 dark:text-rose-400 flex items-start gap-1.5";
            item.innerHTML = `<span>❌</span> <span>${err}</span>`;
            container.appendChild(item);
        });
        warnings.forEach(w => {
            const item = document.createElement('div');
            item.className = "text-amber-600 dark:text-amber-400 flex items-start gap-1.5";
            item.innerHTML = `<span>⚠</span> <span>${w}</span>`;
            container.appendChild(item);
        });
    }

    if (!isDeterministic && nonDetReasons.length > 0) {
        const nonDetNote = document.createElement('div');
        nonDetNote.className = "text-purple-600 dark:text-purple-400 text-[11px] mt-1 pt-1 border-t border-purple-500/20";
        nonDetNote.innerHTML = `<strong>Não determinismo detectado:</strong><br>${nonDetReasons.slice(0, 2).join('<br>')}`;
        container.appendChild(nonDetNote);
    }
}
