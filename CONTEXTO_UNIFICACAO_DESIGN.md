# Contexto — Unificação de identidade visual: "Sistema Ritmo Certo"

**Tipo de documento:** contexto/briefing para um assistente de desenvolvimento e arquitetura, para orientar a criação futura de PRD(s) e SPEC(s). **Não é um PRD e não é uma SPEC** — nenhuma implementação deve começar a partir deste arquivo isoladamente. Ele existe para que quem retomar o trabalho entenda o ponto de partida sem precisar reabrir os quatro repositórios do zero.

**Data:** 05/07/2026.

---

## 1. Objetivo da melhoria

A usuária mantém 4 aplicações web independentes, cada uma em seu próprio repositório, criadas em momentos diferentes e com linguagens visuais diferentes entre si. A melhoria pretendida é:

1. **Unificar a identidade visual** de todas as 4 aplicações sob um único design system.
2. **Adotar o design do projeto `Painel-treino` como base** desse design system (cores, tipografia, tema claro/escuro, componentes visuais, tom geral).
3. **Unificar o nome/marca** de todas as aplicações para **"Sistema Ritmo Certo"** — nome que hoje já existe apenas no app `Despertar_BA26`.

O resultado esperado é que as 4 aplicações pareçam parte de uma mesma família de produto (mesma paleta, mesma tipografia, mesmos padrões de cartão/botão/tema), mesmo resolvendo problemas diferentes cada uma.

**Este documento não define a implementação.** Ele apenas registra o estado atual de cada pasta para que, no retorno, seja possível escrever um PRD (o quê e por quê) e uma SPEC (como, critério de aceite) por aplicação ou por iniciativa.

---

## 2. As 4 pastas do workspace

| Pasta | Nome do app hoje | Nome-alvo | Papel |
|---|---|---|---|
| [`Painel-treino`](../Painel-treino) | Treino do Dia | **Sistema Ritmo Certo** | **Fonte do design system** (base visual a ser propagada) |
| [`Despertar_BA26`](.) | Sistema Ritmo Certo (Despertar) | Sistema Ritmo Certo | **Fonte do nome/marca** — já usa o nome-alvo, mas com visual próprio (não o do Painel-treino) |
| [`Gerador-de-Planilhas`](../Gerador-de-Planilhas) | (sem nome de marca — script Python) | Sistema Ritmo Certo (a definir se cabe) | Gera a planilha Excel do ciclo; não tem UI web — considerar se entra na unificação visual ou fica de fora |
| [`Ciclo-Inteligente`](../Ciclo-Inteligente) | Formulário de Treino | Sistema Ritmo Certo (a definir se cabe) | Formulário de anamnese → PDF; único com identidade visual própria (verde/dark) sem relação com os demais |

Cada pasta tem README próprio já escrito (ver `README.md` em cada uma) com detalhes de stack e estrutura de arquivos — este documento não repete esse conteúdo, apenas o que é relevante para a unificação visual.

---

## 3. Design system de referência (base: Painel-treino)

Fonte: `Painel-treino/tailwind.config.js`, `src/styles/index.css`, componentes em `src/components/`.

### 3.1 Paleta de cores

```js
grafite:  { DEFAULT: '#14171b', soft: '#1c2025', line: '#282d33' }   // fundo modo escuro
giz:      { DEFAULT: '#f3f1ea', soft: '#fbfaf6', line: '#e4e0d4' }   // fundo modo claro
pista:    { DEFAULT: '#d6482e', soft: '#f0d9d3', dark: '#b83a24' }   // cor de destaque/ação (laranja-avermelhado)
zona:     { z1: '#4d7ea8', z2: '#3f9e83', z3: '#d7a233', z4: '#dd7a2c', z5: '#c73a2f', forca: '#7c5cbf', off: '#767d87' }
```

- Tema **claro por padrão**, com modo escuro via classe (`darkMode: 'class'`), alternável por um botão (`BotaoAlternarTema`) e persistido em `localStorage`.
- Cores de zona (`z1`–`z5`) representam o espectro fisiológico de intensidade de treino (recuperação → máxima intensidade) e aparecem tanto nos cartões de treino quanto na "régua de zona".

### 3.2 Tipografia

```js
display: '"Bebas Neue"'       // títulos grandes/condensados (tipo do treino, headers)
sans:    'Inter'              // texto corrido
mono:    '"IBM Plex Mono"'    // rótulos, chips, datas, números tabulares
```

Uso característico: rótulos em `mono` maiúsculo com `letter-spacing` largo (`tracking-wideish`, 0.02em) para metadados (ex.: "HOJE", fase do ciclo, data); título do treino em `display` grande.

### 3.3 Componentes-chave a replicar

- **Cartão de treino** (`CartaoTreino.jsx`): borda sutil, fundo `giz-soft`/`grafite-soft`, barra lateral colorida de 1px na cor da zona, chips em `mono` para tempo/RPE, bloco destacado para treino de força.
- **Régua de zona** (`ReguaZona.jsx`): "elemento-assinatura do app" — 5 segmentos coloridos (Z1–Z5) mostrando onde o esforço do dia cai no espectro, com ponto ou faixa ativa e os demais atenuados (opacidade ~0.22). **Este é o elemento mais distintivo do design e deveria aparecer, adaptado, nos demais apps que lidam com zona de treino.**
- **Botão de ação primário**: fundo `pista`, texto `giz`, `mono` uppercase, cantos arredondados.
- **Header sticky** com blur, ícone da marca + título em `display`, ações à direita (tema, atualizar ciclo).

