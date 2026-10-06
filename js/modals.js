/* Modal de transição */
// ----------------- MODAL DE TRANSIÇÃO -----------------
function openNewTransitionModal(fromId = null, toId = null) {
    if (states.length === 0) {
        alert('Crie ao menos um estado antes de adicionar transições.');
        return;
    }

    modalCurrentFrom = fromId || (states[0] ? states[0].id : '');
    modalCurrentTo = toId || modalCurrentFrom;

    const fromSelect = document.getElementById('modal-from-state');
    const toSelect = document.getElementById('modal-to-state');
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    states.forEach(s => {
        const opt1 = document.createElement('option');
        opt1.value = s.id; opt1.innerText = s.id;
        fromSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = s.id; opt2.innerText = s.id;
        toSelect.appendChild(opt2);
    });

    fromSelect.value = modalCurrentFrom;
    toSelect.value = modalCurrentTo;

    fromSelect.onchange = () => {
        modalCurrentFrom = fromSelect.value;
        updateModalExistingList();
    };
    toSelect.onchange = () => {
        modalCurrentTo = toSelect.value;
        updateModalExistingList();
    };

    // Sugere valores padrão coerentes com os alfabetos
    document.getElementById('modal-read-sym').value = alphabet[0] || 'a';
    document.getElementById('modal-pop-sym').value = initialStackSymbol || 'Z0';
    document.getElementById('modal-push-str').value = (stackAlphabet[0] || 'A') + (initialStackSymbol || 'Z0');

    updateModalExistingList();
    document.getElementById('transition-modal').classList.remove('hidden');
}

function setModalRead(sym) {
    document.getElementById('modal-read-sym').value = sym;
}
function setModalPop(sym) {
    document.getElementById('modal-pop-sym').value = sym;
}
function setModalPush(sym) {
    document.getElementById('modal-push-str').value = sym;
}

function updateModalExistingList() {
    document.getElementById('modal-from-label').innerText = modalCurrentFrom;
    document.getElementById('modal-to-label').innerText = modalCurrentTo;

    const container = document.getElementById('modal-existing-transitions');
    container.innerHTML = '';

    const list = transitions.filter(t => t.from === modalCurrentFrom && t.to === modalCurrentTo);
    if (list.length === 0) {
        container.innerHTML = `<span class="text-slate-400 italic py-1">Nenhuma regra cadastrada entre ${modalCurrentFrom} e ${modalCurrentTo}.</span>`;
        return;
    }

    list.forEach(t => {
        const item = document.createElement('div');
        item.className = "flex items-center justify-between p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800";
        item.innerHTML = `
                    <span class="font-bold code-font text-indigo-600 dark:text-indigo-400">
                        ${t.read}, ${t.pop} ➔ ${t.push}
                    </span>
                    <button onclick="deleteTransitionFromModal('${t.id}')" class="text-rose-500 hover:text-rose-400 text-xs px-1.5 py-0.5 rounded font-bold">
                        Excluir
                    </button>
                `;
        container.appendChild(item);
    });
}

function addTransitionFromModalForm() {
    const read = document.getElementById('modal-read-sym').value.trim() || 'ε';
    const pop = document.getElementById('modal-pop-sym').value.trim() || 'ε';
    const push = document.getElementById('modal-push-str').value.trim() || 'ε';

    // Valida duplicata
    const exists = transitions.some(t => 
        t.from === modalCurrentFrom && 
        t.to === modalCurrentTo && 
        t.read === read && 
        t.pop === pop && 
        t.push === push
    );

    if (exists) {
        alert('Esta transição exata já existe entre estes dois estados.');
        return;
    }

    recordSnapshot();
    transitions.push({
        id: 't_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        from: modalCurrentFrom,
        to: modalCurrentTo,
        read,
        pop,
        push
    });

    updateStateCount();
    renderTransitionTable();
    validateAutomaton();
    redrawGraph();
    resetSimulation();
    updateModalExistingList();
}

function deleteTransitionFromModal(transId) {
    deleteTransition(transId);
    updateModalExistingList();
}

function closeTransitionModal() {
    document.getElementById('transition-modal').classList.add('hidden');
}
