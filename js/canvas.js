/* Desenho do grafo e interação com o canvas */
// ----------------- RENDERIZADOR CANVAS BIDIMENSIONAL -----------------
function setupCanvasSize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
}

function redrawGraph(simHighlight = null) {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const dark = isDarkTheme();

    ctx.clearRect(0, 0, width, height);

    // Grade suave de fundo
    drawGridBackground(width, height, dark);

    // 1. Desenha transições
    drawTransitions(ctx, simHighlight);

    // 2. Se estiver criando transição por arraste
    if (isDrawingTransition && transitionSourceNode) {
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(transitionSourceNode.x, transitionSourceNode.y);
        ctx.lineTo(transitionTempTargetPos.x, transitionTempTargetPos.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 3. Desenha estados
    states.forEach(node => {
        const isInitial = (node.id === initialStateId);
        const isAccepting = acceptingStateIds.includes(node.id);
        const isSelected = selectedStateIds.includes(node.id);
        const isSimActive = simHighlight && simHighlight.activeStates && simHighlight.activeStates.includes(node.id);

        drawNode(ctx, node, isInitial, isAccepting, isSelected, isSimActive, dark);
    });
}

function drawGridBackground(width, height, dark) {
    ctx.save();
    ctx.strokeStyle = dark ? 'rgba(51, 65, 85, 0.25)' : 'rgba(226, 232, 240, 0.7)';
    ctx.lineWidth = 1;
    const gridSize = 28;
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawNode(c, node, isInitial, isAccepting, isSelected, isSimActive, dark) {
    const x = node.x;
    const y = node.y;

    // Halo de simulação ativa (Glow)
    if (isSimActive) {
        c.save();
        c.beginPath();
        c.arc(x, y, nodeRadius + 9, 0, Math.PI * 2);
        c.fillStyle = 'rgba(99, 102, 241, 0.25)';
        c.fill();
        c.beginPath();
        c.arc(x, y, nodeRadius + 4, 0, Math.PI * 2);
        c.fillStyle = 'rgba(99, 102, 241, 0.45)';
        c.fill();
        c.restore();
    }

    // Halo de seleção
    if (isSelected) {
        c.save();
        c.beginPath();
        c.arc(x, y, nodeRadius + 5, 0, Math.PI * 2);
        c.strokeStyle = '#6366f1';
        c.lineWidth = 2.5;
        c.stroke();
        c.restore();
    }

    // Círculo principal do estado
    c.beginPath();
    c.arc(x, y, nodeRadius, 0, Math.PI * 2);
    c.fillStyle = dark ? '#0f172a' : '#ffffff';
    c.fill();

    c.strokeStyle = isSimActive ? '#6366f1' : (dark ? '#64748b' : '#94a3b8');
    c.lineWidth = isSimActive ? 3 : 2;
    c.stroke();

    // Círculo duplo para estado de aceitação
    if (isAccepting) {
        c.beginPath();
        c.arc(x, y, nodeRadius - 4.5, 0, Math.PI * 2);
        c.strokeStyle = isSimActive ? '#6366f1' : (dark ? '#64748b' : '#94a3b8');
        c.lineWidth = 1.5;
        c.stroke();
    }

    // Seta de estado inicial
    if (isInitial) {
        c.save();
        c.strokeStyle = dark ? '#a5b4fc' : '#4f46e5';
        c.fillStyle = dark ? '#a5b4fc' : '#4f46e5';
        c.lineWidth = 2.5;

        const arrowLen = 22;
        const startX = x - nodeRadius - arrowLen;
        const startY = y;
        const endX = x - nodeRadius;
        const endY = y;

        c.beginPath();
        c.moveTo(startX, startY);
        c.lineTo(endX, endY);
        c.stroke();

        drawArrowHead(c, endX, endY, 0);
        c.restore();
    }

    // Rótulo do estado (ex: q0, q1)
    c.fillStyle = dark ? '#f8fafc' : '#0f172a';
    c.font = "bold 13px 'Fira Code', monospace";
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(node.id, x, y);
}

function drawTransitions(c, simHighlight) {
    const dark = isDarkTheme();

    // Agrupa transições por par (origem -> destino)
    const edgeMap = {}; // key: "from->to" => [trans1, trans2, ...]
    transitions.forEach(t => {
        const key = `${t.from}->${t.to}`;
        if (!edgeMap[key]) edgeMap[key] = [];
        edgeMap[key].push(t);
    });

    Object.keys(edgeMap).forEach(key => {
        const [fromId, toId] = key.split('->');
        const fromNode = states.find(s => s.id === fromId);
        const toNode = states.find(s => s.id === toId);
        if (!fromNode || !toNode) return;

        const list = edgeMap[key];
        // Formato padrão das regras: "a, X → α"
        const labels = list.map(t => `${t.read}, ${t.pop} → ${t.push}`);

        // Verifica se a transição está ativa na simulação atual
        let isActive = false;
        if (simHighlight && simHighlight.activeTransitions) {
            isActive = simHighlight.activeTransitions.some(at => at.from === fromId && at.to === toId);
        }

        if (fromId === toId) {
            drawSelfLoop(c, fromNode, labels, isActive, dark);
        } else {
            const reverseKey = `${toId}->${fromId}`;
            const hasReverse = !!edgeMap[reverseKey];
            drawEdge(c, fromNode, toNode, labels, hasReverse, isActive, dark);
        }
    });
}

function drawSelfLoop(c, node, labels, isActive, dark) {
    const x = node.x;
    const y = node.y - nodeRadius;

    const strokeStyle = isActive ? '#6366f1' : (dark ? '#64748b' : '#94a3b8');
    c.strokeStyle = strokeStyle;
    c.lineWidth = isActive ? 3 : 1.8;

    c.beginPath();
    c.arc(x, y - 14, 18, Math.PI * 0.1, Math.PI * 0.9, true);
    c.stroke();

    // Cabeça da seta
    const arrowAngle = Math.PI * 0.1;
    const arrowX = x + 16 * Math.cos(arrowAngle);
    const arrowY = y - 11 + 16 * Math.sin(arrowAngle);
    drawArrowHead(c, arrowX, arrowY, Math.PI * 0.65);

    // Rótulos empilhados
    drawPillLabels(c, x, y - 36, labels, isActive, dark);
}

function drawEdge(c, from, to, labels, isCurved, isActive, dark) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy;
    const py = ux;

    const strokeStyle = isActive ? '#6366f1' : (dark ? '#64748b' : '#94a3b8');
    c.strokeStyle = strokeStyle;
    c.lineWidth = isActive ? 3 : 1.8;

    if (isCurved) {
        const bend = 26;
        const midX = (from.x + to.x) / 2 + px * bend;
        const midY = (from.y + to.y) / 2 + py * bend;

        const targetX = to.x - ux * nodeRadius + px * 6;
        const targetY = to.y - uy * nodeRadius + py * 6;
        const startX = from.x + ux * nodeRadius + px * 6;
        const startY = from.y + uy * nodeRadius + py * 6;

        c.beginPath();
        c.moveTo(startX, startY);
        c.quadraticCurveTo(midX, midY, targetX, targetY);
        c.stroke();

        const angle = Math.atan2(targetY - midY, targetX - midX);
        drawArrowHead(c, targetX, targetY, angle);

        drawPillLabels(c, midX + px * 6, midY + py * 6, labels, isActive, dark);
    } else {
        const startX = from.x + ux * nodeRadius;
        const startY = from.y + uy * nodeRadius;
        const endX = to.x - ux * nodeRadius;
        const endY = to.y - uy * nodeRadius;

        c.beginPath();
        c.moveTo(startX, startY);
        c.lineTo(endX, endY);
        c.stroke();

        const angle = Math.atan2(dy, dx);
        drawArrowHead(c, endX, endY, angle);

        const midX = (startX + endX) / 2 + px * 14;
        const midY = (startY + endY) / 2 + py * 14;
        drawPillLabels(c, midX, midY, labels, isActive, dark);
    }
}

function drawPillLabels(c, cx, cy, labels, isActive, dark) {
    c.save();
    c.font = "bold 11px 'Fira Code', monospace";
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    const lineSpacing = 14;
    const totalHeight = labels.length * lineSpacing;
    let startY = cy - totalHeight / 2 + lineSpacing / 2;

    labels.forEach((text, i) => {
        const ly = startY + i * lineSpacing;
        const metrics = c.measureText(text);
        const pillWidth = metrics.width + 10;
        const pillHeight = 13;

        // Fundo do pill para leitura nítida
        c.fillStyle = dark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.9)';
        c.fillRect(cx - pillWidth / 2, ly - pillHeight / 2, pillWidth, pillHeight);

        c.fillStyle = isActive ? (dark ? '#a5b4fc' : '#4f46e5') : (dark ? '#cbd5e1' : '#334155');
        c.fillText(text, cx, ly);
    });
    c.restore();
}

function drawArrowHead(c, x, y, angle) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = c.strokeStyle;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-10, -5);
    c.lineTo(-10, 5);
    c.closePath();
    c.fill();
    c.restore();
}