### 3.4 Acessibilidade / detalhes técnicos já resolvidos no Painel-treino

- `:focus-visible` com outline na cor `pista`.
- Suporte a `prefers-reduced-motion`.
- Fontes carregadas via `@fontsource` (self-hosted, sem CDN externo) — relevante porque os outros 3 apps hoje usam Google Fonts via CDN (`Ciclo-Inteligente`) ou fontes de sistema (`Despertar_BA26`).

---

## 4. Estado visual atual de cada app (o que muda)

### Painel-treino
- Já é a referência. Nenhuma mudança visual esperada aqui além de eventual ajuste de nome/header para "Sistema Ritmo Certo" (hoje usa "Treino do Dia").

### Despertar_BA26
- Visual **totalmente próprio**, com paleta escura fixa (`#050D15` fundo, azul `#22D3EE`, laranja `#FB923C`, amarelo `#FFD43B`), sem tema claro, CSS inline no `index.html`, sem Tailwind.
- Já usa cores por zona (`sc()` function) mas com paleta diferente da de `Painel-treino` (roxo para Endurance, vermelho para Z5 etc. — não é o mesmo mapeamento z1–z5).
- Já é single-file HTML/CSS/JS, sem build (diferente do Painel-treino, que é React+Vite+Tailwind). A unificação visual aqui precisa decidir: portar para o stack do Painel-treino (React/Vite/Tailwind) ou apenas realinhar cores/tipografia mantendo HTML puro.
- **Já tem o nome-alvo correto** ("Sistema Ritmo Certo") — é a fonte da marca, mas não da UI.

### Gerador-de-Planilhas
- Não é uma aplicação web — é um script Python (`Plano_de_treino.py`) que gera um arquivo `.xlsx`. Não tem "tela" para redesenhar, mas a **planilha em si tem cores/estilos** (aplicados via biblioteca de Excel) que poderiam, opcionalmente, ecoar a paleta do design system (ex.: cores de zona nas células, ao invés de cores genéricas). A decisão de incluir ou não este projeto na unificação visual fica em aberto — avaliar se vale o esforço dado que o output é uma planilha, não uma UI interativa.

### Ciclo-Inteligente
- Visual **mais distante** dos outros 3: paleta escura verde-neon (`#22C55E`), fonte Inter via Google Fonts CDN, componentes tipo "pills" para seleção — sistema de design próprio, sem relação com zona de treino/pista/giz.
- É um formulário de anamnese + geração de PDF, funcionalmente diferente dos outros 3 (que são painéis de consulta de treino). Também não tem tema claro/escuro alternável.
- Maior distância = maior esforço de realinhamento visual.

---

## 5. Perguntas em aberto para quando for escrever o PRD/SPEC

Estas não foram decididas ainda — ficam registradas para retomar a conversa:

1. **Escopo:** a unificação visual vai cobrir os 4 projetos ou só os que têm UI interativa (Painel-treino, Despertar_BA26, Ciclo-Inteligente), deixando o Gerador-de-Planilhas de fora (ou tratando-o à parte, só na planilha)?
2. **Stack do Despertar_BA26 e do Ciclo-Inteligente:** migrar para React+Vite+Tailwind (como o Painel-treino) ou manter HTML/CSS/JS puro e apenas realinhar tokens de cor/tipografia manualmente? Migrar dá consistência de manutenção (mesmo design system codificado uma vez), mas é mais esforço; manter HTML puro é mais rápido mas duplica os tokens de design em cada projeto.
3. **Nome de cada app dentro da marca única:** todos viram literalmente "Sistema Ritmo Certo", ou cada um mantém um subnome (ex.: "Sistema Ritmo Certo — Treino do Dia", "Sistema Ritmo Certo — Despertar")? Hoje só o Despertar_BA26 usa o nome puro.
4. **Régua de zona (Z1–Z5):** faz sentido aparecer no Despertar_BA26 (que já mostra `tipo` de treino) e no Ciclo-Inteligente (que não lida com zona nenhuma, é anamnese)? Provavelmente só nos apps que consomem `dados_do_ciclo.csv`.
5. **Ordem de execução:** um PRD/SPEC por app (4 documentos, entregáveis independentes) ou um PRD geral do design system + SPECs de aplicação por app?
6. **Ícones/PWA:** Painel-treino e Despertar_BA26 já são PWA instaláveis, cada um com seu próprio ícone/manifest. Unificar nome implica unificar ícone também (mesmo ícone de app, "Sistema Ritmo Certo", nos dois)?

---

## 6. Próximo passo

Quando a usuária retomar este trabalho: usar este documento como ponto de partida para escrever, para cada app envolvido no escopo definido, um `PRD_UNIFICACAO_DESIGN_<NOME>.md` e um `SPEC_UNIFICACAO_DESIGN_<NOME>.md` (seguindo o padrão de nomenclatura já usado nos projetos, ex.: `PRD_APP_DESPERTAR_CSV.md`), respondendo primeiro às perguntas da seção 5.
