const { loadApp, makeRunner } = require('./_harness.js');
const { test, eq, summary } = makeRunner();

const NAMES = ['loadExample', 'evaluateWord', 'startSingleSimulation', 'simStepForward', 'simStepBack', 'simStepFirst',
    'simStepLast', 'simTogglePlay', 'activeRuleIds', 'saveToLocalStorage', 'loadFromLocalStorage', 'applyModelData',
    'generateTikzCode', 'generateFullTeX', 'exportCanvasToPNG', 'isDarkTheme', 'states', 'transitions', 'simTrace',
    'simStepIndex', 'undo', 'redo', 'initialStateId', 'acceptingStateIds', 'runBatchTests', 'exportToJSON', 'currentModel'];
const { app, els, storage, fire } = loadApp(NAMES, { 'state-table-filter': 'all', 'sim-input-string': 'aabb', 'sim-speed-range': '800' });
fire('load');   // roda a inicialização da página (exemplo inicial)

const ex = {
    anbn: { acc: ['ab', 'aabb', 'aaabbb'], rej: ['', 'a', 'b', 'ba', 'aab', 'abb', 'abab'] },
    wcwr: { acc: ['c', 'aca', 'abcba', 'bacab'], rej: ['', 'ab', 'abcab', 'abc', 'cc'] },
    wwr: { acc: ['00', '11', '0110', '1001', '100001'], rej: ['0', '1', '01', '1010', '010'] },
    parens: { acc: ['()', '(())', '()()', '(()())'], rej: ['(', ')', '())', ')(', '(()'] },
    anb2n: { acc: ['abb', 'aabbbb'], rej: ['ab', 'abbb', 'aabbb', 'ba'] }
};
for (const [key, cases] of Object.entries(ex)) {
    app.loadExample(key);
    for (const w of cases.acc) test(`${key}: aceita "${w}"`, () => eq(app.evaluateWord(w), true));
    for (const w of cases.rej) test(`${key}: rejeita "${w}"`, () => eq(app.evaluateWord(w), false));
}

app.loadExample('anbn');
test('simulação pré-calcula os passos', () => { els['sim-input-string'].value = 'aabb'; app.startSingleSimulation(); return app.simTrace.length > 1; });
test('regra aplicada fica destacada (ids)', () => { app.simStepForward(); return app.activeRuleIds().size >= 1; });
test('ir ao fim e ao início', () => { app.simStepLast(); const last = app.simStepIndex; app.simStepFirst(); return last === app.simTrace.length - 1 && app.simStepIndex === 0; });

test('salvar e restaurar o trabalho', () => {
    app.loadExample('wcwr');
    app.saveToLocalStorage();
    const saved = app.loadFromLocalStorage();
    return saved && saved.states.length === app.states.length && saved.transitions.length === app.transitions.length;
});
test('não grava máquina vazia por cima do trabalho salvo', () => {
    const keep = storage.store.ap_model_autosave;
    app.applyModelData({ states: [], transitions: [] });
    app.saveToLocalStorage();
    return storage.store.ap_model_autosave === keep;
});
test('restaura de verdade ao abrir (init lê o salvo)', () => {
    app.loadExample('parens'); app.saveToLocalStorage();
    const fresh = loadApp(NAMES, { 'state-table-filter': 'all' });
    fresh.storage.store.ap_model_autosave = storage.store.ap_model_autosave;
    fresh.fire('load');
    return fresh.app.states.length === app.states.length;
});

for (const key of Object.keys(ex)) {
    app.loadExample(key);
    const tex = app.generateTikzCode();
    test(`TikZ ${key}: \varepsilon só dentro de $...$`, () => !tex.replace(/\$[^$]*\$/g, '').includes('\varepsilon'));
    test(`TikZ ${key}: laços usam loop above e rótulos em modo matemático`, () => /loop above/.test(tex) && !/node \{[^$}]*[a-zA-Z]/.test(tex.replace(/\$[^$]*\$/g, '')));
}
test('documento .tex completo', () => { const t = app.generateFullTeX(); return t.includes('\documentclass') && t.includes('\end{document}'); });
test('PNG: exporta sem erro e mantém o tema', () => { const d = app.isDarkTheme(); app.exportCanvasToPNG(); return app.isDarkTheme() === d; });

summary();
