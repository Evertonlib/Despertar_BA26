# SPEC — Realinhamento do Despertar_BA26 ao Design System "Sistema Ritmo Certo"

**Documento:** especificação técnica derivada do `PRD_REALINHAMENTO_DESIGN_SYSTEM.md` aprovado, após leitura do `index.html`, `sw.js` e `manifest.webmanifest` reais do `Despertar_BA26`, e do `DESIGN_SYSTEM.md`/`estiloTreino.js` do `Painel-treino` (fontes da verdade visual).
**Status:** aguardando aprovação. Nenhum código será escrito antes do "ok".
**Data:** 24/07/2026.
**Arquivos afetados:** `index.html` (bloco `<style>` e `<script>`), `sw.js`, `manifest.webmanifest`, e novos arquivos binários em `fonts/*.woff2` + `.gitattributes` (novo).

---

## 0. Observações de leitura do código (PRD vs. arquivos reais)

O PRD descreve corretamente o que precisa mudar. A leitura linha a linha do `index.html` atual (574 linhas, já na versão pós-migração para CSV — ver `SPEC_APP_DESPERTAR_CSV.md`) confirma a estrutura descrita e revela detalhes de implementação que moldam as decisões desta Spec:

1. **`sc(tipo, prova)` já existe com essa assinatura** (linha 127-136) e já recebe `prova` como segundo parâmetro, checado **antes** de qualquer regra textual — isto é herdado da Spec anterior (seção 4.5 do `SPEC_APP_DESPERTAR_CSV.md`), que corrigiu a divergência de `startsWith("PROVA")`. Esta Spec **mantém essa mesma assinatura e a mesma prioridade** (`prova` como critério primário), apenas trocando as cores retornadas e adicionando um campo `regua` ao objeto de retorno.

2. **O objeto retornado por `sc()` hoje é `{text, bar, bg}`**, consumido em 3 pontos:
   - `heroSt = sc(hero.tipo, hero.prova)` (linha 377) — usa `heroSt.bar` no gradiente da `.hero-bar` (linha 398) e `heroSt.bg`/`heroSt.bar+"40"`/`heroSt.text` no `.hero-badge` (linha 405).
   - `st = sc(s.tipo, s.prova)` na aba "Esta Semana" (linha 439) — usa `st.bar` no `.day-bar` (linha 447) e `st.text` no `.day-tipo` (linha 449).
   - `st = sc(s.tipo, s.prova)` na aba "Ciclo Completo", duas vezes (linhas 473 e 506, corpos idênticos) — usa apenas `st.text` no `.acc-tipo` (linhas 478/511).
   Nenhum desses call sites precisa mudar de forma: esta Spec **preserva o formato `{text, bar, bg}`** e apenas acrescenta um quarto campo `regua` (usado só pelo hero). Isso evita reescrever os três pontos de consumo.

3. **`heroSt.bar+"40"`** (linha 405, borda do badge) depende de `bar` ser uma **string hex literal de 6 dígitos** (ex.: `"#c73a2f"`), para virar um hex de 8 dígitos com alpha (`"#c73a2f40"`) — um recurso de cor CSS válido. Por isso, `text`/`bar`/`bg` retornados por `sc()` **continuam sendo strings hex/rgba literais**, nunca `var(--token)`: usar uma variável CSS ali quebraria essa concatenação (`var(--zona-z5)40` não é uma cor válida). As variáveis CSS (seção 1) são usadas **apenas no bloco `<style>` estático**, nunca dentro de `sc()`. Os valores hex usados em `sc()` (seção 3) são os mesmos das variáveis CSS — listados uma única vez na tabela da seção 3.2 para não haver divergência entre os dois lugares.

4. **Cores hoje hardcoded no `<style>` que o PRD não cita explicitamente**, além das 10 listadas na seção 5 do PRD: `#1C3A52` (`.hero-dot` linha 43, `.acc-item+.acc-item` borda linha 82, e o `background:"#1C3A52"` do `.day-bar` quando `isOff` na linha 447 do JS), `#060E17` (`.acc-body` linha 79, `.form-field input` fundo linha 102), `#163050` (`.tab.active` fundo linha 48), `#0F2033` (`.day-row.today` fundo linha 56, `.acc-btn.cur` fundo linha 74, `.ciclo-btn` fundo linha 93), `#0D2236` (`.acc-item.today-row` fundo linha 81), e `#FF4D6D`/`rgba(255,77,109,...)`/`#FF9DAF` (`.error-banner`, linha 96, mensagens de erro). Como o PRD lista exatamente 10 cores a mapear e não menciona essas, o código prevalece: **essas cores extras existem e precisam de um destino ao reescrever o `<style>` inteiro**, senão o resultado final fica inconsistente (uma mistura de tokens novos com hex antigos remanescentes). A seção 1.2 resolve cada uma delas por analogia aos papéis do `DESIGN_SYSTEM.md`, com uma exceção deliberada (`.error-banner`, que não tem token equivalente no design system e é mantida como está — ver seção 1.3).

5. **Não existe `.gitattributes` no repositório hoje.** O risco 8.1.4 do PRD (arquivos de fonte corrompidos por normalização de fim de linha) exige tratar `.woff2` como binário explicitamente — sem esse arquivo, o Git usa a configuração padrão do ambiente de quem commita, que pode variar. Tratado na seção 5.3.

6. **`sw.js` de hoje** (`CACHE_NAME = "src-cache-v1"`, `ASSETS` com 5 itens) já tem a lógica de limpeza de cache antigo em `activate` (linhas 17-24) funcionando — confirma a premissa do PRD de que só a lista `ASSETS` e o nome do cache precisam mudar (seção 6).

7. **`manifest.webmanifest` de hoje** tem `background_color`/`theme_color` = `#050D15` e `index.html` tem `<meta name="theme-color" content="#050D15">` (linha 13) — confirma exatamente o que o PRD descreve para CA-16 (seção 7).

Essas observações moldam as decisões de design das seções 1 a 7.

---

## 1. Tokens de cor

### 1.1 Variáveis CSS novas (bloco `:root`, substitui o início do `<style>`)

