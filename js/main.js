/* Inicialização da página */
// ----------------- INICIALIZAÇÃO -----------------
window.addEventListener('load', () => {
    initTheme();
    setupCanvasSize();
    const saved = loadFromLocalStorage();   // continua de onde o aluno parou
    if (saved) {
        applyModelData(saved);
    } else {
        loadExample('anbn'); // Carrega aⁿbⁿ como exemplo inicial
    }
    setInterval(saveToLocalStorage, 1500);
    window.addEventListener('beforeunload', saveToLocalStorage);
    window.addEventListener('resize', () => {
        setupCanvasSize();
        redrawGraph();
    });
    setupCanvasEvents();
    setupKeyboardShortcuts();
});