// ----------------- INTERATIVIDADE DO CANVAS (MOUSE & TOQUE) -----------------
function setupCanvasEvents() {
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    window.addEventListener('mousemove', onCanvasMouseMove);
    window.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('dblclick', onCanvasDoubleClick);
    canvas.addEventListener('contextmenu', onCanvasContextMenu);

    // Fecha menu de contexto ao clicar em qualquer lugar
    window.addEventListener('click', () => {
        document.getElementById('canvas-context-menu').classList.add('hidden');
    });
}

function getCanvasMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function findNodeAt(pos) {
    for (let i = states.length - 1; i >= 0; i--) {
        const node = states[i];
        const dx = node.x - pos.x;
        const dy = node.y - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) <= nodeRadius + 4) {
            return node;
        }
    }
    return null;
}

function onCanvasMouseDown(e) {
    if (e.button !== 0) return; // apenas botão esquerdo
    const pos = getCanvasMousePos(e);
    const clickedNode = findNodeAt(pos);

    // Se modo de desenho de transição ou com Shift pressionado
    if (canvasMode === 'transition' || e.shiftKey) {
        if (clickedNode) {
            isDrawingTransition = true;
            transitionSourceNode = clickedNode;
            transitionTempTargetPos = { ...pos };
        }
        return;
    }

    // Modo mover nós
    if (clickedNode) {
        isDragging = true;
        selectedNode = clickedNode;
        if (!selectedStateIds.includes(clickedNode.id)) {
            selectedStateIds = [clickedNode.id];
        }
        dragStartPos = pos;
        initialSelectedPositions = selectedStateIds.map(id => {
            const n = states.find(s => s.id === id);
            return { id, x: n.x, y: n.y };
        });
    } else {
        selectedStateIds = [];
    }
    redrawGraph();
}