Copiadas literalmente da seção 1.2 do `DESIGN_SYSTEM.md` (só o subconjunto do tema escuro, já que o app não tem alternância de tema — premissa 1 do PRD), mais três tokens derivados de opacidade (não existem como variável nomeada no `DESIGN_SYSTEM.md`, mas a lógica de "texto a X% de opacidade sobre a cor de texto do tema" da seção 4 do `DESIGN_SYSTEM.md` é explícita — nomeados aqui para reuso consistente em todo o `<style>`):

```css
:root {
  /* Grafite (base escura) — DESIGN_SYSTEM.md §1.2 */
  --grafite: #14171b;
  --grafite-soft: #1c2025;
  --grafite-line: #282d33;

  /* Giz (texto sobre fundo escuro) — DESIGN_SYSTEM.md §1.2 */
  --giz: #f3f1ea;

  /* Pista (marca/destaque) — DESIGN_SYSTEM.md §1.2 */
  --pista: #d6482e;
  --pista-soft: #f0d9d3;
  --pista-dark: #b83a24;

  /* Zonas de esforço — DESIGN_SYSTEM.md §1.2 */
  --zona-z1: #4d7ea8;
  --zona-z2: #3f9e83;
  --zona-z3: #d7a233;
  --zona-z4: #dd7a2c;
  --zona-z5: #c73a2f;
  --zona-forca: #7c5cbf;
  --zona-off: #767d87;

  /* Derivados de opacidade sobre Giz — DESIGN_SYSTEM.md §4 (não são cinzas
     arbitrários: são a cor de texto do tema a X% de opacidade) */
  --texto-secundario: rgba(243, 241, 234, .75);   /* faixa 70-80% */
  --texto-terciario:  rgba(243, 241, 234, .45);   /* faixa 40-50% */
  --borda: rgba(243, 241, 234, .10);              /* divisores padrão */
  --borda-destaque: rgba(214, 72, 46, .40);       /* Pista a 40%, estado "hoje/atual" */
  --superficie-destaque: rgba(214, 72, 46, .08);  /* Pista a 8%, fundo de linha "hoje" */
}
```

### 1.2 Mapeamento de-para, seletor por seletor

**As 10 cores listadas na seção 5 do PRD:**

| Cor antiga | Seletor(es) (linha no `index.html` atual) | Token novo |
|---|---|---|
| `#050D15` | `body` (16) | `var(--grafite)` |
| `#22D3EE` | `.hdr-sub` (21), `.hero-eyebrow` (33), `.sec-label` (52) | `var(--pista)` |
| `#FB923C` | `.hdr-days span` (26), `.hero-time` (39), `.day-wake-time` (69), `.acc-wake` (86), `.form-actions button` fundo (104) | `var(--pista)` |
| `#FFD43B` | `.hdr-days` (25), `.hero-prova` (40), `.day-wake-prova` (68), `.acc-wake.prova` (87) | `var(--pista)` |
| `#0B1825` | `.hero` fundo (29), `.tabs` fundo (46), `.day-row` fundo (55), `.acc-btn.nor` fundo (75), `.ciclo-btn` fundo (93), `.form-card` fundo (98) | `var(--grafite-soft)` |
| `#162535` | `.hero` borda (29), `.tabs` borda (46), `.day-row` borda (55), `.acc-btn` borda (72-73), `.acc-body` borda (79), `.form-card` borda (98) | `var(--grafite-line)` |
| `#1E4A70` | `.day-row.today` borda (56), `.acc-btn.cur` borda (74), `.ciclo-btn` borda (93), `.form-field input` borda (102) | `var(--borda-destaque)` |
| `#3D6482` | `.hdr-label` (24), `.hero-wake-label` (38), `.hero-meta span` (35), `.day-date` (61), `.day-dur` (65), `.day-tipo.off` (64), `.tab.inactive` cor (49), `.acc-date` (83), `.acc-dur` (85), `.acc-arrow` (78), `.footer` (89) | `var(--texto-terciario)` |
| `#94B8D4` | `.hdr-desc` (22), `.hero-meta` (34), `.hero-info` (41), `.day-name.normal` (60), `.form-field label` (101) | `var(--texto-secundario)` |
| `#F0F8FF` | `body` cor (16), `.hero-info b` (42), `.day-name.today` (59), `.tab.active` cor (48), `.acc-btn.cur` cor (74), `.form-card h3` (99), `.form-field input` cor (102) | `var(--giz)` |

**Cores extras encontradas no código (não citadas no PRD, ver observação 4 da seção 0), resolvidas por analogia aos papéis do `DESIGN_SYSTEM.md`:**

| Cor antiga | Seletor(es) | Token novo | Justificativa |
|---|---|---|---|
| `#1C3A52` | `.hero-dot` (43), `.acc-item+.acc-item` borda (82) | `var(--borda)` | Divisor sutil — mesmo papel de `#162535`, só que mais discreto; vira opacidade sobre Giz, não um cinza fixo. |
| `#1C3A52` | `.day-bar` quando `isOff` (JS, linha 447) | `var(--zona-off)` | É a cor da barra de um dia de descanso — mesmo papel da cor Off oficial (`#767d87`), coerente com CA-07. |
| `#060E17` | `.acc-body` fundo (79), `.form-field input` fundo (102) | `var(--grafite)` | Poço/inset mais escuro que o cartão ao redor (`--grafite-soft`) — usa a base Grafite pura, mantendo a hierarquia de profundidade já existente. |
| `#163050` | `.tab.active` fundo (48) | `var(--grafite-line)` | Superfície elevada neutra para o estado selecionado da aba — evita usar Pista como bloco de fundo grande (reservada a ação/marca, conforme premissa 7 do PRD), a cor do texto (`var(--giz)`, já mapeada) já sinaliza o estado ativo. |
| `#0F2033` | `.day-row.today` fundo (56), `.acc-btn.cur` fundo (74), `.ciclo-btn` fundo (93) | `var(--superficie-destaque)` (linhas "hoje"/atual) e `var(--grafite-soft)` (botão `.ciclo-btn`, que não é um estado "hoje", é a ação padrão) | Linha do dia atual ganha um tingimento sutil de Pista (8%) para se destacar sem virar um bloco sólido de marca; o botão de ação usa o mesmo fundo neutro dos demais cartões, com a cor Pista reservada à borda/texto. |
| `#0D2236` | `.acc-item.today-row` fundo (81) | `var(--superficie-destaque)` | Mesmo papel de `.day-row.today` acima — linha do dia atual dentro do acordeão. |
| `#FF4D6D`, `rgba(255,77,109,...)`, `#FF9DAF` | `.error-banner` (96) | **mantido sem alteração** | Cor de estado de erro, não faz parte da paleta do `DESIGN_SYSTEM.md` (que não define um token de erro) nem está listada no PRD como algo a trocar. Fora de escopo desta melhoria — ver seção 1.3. |

