# 💻 Modelador de Autômatos com Pilha (AP) Interativo

> Um editor e simulador visual moderno, interativo e de alta fidelidade para **Autômatos de Pilha (AP / Pushdown Automata)**, cobrindo tanto autômatos determinísticos (**APD**) quanto não-determinísticos (**APN**).

Este projeto foi desenvolvido com foco em excelência pedagógica, rigor formal e riqueza estética para apoiar estudantes e professores nas disciplinas de **Teoria da Computação**, **Linguagens Formais e Autômatos** e **Compiladores** da **Universidade Estadual do Norte do Paraná (UENP)** (Prof. Luciano Rovanni).

O sistema funciona inteiramente no navegador (*client-side*), dispensando instalações complexas, servidores ou dependências externas — basta abrir o arquivo no seu navegador com um duplo clique!

---

## ✨ Principais Funcionalidades

### 🧠 1. Modelagem Completa da 7-Tupla Formal
*   **Definição Matemática Precisa**: $M = (Q, \Sigma, \Gamma, \delta, q_0, Z_0, F)$.
*   **Alfabetos Separados**:
    *   $\Sigma$: Alfabeto de entrada lido da fita.
    *   $\Gamma$: Alfabeto de símbolos armazenáveis na pilha.
    *   $Z_0$: Símbolo marcador da base da pilha (configurável).
*   **Transições Triplas Intuitivas**:
    *   Formato padrão: `a, X → α` (*Lê da fita, Desempilha do topo → Empilha cadeia*).
    *   Suporte a transições espontâneas com $\varepsilon$ tanto na fita quanto na pilha.
*   **Critérios de Aceitação Customizáveis**:
    *   **Por Estado Final** ($L(M)$): palavra consumida e autômato em $q \in F$.
    *   **Por Pilha Vazia** ($N(M)$): palavra consumida e pilha totalmente esvaziada.
    *   **Por Ambos**: estado final E pilha vazia simultaneamente.
*   **Validador & Classificador Automático**:
    *   Detecta automaticamente se o autômato é um **APD (Determinístico)** ou **APN (Não Determinístico)** e explica os motivos de eventuais ambiguidades.

### 📦 2. Visualizador Físico da Pilha (Exclusivo)
*   **Representação Gráfica em Tempo Real**: Uma estrutura vertical estilizada exibindo cada elemento da pilha em caixas animadas.
*   **Destaque do Topo e da Base**: Identificação visual nítida do elemento no topo da pilha e do marcador de fundo $Z_0$.
*   **Badges de Operação**: Sinalização colorida imediata de `PUSH` (verde), `POP` (amarelo) e manutenção de topo.
*   **Contador Dinâmico de Altura**: Exibição da quantidade exata de símbolos empilhados a cada passo.

### 📊 3. Simulação Passo a Passo & Exploração de Ramos (APN)
*   **Fita de Entrada Interativa**: Visualização de cada caractere em células individuais com cabeçote de leitura em tempo real.
*   **Controle de Reprodução Completo**: *Play/Pause*, *Passo Anterior*, *Próximo Passo*, *Início*, *Fim* e controle de velocidade.
*   **Explorador de Ramos Não-Determinísticos**:
    *   Se o autômato bifurcar caminhos (como em palíndromos $w w^R$), todas as configurações ativas $(q, \text{pilha}, \text{fita})$ são exibidas em cartões interativos.
    *   Clique em qualquer ramo para que a Pilha Visual e o Canvas passem a acompanhar a execução daquele ramo específico!
    *   Destaque com crachá e banner quando um ramo atinge o critério de aceitação.
*   **Testes em Lote (Batch Testing)**:
    *   Cole dezenas de palavras simultaneamente para validação instantânea com badges de sucesso/rejeição e estatísticas.

### 🎨 4. Canvas Interativo de Alta Definição
*   **Design Moderno & Temas**: Alternância instantânea entre **Modo Escuro** e **Modo Claro**.
*   **Edição Totalmente Visual**:
    *   **Criação Rápida**: Duplo clique no vazio para criar estados.
    *   **Conexão por Arraste**: Segure `Shift` e arraste de um estado até outro para abrir o modal de transição de pilha.
    *   **Menu de Contexto (Botão Direito)**: Definir como Inicial, Alternar Final, Renomear, Criar Laço ou Excluir.
*   **Ferramentas de Layout & Alinhamento**:
    *   Organização automática em **Círculo** ou **Grade**.
    *   Centralização com um clique.
    *   Histórico completo de **Desfazer (`Ctrl+Z`)** e **Refazer (`Ctrl+Y`)**.
*   **Exportações Gráficas e Acadêmicas**:
    *   **PNG em Alta Resolução**: Ideal para relatórios e provas.
    *   **LaTeX (TikZ)**: Exportação direta para código LaTeX usando a biblioteca `tikz-automata` e `arrows.meta`.

---

## 🎮 Guia de Atalhos & Gestos no Canvas