function onCanvasMouseMove(e) {
    const pos = getCanvasMousePos(e);

    if (isDrawingTransition) {
        transitionTempTargetPos = pos;
        redrawGraph();
        return;
    }

    if (isDragging && selectedNode) {
        const dx = pos.x - dragStartPos.x;
        const dy = pos.y - dragStartPos.y;
        initialSelectedPositions.forEach(item => {
            const node = states.find(s => s.id === item.id);
            if (node) {
                node.x = Math.max(nodeRadius + 10, Math.min(canvas.width / (window.devicePixelRatio || 1) - nodeRadius - 10, item.x + dx));
                node.y = Math.max(nodeRadius + 10, Math.min(canvas.height / (window.devicePixelRatio || 1) - nodeRadius - 10, item.y + dy));
            }
        });
        redrawGraph();
    }
}

function onCanvasMouseUp(e) {
    if (isDrawingTransition) {
        const pos = getCanvasMousePos(e);
        const targetNode = findNodeAt(pos);
        if (transitionSourceNode && targetNode) {
            openNewTransitionModal(transitionSourceNode.id, targetNode.id);
        }
        isDrawingTransition = false;
        transitionSourceNode = null;
        redrawGraph();
        return;
    }

    if (isDragging) {
        isDragging = false;
        selectedNode = null;
        saveToLocalStorage();
    }
}

function onCanvasDoubleClick(e) {
    const pos = getCanvasMousePos(e);
    const clickedNode = findNodeAt(pos);

    if (clickedNode) {
        // Duplo clique no nó alterna aceitação
        recordSnapshot();
        if (acceptingStateIds.includes(clickedNode.id)) {
            acceptingStateIds = acceptingStateIds.filter(id => id !== clickedNode.id);
        } else {
            acceptingStateIds.push(clickedNode.id);
        }
        updateFilterOptions();
        validateAutomaton();
        redrawGraph();
    } else {
        // Duplo clique no vazio cria novo estado
        recordSnapshot();
        const id = getNextStateId();
        states.push({ id, x: pos.x, y: pos.y });
        if (!initialStateId) initialStateId = id;
        updateStateCount();
        renderTransitionTable();
        validateAutomaton();
        redrawGraph();
    }
}

function onCanvasContextMenu(e) {
    e.preventDefault();
    const pos = getCanvasMousePos(e);
    const clickedNode = findNodeAt(pos);

    if (clickedNode) {
        contextNode = clickedNode;
        const menu = document.getElementById('canvas-context-menu');
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.classList.remove('hidden');
    }
}

// Ações do Menu de Contexto
function contextSetInitial() {
    if (!contextNode) return;
    recordSnapshot();
    initialStateId = contextNode.id;
    updateFilterOptions();
    validateAutomaton();
    redrawGraph();
}

function contextToggleAcceptance() {
    if (!contextNode) return;
    recordSnapshot();
    if (acceptingStateIds.includes(contextNode.id)) {
        acceptingStateIds = acceptingStateIds.filter(id => id !== contextNode.id);
    } else {
        acceptingStateIds.push(contextNode.id);
    }
    updateFilterOptions();
    validateAutomaton();
    redrawGraph();
}