### 1.3 Nota sobre `.error-banner`

O `DESIGN_SYSTEM.md` não define uma cor de erro/alerta, e o PRD não pede a criação de um token novo para esse caso. `.error-banner` permanece com sua cor vermelha atual (`#FF4D6D`/`#FF9DAF`), sem qualquer troca. Isso é uma decisão explícita para não inventar um requisito fora do PRD — registrado aqui para não ser confundido com um esquecimento durante a implementação.

### 1.4 Meta `theme-color`

`<meta name="theme-color" content="#050D15">` (linha 13) passa a `<meta name="theme-color" content="#14171b">` (valor literal, não `var()` — meta tags não resolvem variáveis CSS). Ver seção 7.

---

## 2. Tipografia

### 2.1 Arquivos `.woff2` a criar (pasta `fonts/`, nomes em minúsculas — mitigação do risco 8.1.2 do PRD)

Mesmos pacotes/pesos que o `Painel-treino` usa via `@fontsource` (premissa 5 do PRD), subset `latin`:

| Arquivo (`fonts/...`) | Fonte | Peso |
|---|---|---|
| `bebas-neue-400.woff2` | Bebas Neue | 400 |
| `inter-400.woff2` | Inter | 400 |
| `inter-500.woff2` | Inter | 500 |
| `inter-600.woff2` | Inter | 600 |
| `inter-700.woff2` | Inter | 700 |
| `ibm-plex-mono-400.woff2` | IBM Plex Mono | 400 |
| `ibm-plex-mono-500.woff2` | IBM Plex Mono | 500 |

7 arquivos no total. Todos em minúsculas, sem espaço, sem acento — para que o caminho escrito no `@font-face` bata caractere a caractere com o nome do arquivo commitado (GitHub Pages diferencia maiúsculas/minúsculas; o Windows local não).

### 2.2 Blocos `@font-face` (adicionados no início do `<style>`, antes do `:root`)

```css
@font-face {
  font-family: "Bebas Neue";
  src: url("fonts/bebas-neue-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Inter";
  src: url("fonts/inter-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Inter";
  src: url("fonts/inter-500.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Inter";
  src: url("fonts/inter-600.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Inter";
  src: url("fonts/inter-700.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Mono";
  src: url("fonts/ibm-plex-mono-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Mono";
  src: url("fonts/ibm-plex-mono-500.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

`font-display: swap` garante que o texto apareça imediatamente na fonte de fallback e troque para a oficial assim que ela carregar — nunca fica invisível (`FOIT`), atendendo CA-14.

### 2.3 Variáveis de família (acrescentadas ao `:root` da seção 1.1)

```css
--fonte-display: "Bebas Neue", sans-serif;
--fonte-sans: "Inter", sans-serif;
--fonte-mono: "IBM Plex Mono", ui-monospace, monospace;
```

Pilha de fallback exatamente como a seção 2.1 do `DESIGN_SYSTEM.md`: `sans-serif` para display/sans, `ui-monospace, monospace` para mono.

### 2.4 Tabela de aplicação por seletor

| Seletor (linha atual) | Fonte hoje | Fonte nova | Papel (DESIGN_SYSTEM.md §2 / PRD §4.4) |
|---|---|---|---|
| `body` (16) | `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | `var(--fonte-sans)` | Texto corrido, base do documento |
| `.hdr-sub` (21) | herda do `body` | `var(--fonte-display)` | Nome do app ("Sistema Ritmo Certo") — PRD §4.4 |
| `.hdr-desc` (22) | herda do `body` | `var(--fonte-sans)` | Texto corrido |
| `.hdr-label` (24) | herda do `body` | `var(--fonte-mono)` | Rótulo ("faltam") |
| `.hdr-days` (25) | `'Courier New', monospace` | `var(--fonte-mono)` | Número (dias restantes) |
| `.hero-eyebrow` (33) | herda do `body` | `var(--fonte-mono)` | Rótulo ("Amanhã"/"Próximo treino") |
| `.hero-meta` (34) | herda do `body` | `var(--fonte-sans)` | Texto corrido (dia/data) |
| `.hero-badge` (36) | herda do `body` | `var(--fonte-display)` | Tipo do treino em destaque — PRD §4.4 |
| `.hero-wake-label` (38) | herda do `body` | `var(--fonte-mono)` | Rótulo ("Despertar") |
| `.hero-time` (39) | `'Courier New', monospace` | `var(--fonte-mono)` | Número (horário) |
| `.hero-prova` (40) | herda do `body` | `var(--fonte-mono)` | Badge ("🏁 DIA DE PROVA") |
| `.hero-info` (41) | herda do `body` | `var(--fonte-mono)` | Números/rótulos (duração, RPE, término) |
| `.tab` (47) | herda do `body` | `var(--fonte-mono)` | Rótulo de botão |
| `.sec-label` (52) | herda do `body` | `var(--fonte-mono)` | Rótulo de seção |
| `.day-name` (58) | herda do `body` | `var(--fonte-sans)` | Texto corrido (nome do dia) |
| `.day-date` (61) | herda do `body` | `var(--fonte-mono)` | Data |
| `.day-tipo` (63) | herda do `body` | `var(--fonte-sans)` | Tipo do treino em **lista** (não é o "destaque" do PRD §4.4 — decisão registrada abaixo) |
| `.day-dur` (65) | herda do `body` | `var(--fonte-mono)` | Duração/RPE |
| `.day-wake-off` / `.day-wake-prova` / `.day-wake-time` (67-69) | mistura (`'Courier New'` só na `.day-wake-time`) | `var(--fonte-mono)` | Badge/número |
| `.acc-btn` (72-73) | herda do `body` | `var(--fonte-mono)` | Rótulo de botão (nome da semana) |
| `.acc-date` (83) | herda do `body` | `var(--fonte-mono)` | Data |
| `.acc-tipo` (84) | herda do `body` | `var(--fonte-sans)` | Tipo do treino em **lista** (mesma decisão de `.day-tipo`) |
| `.acc-dur` / `.acc-wake` (85-87) | mistura | `var(--fonte-mono)` | Duração/número |
| `.footer` (89) | herda do `body` | `var(--fonte-mono)` | Rótulo institucional |
| `.ciclo-btn` (93) | herda do `body` | `var(--fonte-mono)` | Rótulo de botão primário |
| `.empty-state p` (95) | herda do `body` | `var(--fonte-sans)` | Texto corrido |
| `.error-banner` (96) | herda do `body` | `var(--fonte-sans)` | Texto corrido |
| `.form-card h3` (99) | herda do `body` | `var(--fonte-display)` | Título de diálogo (papel mais próximo de "título" na hierarquia local) |
| `.form-field label` (101) | herda do `body` | `var(--fonte-sans)` | Texto corrido |
| `.form-field input` (102) | herda do `body` | `var(--fonte-mono)` | Campo de dado (hora/nome — tratado como dado, não prosa) |
| `.form-actions button` (104) | herda do `body` | `var(--fonte-mono)` | Rótulo de botão primário |