| Ação | Atalho / Gesto | Descrição |
| :--- | :--- | :--- |
| **Criar Estado** | Duplo clique no vazio | Posiciona um novo estado $q_i$ no cursor. |
| **Mover Estado** | Clique simples e arraste | Reposiciona livremente os nós pelo canvas. |
| **Criar Transição** | `Shift` + Arraste entre nós | Conecta dois estados e abre o modal de transição da pilha. |
| **Alternar Aceitação** | Duplo clique no nó | Define se o estado é final (círculo duplo). |
| **Opções do Estado** | Botão direito no nó | Abre o menu de contexto moderno. |
| **Desfazer** | `Ctrl + Z` | Desfaz a última ação realizada. |
| **Refazer** | `Ctrl + Y` | Refaz a ação desfeita. |

---

## 📚 Exemplos Clássicos Pré-Carregados (1 Clique)

1.  **$a^n b^n$ ($n \ge 1$)**: O clássico fundador da necessidade de memória auxiliar com pilha.
2.  **$w c w^R$ ($w \in \{a,b\}^*$)**: Palíndromo com marcador central — autômato de pilha determinístico (APD).
3.  **$w w^R$ ($w \in \{0,1\}^*$)**: Palíndromo par sem marcador — autômato de pilha não-determinístico (APN) que adivinha o meio da palavra.
4.  **Parênteses Balanceados**: Reconhecimento de expressões bem-formadas como `(())()`.
5.  **$a^n b^{2n}$ ($n \ge 1$)**: Empilhamento proporcional (duas marcas para cada símbolo lido).

---

## 🌐 Acesso Online via Web (GitHub Pages)

Você pode experimentar e usar a ferramenta diretamente pelo navegador sem precisar baixar nada:
👉 **[https://rovanni.github.io/Modelador_AP/](https://rovanni.github.io/Modelador_AP/)**

E acessar o tutorial didático em:
👉 **[https://rovanni.github.io/Modelador_AP/ajuda.html](https://rovanni.github.io/Modelador_AP/ajuda.html)**

---

## 🚀 Como Executar Localmente

Nenhum processo de build ou servidor é obrigatório.

1.  Clone este repositório:
    ```bash
    git clone https://github.com/rovanni/Modelador_AP.git
    ```
2.  Navegue até a pasta do projeto e abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Firefox, Safari, Edge):
    *   No Windows/macOS/Linux: Clique duas vezes sobre o arquivo `index.html`.
    *   Ou execute a página localmente via terminal se possuir o Python instalado:
        ```bash
        python -m http.server 8000
        ```
        Em seguida, acesse `http://localhost:8000/index.html`.
3.  Acesse também o guia didático em `ajuda.html` para consultar explicações teóricas e tutoriais passo a passo.

---

## 🗂️ Estrutura do Projeto

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Estrutura da página (HTML) |
| `ajuda.html` | Guia didático |
| `css/style.css` | Estilos complementares |
| `css/tailwind.css` | Utilitários do Tailwind já compilados (gerado, não editar à mão) |
| `css/fonts.css`, `fonts/` | Fontes locais (Fira Code, Inter, Outfit) |
| `js/canvas.js` | Desenho do grafo e interação com o canvas |
| `js/examples.js` | Exemplos clássicos |
| `js/export.js` | Exportação JSON, PNG e LaTeX (TikZ) |
| `js/main.js` | Inicialização da página |
| `js/modals.js` | Modal de transição |
| `js/model.js` | Estado do autômato, tema, desfazer/refazer, alfabetos, estados/transições e validador |
| `js/simulation.js` | Motor de simulação do AP, controles do player e testes em lote |
| `tools/` | Configuração para regerar `css/tailwind.css` |
| `tests/` | Testes de lógica (`run_tests.js`) e de interface (`ui_checks.js`) |

A ordem dos `<script>` em `index.html` importa: ela segue a ordem da tabela acima.

## 🔌 Uso Offline

O simulador **não precisa de internet**: Tailwind e fontes são arquivos locais. Se você adicionar classes novas do Tailwind em `index.html` ou `js/*.js`, regere o CSS (precisa de Node):

```bash
cd tools
npx tailwindcss@3.4.17 -c tailwind.config.js -i tailwind-input.css -o ../css/tailwind.css --minify
```

## 🧪 Testes

- **Lógica** (sem navegador): `node tests/run_tests.js`
- **Interface**: abra `index.html`, abra o console (F12), cole o conteúdo de `tests/ui_checks.js` e tecle Enter. O script simula arrastar, Shift+arrastar, duplo clique, menu de contexto, layouts, simulação, salvamento e exportações, e imprime PASS/FAIL.

## 📤 Exportações

- **PNG** sempre com fundo branco (bom para slides e artigos), qualquer que seja o tema da tela.
- **LaTeX/TikZ** com rótulos em modo matemático e laços com `loop above`; o botão "Baixar .tex completo" gera um documento pronto para compilar (classe `standalone`).

## 📄 Licença

Este projeto está licenciado sob a licença **MIT** — sinta-se livre para usar, estudar, modificar e distribuir em salas de aula ou projetos acadêmicos.
