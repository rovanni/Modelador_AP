/* Exemplos clássicos */
// ----------------- BIBLIOTECA DE EXEMPLOS CLÁSSICOS -----------------
function loadExample(key) {
    recordSnapshot();

    if (key === 'anbn') {
        // L = { a^n b^n | n >= 1 }
        alphabet = ['a', 'b'];
        stackAlphabet = ['A', 'Z0'];
        initialStackSymbol = 'Z0';
        acceptanceMode = 'final_state';
        states = [
            { id: 'q0', x: 140, y: 200 },
            { id: 'q1', x: 320, y: 200 },
            { id: 'q2', x: 500, y: 200 }
        ];
        initialStateId = 'q0';
        acceptingStateIds = ['q2'];
        transitions = [
            { id: 't1', from: 'q0', to: 'q0', read: 'a', pop: 'Z0', push: 'AZ0' },
            { id: 't2', from: 'q0', to: 'q0', read: 'a', pop: 'A', push: 'AA' },
            { id: 't3', from: 'q0', to: 'q1', read: 'b', pop: 'A', push: 'ε' },
            { id: 't4', from: 'q1', to: 'q1', read: 'b', pop: 'A', push: 'ε' },
            { id: 't5', from: 'q1', to: 'q2', read: 'ε', pop: 'Z0', push: 'Z0' }
        ];
        document.getElementById('sim-input-string').value = "aaabbb";
        document.getElementById('batch-input-textarea').value = "ab\naabb\naaabbb\na\nb\naab\nabb\nba";
    } else if (key === 'wcwr') {
        // L = { w c w^R | w in {a,b}* } (Determinístico)
        alphabet = ['a', 'b', 'c'];
        stackAlphabet = ['A', 'B', 'Z0'];
        initialStackSymbol = 'Z0';
        acceptanceMode = 'final_state';
        states = [
            { id: 'q0', x: 140, y: 200 },
            { id: 'q1', x: 330, y: 200 },
            { id: 'q2', x: 520, y: 200 }
        ];
        initialStateId = 'q0';
        acceptingStateIds = ['q2'];
        transitions = [
            { id: 't1', from: 'q0', to: 'q0', read: 'a', pop: 'ε', push: 'A' },
            { id: 't2', from: 'q0', to: 'q0', read: 'b', pop: 'ε', push: 'B' },
            { id: 't3', from: 'q0', to: 'q1', read: 'c', pop: 'ε', push: 'ε' },
            { id: 't4', from: 'q1', to: 'q1', read: 'a', pop: 'A', push: 'ε' },
            { id: 't5', from: 'q1', to: 'q1', read: 'b', pop: 'B', push: 'ε' },
            { id: 't6', from: 'q1', to: 'q2', read: 'ε', pop: 'Z0', push: 'Z0' }
        ];
        document.getElementById('sim-input-string').value = "abcba";
        document.getElementById('batch-input-textarea').value = "c\naca\nbcb\nabcba\nbaab\nabca";
    } else if (key === 'wwr') {
        // L = { w w^R | w in {0,1}* } (Não Determinístico - adivinha o meio)
        alphabet = ['0', '1'];
        stackAlphabet = ['0', '1', 'Z0'];
        initialStackSymbol = 'Z0';
        acceptanceMode = 'final_state';
        states = [
            { id: 'q0', x: 150, y: 200 },
            { id: 'q1', x: 340, y: 200 },
            { id: 'q2', x: 530, y: 200 }
        ];
        initialStateId = 'q0';
        acceptingStateIds = ['q2'];
        transitions = [
            { id: 't1', from: 'q0', to: 'q0', read: '0', pop: 'ε', push: '0' },
            { id: 't2', from: 'q0', to: 'q0', read: '1', pop: 'ε', push: '1' },
            // Transição espontânea para q1 adivinhando a metade:
            { id: 't3', from: 'q0', to: 'q1', read: 'ε', pop: 'ε', push: 'ε' },
            { id: 't4', from: 'q1', to: 'q1', read: '0', pop: '0', push: 'ε' },
            { id: 't5', from: 'q1', to: 'q1', read: '1', pop: '1', push: 'ε' },
            { id: 't6', from: 'q1', to: 'q2', read: 'ε', pop: 'Z0', push: 'Z0' }
        ];
        document.getElementById('sim-input-string').value = "1001";
        document.getElementById('batch-input-textarea').value = "00\n11\n0110\n1001\n1010\n01";
    } else if (key === 'parens') {
        // Parênteses balanceados: '(', ')'
        alphabet = ['(', ')'];
        stackAlphabet = ['X', 'Z0'];
        initialStackSymbol = 'Z0';
        acceptanceMode = 'final_state';
        states = [
            { id: 'q0', x: 160, y: 200 },
            { id: 'q1', x: 380, y: 200 }
        ];
        initialStateId = 'q0';
        acceptingStateIds = ['q1'];
        transitions = [
            { id: 't1', from: 'q0', to: 'q0', read: '(', pop: 'ε', push: 'X' },
            { id: 't2', from: 'q0', to: 'q0', read: ')', pop: 'X', push: 'ε' },
            { id: 't3', from: 'q0', to: 'q1', read: 'ε', pop: 'Z0', push: 'Z0' }
        ];
        document.getElementById('sim-input-string').value = "(())()";
        document.getElementById('batch-input-textarea').value = "()\n(())\n()()\n(()())\n(\n)\n)(";
    } else if (key === 'anb2n') {
        // L = { a^n b^2n | n >= 1 }
        alphabet = ['a', 'b'];
        stackAlphabet = ['A', 'Z0'];
        initialStackSymbol = 'Z0';
        acceptanceMode = 'final_state';
        states = [
            { id: 'q0', x: 140, y: 200 },
            { id: 'q1', x: 330, y: 200 },
            { id: 'q2', x: 520, y: 200 }
        ];
        initialStateId = 'q0';
        acceptingStateIds = ['q2'];
        transitions = [
            { id: 't1', from: 'q0', to: 'q0', read: 'a', pop: 'Z0', push: 'AAZ0' },
            { id: 't2', from: 'q0', to: 'q0', read: 'a', pop: 'A', push: 'AAA' },
            { id: 't3', from: 'q0', to: 'q1', read: 'b', pop: 'A', push: 'ε' },
            { id: 't4', from: 'q1', to: 'q1', read: 'b', pop: 'A', push: 'ε' },
            { id: 't5', from: 'q1', to: 'q2', read: 'ε', pop: 'Z0', push: 'Z0' }
        ];
        document.getElementById('sim-input-string').value = "abb";
        document.getElementById('batch-input-textarea').value = "abb\naabbbb\naaabbbbbb\nab\naabb\nbb";
    }

    applyModelData({
        alphabet,
        stackAlphabet,
        initialStackSymbol,
        acceptanceMode,
        states,
        initialStateId,
        acceptingStateIds,
        transitions
    });
}