**Decisão registrada:** o PRD (§4.4) especifica Bebas Neue apenas para "o nome do app" e "o tipo do treino em destaque" — interpretado literalmente como o `.hero-badge` (o único tipo de treino que aparece no bloco de destaque/hero). `.day-tipo` e `.acc-tipo` mostram o tipo do treino nas **listas** ("Esta Semana"/"Ciclo Completo"), não no destaque, e por isso recebem Inter (texto corrido), não Bebas Neue — consistente com a seção 6 do PRD ("não redesenha o cartão de treino no padrão completo do Painel-treino"), que mantém o padrão visual de lista como está, só trocando cor/fonte pontualmente. `.form-card h3` não é mencionado no PRD; foi tratado como "título" por analogia visual (é o maior texto do diálogo), decisão de baixo risco documentada aqui para transparência.

### 2.5 `font-variant-numeric` (tabular)

Acrescentar ao `body` (junto da troca de `font-family`), conforme `DESIGN_SYSTEM.md` §2: `font-variant-numeric: tabular-nums;` — para os números (horário, dias restantes, RPE, duração) não deslocarem largura ao mudar de valor.

---

## 3. Nova `sc()`

### 3.1 Assinatura e compatibilidade

Mantém `sc(tipo, prova)` (mesma assinatura de hoje). Passa a retornar `{text, bar, bg, regua}` — os três primeiros campos no mesmo formato de hoje (strings hex/rgba, nunca `var()`, ver observação 3 da seção 0), o quarto (`regua`) é novo e usado só pelo hero (seção 4).

### 3.2 Tabela de cores por zona (usada dentro de `sc()`, valores idênticos às variáveis CSS da seção 1.1)

| Zona | `text`/`bar` (hex) | `bg` (rgba, ~12% alpha) |
|---|---|---|
| Z1 | `#4d7ea8` | `rgba(77,126,168,.12)` |
| Z2 | `#3f9e83` | `rgba(63,158,131,.12)` |
| Z3 / neutro / Endurance | `#d7a233` | `rgba(215,162,51,.12)` |
| Z4 | `#dd7a2c` | `rgba(221,122,44,.12)` |
| Z5 / VO2 | `#c73a2f` | `rgba(199,58,47,.12)` |
| Força | `#7c5cbf` | `rgba(124,92,191,.12)` |
| Off | `#767d87` | `rgba(118,125,135,.12)` |
| Pista (prova) | `#d6482e` | `rgba(214,72,46,.12)` |

### 3.3 Ordem exata de avaliação

Espelha `Painel-treino/src/lib/estiloTreino.js` (normalização, ordem OFF → zona → VO2 → força → Endurance → default), com `prova` como critério adicional e prioritário no topo (já existente na implementação atual do Despertar, mantido):

```js
const normalizarTipo = t => (t || "")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toUpperCase();

const ZONA = {
  1: { hex: "#4d7ea8", bg: "rgba(77,126,168,.12)" },
  2: { hex: "#3f9e83", bg: "rgba(63,158,131,.12)" },
  3: { hex: "#d7a233", bg: "rgba(215,162,51,.12)" },
  4: { hex: "#dd7a2c", bg: "rgba(221,122,44,.12)" },
  5: { hex: "#c73a2f", bg: "rgba(199,58,47,.12)" },
};

function sc(tipo, prova) {
  // 1) prova é o critério primário (mantido da Spec anterior, seção 4.5
  //    do SPEC_APP_DESPERTAR_CSV.md) — CA-08
  if (prova) {
    return { text:"#d6482e", bar:"#d6482e", bg:"rgba(214,72,46,.12)", regua:null };
  }

  const t = normalizarTipo(tipo);

  // 2) OFF no início — CA-07
  if (t.startsWith("OFF")) {
    return { text:"#767d87", bar:"#767d87", bg:"rgba(118,125,135,.12)", regua:null };
  }

  // 3) zona explícita Z1-Z5 — CA-03, CA-10
  const zonaMatch = t.match(/Z([1-5])/);
  if (zonaMatch) {
    const n = Number(zonaMatch[1]);
    return { text:ZONA[n].hex, bar:ZONA[n].hex, bg:ZONA[n].bg, regua:{ ativos:[n] } };
  }

  // 4) VO2 -> Z5 — CA-05
  if (/VO2/.test(t)) {
    return { text:ZONA[5].hex, bar:ZONA[5].hex, bg:ZONA[5].bg, regua:{ ativos:[5] } };
  }

  // 5) força — CA-06
  if (/FORC/.test(t)) {
    return { text:"#7c5cbf", bar:"#7c5cbf", bg:"rgba(124,92,191,.12)", regua:null };
  }

  // 6) Endurance -> faixa Z2-Z4 — CA-04, CA-11
  if (/ENDURANCE/.test(t)) {
    return { text:ZONA[3].hex, bar:ZONA[3].hex, bg:ZONA[3].bg, regua:{ ativos:[2,3,4] } };
  }

  // 7) default neutro/dourado, régua renderizada sem nenhum segmento ativo — CA-09
  return { text:ZONA[3].hex, bar:ZONA[3].hex, bg:ZONA[3].bg, regua:{ ativos:[] } };
}
```