function contextOpenRename() {
    if (!contextNode) return;
    renameTargetId = contextNode.id;
    document.getElementById('rename-state-input').value = contextNode.id;
    document.getElementById('rename-modal').classList.remove('hidden');
}

function confirmRenameState() {
    const newName = document.getElementById('rename-state-input').value.trim();
    if (!newName) return;
    if (states.some(s => s.id === newName && s.id !== renameTargetId)) {
        alert('Já existe um estado com este nome.');
        return;
    }

    recordSnapshot();
    // Atualiza nós
    const node = states.find(s => s.id === renameTargetId);
    if (node) node.id = newName;

    // Atualiza inicial e finais
    if (initialStateId === renameTargetId) initialStateId = newName;
    acceptingStateIds = acceptingStateIds.map(id => id === renameTargetId ? newName : id);

    // Atualiza transições
    transitions.forEach(t => {
        if (t.from === renameTargetId) t.from = newName;
        if (t.to === renameTargetId) t.to = newName;
    });

    closeRenameModal();
    updateStateCount();
    renderTransitionTable();
    validateAutomaton();
    redrawGraph();
}

function closeRenameModal() {
    document.getElementById('rename-modal').classList.add('hidden');
}

function contextAddSelfTransition() {
    if (!contextNode) return;
    openNewTransitionModal(contextNode.id, contextNode.id);
}

function contextDeleteState() {
    if (!contextNode) return;
    recordSnapshot();
    const delId = contextNode.id;
    states = states.filter(s => s.id !== delId);
    if (initialStateId === delId) initialStateId = states[0] ? states[0].id : '';
    acceptingStateIds = acceptingStateIds.filter(id => id !== delId);
    transitions = transitions.filter(t => t.from !== delId && t.to !== delId);

    updateStateCount();
    renderTransitionTable();
    validateAutomaton();
    redrawGraph();
    resetSimulation();
}

// Alternador Modo Mover Nós / Criar Transição
function toggleDrawMode() {
    canvasMode = (canvasMode === 'drag' ? 'transition' : 'drag');
    const btn = document.getElementById('btn-draw-mode');
    const ind = document.getElementById('draw-mode-indicator');
    if (canvasMode === 'transition') {
        btn.classList.add('bg-indigo-600', 'text-white');
        btn.classList.remove('bg-slate-200', 'dark:bg-slate-800');
        ind.classList.replace('bg-slate-400', 'bg-emerald-400');
        btn.querySelector('.btn-text').innerText = "Criando Arestas";
    } else {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-slate-200', 'dark:bg-slate-800');
        ind.classList.replace('bg-emerald-400', 'bg-slate-400');
        btn.querySelector('.btn-text').innerText = "Mover Nós";
    }
}

function toggleToolbarSize() {
    isToolbarCompact = !isToolbarCompact;
    const container = document.getElementById('graph-toolbar-controls');
    container.classList.toggle('toolbar-compact', isToolbarCompact);
    document.getElementById('compact-toggle-text').innerText = isToolbarCompact ? "Expandir" : "Modo Compacto";
}

// Layouts Automáticos e Alinhamentos
function autoLayoutCircle() {
    if (states.length === 0) return;
    recordSnapshot();
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(cx, cy) - 55;
    const angleStep = (Math.PI * 2) / states.length;

    states.forEach((node, i) => {
        node.x = cx + radius * Math.cos(i * angleStep - Math.PI / 2);
        node.y = cy + radius * Math.sin(i * angleStep - Math.PI / 2);
    });
    redrawGraph();
}

function layoutGrid() {
    if (states.length === 0) return;
    recordSnapshot();
    const cols = Math.ceil(Math.sqrt(states.length));
    const spacingX = 130;
    const spacingY = 110;
    const startX = 100;
    const startY = 100;

    states.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        node.x = startX + col * spacingX;
        node.y = startY + row * spacingY;
    });
    redrawGraph();
}

function manualCenterGraph() {
    if (states.length === 0) return;
    recordSnapshot();
    const rect = canvas.getBoundingClientRect();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    states.forEach(s => {
        if (s.x < minX) minX = s.x;
        if (s.x > maxX) maxX = s.x;
        if (s.y < minY) minY = s.y;
        if (s.y > maxY) maxY = s.y;
    });

    const currentCx = (minX + maxX) / 2;
    const currentCy = (minY + maxY) / 2;
    const targetCx = rect.width / 2;
    const targetCy = rect.height / 2;

    const dx = targetCx - currentCx;
    const dy = targetCy - currentCy;

    states.forEach(s => {
        s.x += dx;
        s.y += dy;
    });
    redrawGraph();
}

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
        }
    });
}