Notas de ordem (idênticas a `estiloTreino.js`):
- A checagem de zona explícita (`Z([1-5])`) vem **antes** da checagem de força — um tipo como `"Z3 + Força"` recebe a cor/régua de Z3, não de Força (mesmo comportamento do `Painel-treino`; o ícone de haltere combinado é um detalhe do `CartaoTreino` completo, fora de escopo aqui, seção 6 do PRD).
- `regua: null` sinaliza "não renderizar o componente" (OFF, Força pura, prova — CA-06, CA-07, CA-08, CA-12).
- `regua: { ativos: [] }` (caso 7, default) é **diferente** de `null`: a Régua **é renderizada**, só que sem nenhum segmento em opacidade cheia — comportamento exigido por CA-09 ("sem marcar nenhuma posição na Régua de Zona", que não está na lista de "Régua ausente" do CA-12).

### 3.4 Call sites (confirmado sem necessidade de alteração estrutural, ver observação 2 da seção 0)

Nenhum dos 3 call sites precisa mudar de forma — todos continuam desestruturando `text`/`bar`/`bg` como hoje. Apenas o hero (linha 377) passa a também ler `.regua` (seção 4.3).

---

## 4. Régua de Zona

### 4.1 HTML (inserido no hero, entre `.hero-row` e `.hero-center`)

Posição exata: dentro de `.hero-body`, **depois** do `</div>` que fecha `.hero-row` (fim da linha 406 do código atual) e **antes** da abertura de `.hero-center` (linha 407) — ou seja, logo abaixo do bloco que contém o `.hero-badge` (tipo do treino em destaque), conforme premissa 2 do PRD ("apenas no hero", versão compacta).

```html
<div class="regua-zona">
  <span class="regua-zona__seg" style="background:#4d7ea8;opacity:${ativos.includes(1)?1:.22}"></span>
  <span class="regua-zona__seg" style="background:#3f9e83;opacity:${ativos.includes(2)?1:.22}"></span>
  <span class="regua-zona__seg" style="background:#d7a233;opacity:${ativos.includes(3)?1:.22}"></span>
  <span class="regua-zona__seg" style="background:#dd7a2c;opacity:${ativos.includes(4)?1:.22}"></span>
  <span class="regua-zona__seg" style="background:#c73a2f;opacity:${ativos.includes(5)?1:.22}"></span>
</div>
```

Sem `.regua-zona__rotulos` (a versão compacta, conforme `DESIGN_SYSTEM.md` §3.1 e premissa 2 do PRD, omite os rótulos "Z1..Z5").

### 4.2 CSS (versão compacta — 6px de altura, conforme `DESIGN_SYSTEM.md` §3.1)

```css
.regua-zona {
  display: flex;
  gap: 2px;
  height: 6px;
  margin: 10px 0 4px;
}
.regua-zona__seg {
  flex: 1 1 0;
  border-radius: 9999px;
  transition: opacity 150ms;
}
```

A regra global de `prefers-reduced-motion` (seção 4 do `DESIGN_SYSTEM.md`, reproduzida na seção 1 desta Spec — ver observação abaixo) já reduz essa transição a instantânea quando o sistema pede movimento reduzido:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
    scroll-behavior: auto !important;
  }
}
```

Este bloco `@media` é **novo** no `index.html` (não existe hoje) — acrescentado por já estar documentado como regra de acessibilidade do design system (`DESIGN_SYSTEM.md` §4), aplicável a qualquer transição do app, não só à Régua.

### 4.3 Função que decide os segmentos ativos e a renderização condicional

No template do hero (dentro do `if(hero)` da função `render()`, por volta da linha 396-425 atual):

```js
const regua = heroSt.regua;   // heroSt = sc(hero.tipo, hero.prova), já calculado na linha 377
// ...
${regua ? `
  <div class="regua-zona">
    ${[1,2,3,4,5].map(n => `<span class="regua-zona__seg" style="background:${ZONA[n].hex};opacity:${regua.ativos.includes(n) ? 1 : .22}"></span>`).join("")}
  </div>
` : ""}
```

Casos em que `regua` é `null` (Régua **não** renderizada — nenhum espaço vazio no lugar dela, CA-12):
- `hero.tipo` é OFF (descanso) — CA-07/CA-12.
- `hero.tipo` contém "FORC" sem zona explícita nem VO2 (força pura) — CA-06/CA-12.
- `hero.prova` é `true` (dia de prova) — CA-08/CA-12.

Casos em que `regua` é `{ativos:[...]}` (Régua renderizada):
- Zona explícita → um segmento ativo (CA-10).
- Endurance → três segmentos ativos, Z2-Z4 (CA-11).
- VO2 → um segmento ativo, Z5 (CA-05).
- Tipo não reconhecido → Régua renderizada, **zero** segmentos ativos, todos a 22% (CA-09).

Quando não há `hero` (fim de ciclo), o bloco inteiro do hero — Régua incluída — não é renderizado, comportamento já existente e inalterado.

---

## 5. `sw.js`

### 5.1 Novo `CACHE_NAME`

`"src-cache-v1"` → `"src-cache-v2"` (incremento simples, mitigação do risco 8.2.7 do PRD — aciona a limpeza de cache antigo já existente em `activate`, linhas 17-24, sem precisar tocar nessa lógica).

### 5.2 Lista `ASSETS` completa

```js
const CACHE_NAME = "src-cache-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./fonts/bebas-neue-400.woff2",
  "./fonts/inter-400.woff2",
  "./fonts/inter-500.woff2",
  "./fonts/inter-600.woff2",
  "./fonts/inter-700.woff2",
  "./fonts/ibm-plex-mono-400.woff2",
  "./fonts/ibm-plex-mono-500.woff2"
];
```

Os 5 itens originais são preservados; os 7 novos caminhos usam o mesmo padrão `./` já usado no arquivo (mitigação do risco 8.1.2 do PRD — nenhum caminho novo introduz uma convenção diferente da existente).

### 5.3 Tratamento explícito do risco de `cache.addAll` atômico (risco 8.1.3 do PRD)

`cache.addAll(ASSETS)` (linha 12 do `sw.js`) falha **inteiro** se qualquer um dos 12 itens responder 404 — e uma falha aqui derruba a instalação do service worker, ou seja, mata o offline do app inteiro, não só a fonte que faltou. Regras obrigatórias para esta implementação:

1. **Nenhum arquivo é adicionado a `ASSETS` antes de existir, commitado, no repositório.** A ordem de trabalho correta é: primeiro colocar os 7 arquivos `.woff2` em `fonts/`, confirmar com `git status`/`git add` que todos os 7 aparecem como arquivos rastreados com tamanho > 0 byte, **depois** editar `ASSETS`.
2. Antes de commitar, conferir manualmente que cada um dos 12 caminhos de `ASSETS` corresponde a um arquivo existente no diretório de trabalho (`fonts/bebas-neue-400.woff2` etc., exatamente com esse nome/caixa).
3. Se, por qualquer motivo, um peso específico de fonte não puder ser confirmado como presente/válido no momento do commit, a decisão correta (conforme o próprio PRD) é **não listá-lo em `ASSETS`** — o app ainda funciona, buscando aquele arquivo da rede sob demanda quando necessário, em vez de arriscar quebrar o cache inteiro. Isso não deve acontecer no fluxo normal (os 7 arquivos são parte obrigatória desta melhoria, seção 2.1), mas é a regra de contingência caso um arquivo específico apresente problema na hora do commit.
4. A verificação pós-publicação (aba Network sem 404) é obrigatória e está detalhada no plano de validação (seção 8).

---

## 6. `manifest.webmanifest` e meta `theme-color`

### 6.1 `manifest.webmanifest`

```json
{
  "name": "Sistema Ritmo Certo",
  "short_name": "Ritmo Certo",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#14171b",
  "theme_color": "#14171b",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Única mudança: `background_color` e `theme_color` de `#050D15` para `#14171b`. `name`, `short_name`, `start_url`, `display` e `icons` permanecem exatamente como estão (fora de escopo, seção 6.5 do PRD).

### 6.2 Meta tag no `index.html`

Linha 13: `<meta name="theme-color" content="#050D15"/>` → `<meta name="theme-color" content="#14171b"/>`.

---

## 7. Plano de validação local (antes do commit) e plano de rollback

O `Despertar_BA26` publica o repositório inteiro direto na raiz do GitHub Pages, sem etapa de build nem prévia (risco 8.1 do PRD, o mais grave desta melhoria). Por isso, a validação local abaixo é a **única** rede de segurança antes do público ver a mudança, e deve ser seguida integralmente, em ordem, **antes** de qualquer commit.

### 7.1 Validação local — passo a passo

1. **Preparar os arquivos de fonte primeiro.** Colocar os 7 `.woff2` (seção 2.1) em `fonts/`, todos em minúsculas. Rodar `git add fonts/` e conferir no `git status`/`git diff --stat` que os 7 arquivos aparecem com tamanho de bytes plausível (não 0 byte).
2. **Criar/editar `.gitattributes`** (seção 7.3) e conferir que ele está no ar **antes** de commitar as fontes, para que o `git add` já aplique o tratamento binário corretamente.
3. **Abrir o `index.html` local no navegador** (duplo clique ou `file://`, e também via um servidor local simples tipo `python -m http.server` — para o `sw.js` funcionar, já que `file://` não registra service worker em todos os navegadores) com o DevTools aberto, aba Console.
4. **Testar com nenhum ciclo carregado** (limpar `localStorage` antes, ou usar aba anônima): conferir fundo Grafite, botão "Carregar ciclo" com cor Pista, fontes aplicadas (nome do app em Bebas Neue), nenhum erro no Console.
5. **Carregar um CSV de teste** cobrindo todos os tipos de `tipo` relevantes: ao menos um dia de cada zona (`Z1`...`Z5`), um `Endurance`, um `VO2`, um `Força`, um `OFF` (incluindo uma variação tipo `"OFF + Estabilidade Core"`), um dia de `Prova`, e um tipo não reconhecido (ex.: `"Teste Aleatório"`) — confirmar visualmente cada critério CA-03 a CA-12 (cor certa, Régua certa/ausente certa) no hero, na aba "Esta Semana" e no acordeão "Ciclo Completo".
6. **Verificar a aba Network do DevTools**: nenhum request com status 404, especialmente os 7 arquivos `.woff2` e os 2 ícones.
7. **Verificar a aba Application > Fonts** (ou o painel de fontes carregadas do navegador): confirmar que os três nomes de família (Bebas Neue, Inter, IBM Plex Mono) aparecem como carregados do arquivo local, não do fallback de sistema.
8. **Verificar Application > Service Workers**: registrar, aguardar `activate`, conferir em Application > Cache Storage que o cache `src-cache-v2` existe com os 12 itens de `ASSETS`, e que o cache antigo (`src-cache-v1`, se tiver existido numa visita anterior) foi removido.
9. **Testar offline**: marcar "Offline" no DevTools (aba Network) e recarregar a página — o app deve continuar funcionando, com as três fontes aplicadas (CA-15) e sem nenhuma tentativa de rede falhando.
10. **Testar o app instalado como PWA** (se o navegador de teste suportar instalação): confirmar que a barra do sistema/splash screen usa a cor Grafite (CA-16).
11. Só depois de todos os 10 passos acima passarem sem erro é que o commit deve ser feito.

### 7.2 Commit único

Toda a mudança (bloco `<style>` reescrito, `sc()` reescrita, HTML da Régua, `sw.js`, `manifest.webmanifest`, `.gitattributes`, os 7 arquivos `.woff2`) entra em **um único commit**, sem misturar com nenhuma outra alteração — mitigação direta do risco 8.1.1 e 8.1.5 do PRD, para que um `git revert` restaure o app publicado em um único passo.

### 7.3 `.gitattributes` (novo arquivo, mitigação do risco 8.1.4 do PRD)

```
*.woff2 binary
```

Garante que o Git nunca aplique conversão de fim de linha (CRLF/LF) nos arquivos de fonte, independentemente da configuração local de quem commita — evita fontes corrompidas que carregam com HTTP 200 mas não renderizam.

### 7.4 Plano de rollback

Se, após a publicação, qualquer critério de aceitação falhar em produção (app quebrado, fonte 404, offline quebrado):

1. Identificar o hash do commit único desta melhoria (`git log --oneline`).
2. `git revert <hash>` — cria um novo commit que desfaz exatamente essa mudança, preservando o histórico (não usar `reset --hard` + `push --force`, que reescreveria o histórico público).
3. Publicar o revert (`git push`), aguardar a republicação do GitHub Pages (tipicamente cerca de 1 minuto, não instantânea — risco 8.1.5 do PRD).
4. Reabrir o app publicado e confirmar visualmente que voltou ao estado anterior (paleta antiga, sem Régua de Zona).
5. Usuárias com o `CACHE_NAME` novo (`src-cache-v2`) já em cache **não** revertem automaticamente para `src-cache-v1` — o revert do commit também reverte `sw.js` para `CACHE_NAME = "src-cache-v1"`; como esse valor é diferente do `v2` que ficou em cache, o mecanismo de limpeza de cache antigo entra em ação de novo, na direção oposta, e restaura o cache anterior na próxima abertura com internet.

---

## 8. Rastreabilidade — critérios de aceitação do PRD

| Critério | Onde esta Spec o satisfaz |
|---|---|
| CA-01 (fundo/marca) | Seção 1.2 (`#050D15`→Grafite; `#22D3EE`/`#FB923C`/`#FFD43B`→Pista nos elementos de ação/badge) |
| CA-02 (fundo de cartões/divisores) | Seção 1.2 (`#0B1825`→Grafite soft, `#162535`→Grafite line, `#3D6482`/`#94B8D4`→tokens de opacidade) |
| CA-03 (cor de zona explícita) | Seção 3.3, passo 3 (`Z([1-5])` → `ZONA[n].hex`), tabela 3.2 |
| CA-04 (Endurance → faixa Z2-Z4) | Seção 3.3, passo 6 (cor) + seção 4.3 (régua `ativos:[2,3,4]`) |
| CA-05 (VO2 → Z5) | Seção 3.3, passo 4 (cor) + seção 4.3 (régua `ativos:[5]`) |
| CA-06 (força) | Seção 3.3, passo 5 (`regua:null`) |
| CA-07 (OFF) | Seção 3.3, passo 2 (`regua:null`) |
| CA-08 (prova → Pista) | Seção 3.3, passo 1 (critério primário, `regua:null`) |
| CA-09 (tipo não reconhecido) | Seção 3.3, passo 7 (default dourado, `regua:{ativos:[]}` — distinção explicada na seção 4.3) |
| CA-10 (régua ponto único) | Seção 4.1-4.3 |
| CA-11 (régua faixa) | Seção 4.3 (Endurance) |
| CA-12 (régua ausente) | Seção 4.3 (lista dos 3 casos `regua:null`) |
| CA-13 (fontes nos papéis certos) | Seção 2.4 (tabela completa de seletor → fonte) |
| CA-14 (fallback de fonte) | Seção 2.2 (`font-display: swap`) + seção 2.3 (pilha de fallback nas variáveis) |
| CA-15 (fontes offline) | Seção 5.2 (`ASSETS` inclui os 7 `.woff2`) + seção 7.1 passo 9 (teste offline) |
| CA-16 (tema do PWA instalado) | Seção 6.1 e 6.2 |
| CA-17 (atualização de instalação existente) | Seção 5.1 (`CACHE_NAME` incrementado) |

---

## Plano de Execução

- [x] Task 1 — Baixar/preparar os 7 arquivos `.woff2` (Bebas Neue 400; Inter 400/500/600/700; IBM Plex Mono 400/500, subset `latin`, mesmos pacotes do `Painel-treino`), nomeados em minúsculas conforme seção 2.1, na pasta `fonts/`.
- [x] Task 2 — Criar `.gitattributes` com `*.woff2 binary` (seção 7.3), antes de adicionar os arquivos de fonte ao controle de versão.
- [x] Task 3 — Reescrever o bloco `<style>` do `index.html`: adicionar `@font-face` (seção 2.2) e `:root` com os tokens de cor e de fonte (seções 1.1 e 2.3), incluindo o bloco `@media (prefers-reduced-motion: reduce)` (seção 4.2).
- [x] Task 4 — Substituir, seletor por seletor, cada cor hardcoded do `<style>` pelo token correspondente, conforme as tabelas de-para das seções 1.2 e 2.4 (cor e fonte), incluindo os seletores com cores "extras" não citadas no PRD.
- [x] Task 5 — Adicionar as classes `.regua-zona`/`.regua-zona__seg` ao `<style>` (seção 4.2).
- [x] Task 6 — Reescrever a função `sc()` no `<script>` conforme a seção 3.3, mantendo a assinatura `sc(tipo, prova)` e o formato de retorno `{text, bar, bg}` mais o novo campo `regua`.
- [x] Task 7 — Inserir o HTML da Régua de Zona no template do hero (entre `.hero-row` e `.hero-center`), condicionado a `heroSt.regua` não ser `null` (seção 4.1 e 4.3).
- [x] Task 8 — Atualizar `manifest.webmanifest` (`background_color`/`theme_color` para `#14171b`, seção 6.1) e a meta tag `theme-color` no `index.html` (seção 6.2).
- [x] Task 9 — Atualizar `sw.js`: incrementar `CACHE_NAME` para `src-cache-v2` e adicionar os 7 caminhos de fonte a `ASSETS` (seção 5.2), só depois de confirmar que os 7 arquivos já estão commitados (seção 5.3).
- [x] Task 10 — Executar a validação local completa (seção 7.1, passos 1 a 10) antes de qualquer commit, corrigindo qualquer item que falhar. **Ver desvio D-06:** parte automatizável executada por script; passos de navegador validados manualmente pelo Everton em 25/07/2026, todos aprovados.
- [ ] Task 11 — Commit único com todas as mudanças (bloco `<style>`, `sc()`, HTML da Régua, `sw.js`, `manifest.webmanifest`, `.gitattributes`, arquivos `.woff2`), conforme seção 7.2.
- [ ] Task 12 — Publicar e validar em produção imediatamente após o deploy: Network sem 404, fontes aplicadas, cache `src-cache-v2` instalado, offline funcional, PWA instalado com a cor Grafite (CA-16/CA-17) — manter o commit do rollback (seção 7.4) pronto para uso caso algo falhe.

---

## Desvios

### D-01 — Origem dos arquivos `.woff2`: cópia local, não download

**Especificado:** Task 1 — "Baixar/preparar os 7 arquivos `.woff2` (...) mesmos pacotes do `Painel-treino`".
**Feito:** os 7 arquivos foram **copiados** de `Painel-treino/node_modules/@fontsource/{bebas-neue,inter,ibm-plex-mono}/files/*-latin-{peso}-normal.woff2`, sem acesso à rede.
**Por quê:** são exatamente os pacotes/pesos/subset que a premissa 5 do PRD manda usar, já presentes em disco. Copiar garante bit a bit o mesmo arquivo que o `Painel-treino` serve (consistência visual entre os apps da família) e evita depender de rede. Integridade conferida: os 7 arquivos têm assinatura `wOF2` e tamanho entre 13 KB e 24 KB (~140 KB no total).

### D-02 — `.footer` estava mapeada sob a cor antiga errada

**Especificado:** a tabela da seção 1.2 lista `.footer` (linha 89) na linha de `#3D6482` → `var(--texto-terciario)`.
**Feito:** `.footer` usa `var(--texto-terciario)`, conforme o destino previsto — mas a cor que ela realmente tinha no código era `#1C3A52`, não `#3D6482`.
**Por quê:** erro de origem na tabela da Spec, não na implementação. O destino (`--texto-terciario`) foi mantido porque é o papel correto (rótulo institucional secundário); só a coluna "cor antiga" estava trocada.

### D-03 — Ocorrências de `#1C3A52` como cor de texto

**Especificado:** seção 1.2 (extras) mapeia `#1C3A52` → `var(--borda)`, citando `.hero-dot` e a borda de `.acc-item+.acc-item`.
**Feito:** `var(--borda)` aplicada nesses dois casos, conforme a Spec. Nos outros dois usos de `#1C3A52` que a Spec não lista — `.day-wake-off` (linha 67, o "—" dos dias de descanso) e `.footer` (ver D-02) — foi usada `var(--texto-terciario)`.
**Por quê:** `--borda` é a cor de texto do tema a **10%** de opacidade, adequada a um divisor mas ilegível como texto informativo. `.day-wake-off` e `.footer` são texto que a usuária precisa conseguir ler.

### D-04 — Cores antigas hardcoded dentro do `<script>`, não previstas na Spec

**Especificado:** a Spec mapeia cores por seletor CSS; as seções 3 e 4 tratam do `<script>` apenas em `sc()` e no HTML da Régua.
**Feito:** três ocorrências adicionais de cor antiga no `<script>` foram migradas:
- o objeto de fallback de `heroSt` (usado quando não há próximo treino): `{text:"#FB923C",bar:"#FB923C",bg:"transparent"}` → `{text:"#d6482e",bar:"#d6482e",bg:"transparent",regua:null}`;
- o `—` de dia sem horário no acordeão, em dois pontos: `color:#3D6482` → `color:var(--texto-terciario)`;
- o `.day-bar` de dia OFF: `#1C3A52` → `var(--zona-off)` (este **estava** previsto na seção 1.2).
**Por quê:** sem isso sobrariam hex da paleta antiga em uso, contrariando o objetivo da melhoria. O campo `regua:null` no fallback é necessário para o novo template do hero não quebrar caso esse caminho seja exercitado.

### D-05 — Cor do texto do botão primário

**Especificado:** a tabela da seção 1.2 mapeia `#0B1825` → `var(--grafite-soft)`, listando apenas os seletores em que ela é **fundo**.
**Feito:** em `.form-actions button`, onde `#0B1825` é a **cor do texto** sobre o fundo Pista, foi usada `var(--grafite)` (a base mais escura), não `--grafite-soft`.
**Por quê:** é o único uso de `#0B1825` como cor de texto, e ali o papel é "texto escuro sobre a cor de marca" — `--grafite` dá mais contraste sobre Pista do que `--grafite-soft`.

### D-06 — Task 10 (validação local) executada apenas na parte automatizável

**Especificado:** seção 7.1, passos 1 a 10 — validação em navegador, incluindo inspeção visual, aba Network, painel de fontes, Service Workers/Cache Storage, teste offline e PWA instalado.
**Feito:** foi executada a parte verificável por script, com todos os resultados positivos:
- `node --check` no `<script>` extraído do `index.html` — nenhum erro de sintaxe (mitigação direta do risco 8.1.1 do PRD);
- chaves do bloco `<style>` balanceadas (86 abre / 86 fecha) e `manifest.webmanifest` parseável como JSON;
- teste de comportamento da nova `sc()` em 14 casos (Z1–Z5, Endurance, VO2, força com e sem acento, `OFF + Estabilidade Core`, `Z3 + Força`, tipo não reconhecido, prova, `tipo` indefinido) — todos com a cor e a régua esperadas, cobrindo CA-03 a CA-09;
- smoke test do `render()` com DOM stubado, confirmando no HTML gerado: Régua com faixa Z2–Z4 para Endurance (CA-11), segmento único para Z4 e para VO2 (CA-10/CA-05), cinco segmentos a 22% para tipo não reconhecido (CA-09), e Régua **ausente** para OFF, força e prova (CA-12); nenhum hex da paleta antiga no HTML produzido;
- conferência **sensível a caixa** (comparação exata contra `readdirSync`, já que o sistema de arquivos do Windows não distingue maiúsculas) das 7 referências de `@font-face` e dos 12 caminhos de `ASSETS` contra os arquivos reais — mitigação dos riscos 8.1.2 e 8.1.3 do PRD;
- varredura de resíduo: nenhuma das 18 cores da paleta antiga permanece em `index.html`, `sw.js` ou `manifest.webmanifest` (exceto `.error-banner`, mantida de propósito conforme seção 1.3).
**Pendente (exige navegador, não automatizável neste ambiente):** inspeção visual da paleta e das três fontes de fato renderizando, aba Network sem 404 servindo por HTTP, Cache Storage com `src-cache-v2` e remoção do `src-cache-v1`, teste offline (CA-15) e PWA instalado com a cor Grafite (CA-16/CA-17).
**Por quê:** o ambiente de execução não tem navegador dirigível.
**Resolução:** os passos pendentes (3, 4, 6, 7, 8, 9 e 10 da seção 7.1) foram executados manualmente pelo Everton em 25/07/2026, com resultado aprovado em todos. A Task 10 está concluída.

