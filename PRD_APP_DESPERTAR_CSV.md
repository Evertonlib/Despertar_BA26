# PRD — App Despertar (BA 2026): migração da lista fixa para CSV

**Documento:** requisitos de produto para desacoplar o app "Despertar" da lista de treinos embutida no código e fazê-lo ler o mesmo CSV usado pelo app de treino da usuária.
**Status:** aguardando aprovação. Nenhum código será escrito antes do "ok".
**Data:** 04/07/2026.

---

## 1. Objetivo da melhoria

Hoje o app "Despertar · BA 2026" é um único arquivo `index.html` publicado no GitHub Pages, com todos os treinos escritos à mão dentro do código (a lista fixa `const S`). Toda vez que o ciclo de treino muda, é preciso editar o código e republicar.

O objetivo desta melhoria é **trocar a origem dos dados**: em vez de ler a lista fixa embutida, o app passará a ler um arquivo **CSV** que a própria usuária seleciona do celular — o mesmo CSV já utilizado pelo outro app de treino dela. Os dados lidos ficam guardados na memória local do navegador, para que o app reabra sem pedir o arquivo de novo, e um botão sempre visível permite atualizar o ciclo quando o CSV mudar. O app também passa a ser instalável e funcionar offline (PWA).

**O que NÃO muda:** o visual, a identidade, o comportamento das duas abas e — o mais importante — a lógica de cálculo do horário de despertar. Muda apenas de onde vêm os números.

---

## 2. Relação com o app de treino que usa o mesmo CSV

Existe um app irmão (pasta `Painel-treino`, "Treino do Dia") que já consome um CSV com o cronograma completo do ciclo. Esse CSV, chamado `dados_do_ciclo.csv`, é a fonte única e confirmada, com as colunas:

```
fase, data, dia, tipo, treino, tempo, rpe, forca
```

- `data` vem no formato **DD/MM/AA** (ex.: `29/06/26`).
- `tempo` é a duração do treino em minutos (ex.: `45`; dias de descanso têm `0`).
- Dias sem corrida aparecem com `tipo` = `OFF` (ou variações como `OFF + Estabilidade Core`).
- A prova aparece na última linha com `tipo` = `Prova` e a palavra `PROVA` (em maiúsculas) dentro da coluna `treino`.

A ideia é que os dois apps compartilhem o **mesmo arquivo**: a usuária mantém um único CSV atualizado e o carrega em cada app. Este app (Despertar) usará apenas parte das colunas (ver mapeamento na seção 8); as demais são ignoradas sem erro.

---

## 3. Arquivos afetados

| Arquivo | Situação | O que acontece |
|---|---|---|
| `index.html` | existente | Recebe a leitura de CSV, a persistência em `localStorage`, o botão de atualizar ciclo, os estados de "sem dados"/erro, e o registro do service worker. Perde a lista fixa `const S` e o mapa fixo de semanas `WL`. |
| `manifest.webmanifest` (nome final a definir) | **novo** | Manifesto do PWA (nome, ícones, cor de tema, modo standalone) para tornar o app instalável. |
| `sw.js` (service worker) | **novo** | Faz o cache dos arquivos essenciais para o app abrir offline. |
| Ícone(s) do app | **novo** | Pelo menos um ícone PNG (ex.: 192px e 512px) referenciado pelo manifesto. |

Observação: o app hoje é um único arquivo. Para virar PWA instalável, precisará de no mínimo o manifesto e o service worker como arquivos separados no mesmo diretório do GitHub Pages. Isso é inerente à tecnologia PWA e não altera o padrão "HTML/CSS/JS puro" — nenhum framework é introduzido.

---

## 4. O que será adicionado

1. **Botão "Carregar/Atualizar ciclo"** sempre acessível, que abre o seletor de arquivos do celular filtrando por CSV.
2. **Leitura do CSV no navegador** a partir do arquivo escolhido, usando apenas recursos nativos do navegador (leitura de arquivo local, sem envio a nenhum servidor).
3. **Parser de CSV simples**, em JavaScript puro, que interpreta o cabeçalho e converte cada linha em um registro interno equivalente ao que a lista fixa fornecia hoje.
4. **Persistência local** dos dados já parseados em `localStorage`, para que o app reabra direto no conteúdo sem pedir o arquivo novamente.
5. **Estados de tela novos:** "nenhum ciclo carregado" (primeira abertura) e "arquivo inválido", com mensagem clara e caminho para tentar de novo — sem quebrar o app.
6. **Derivação automática** do número da semana, do dia de prova e da data-alvo da contagem regressiva a partir do próprio CSV (ver seção 8).
7. **PWA:** manifesto + service worker + ícone, tornando o app instalável na tela inicial e utilizável offline após o primeiro carregamento.

---

## 5. O que será removido

- **A lista fixa `const S`** (os ~72 registros de treino escritos no código). Passa a ser preenchida a partir do CSV.
- **O mapa fixo de rótulos de semana `WL`** (ex.: "S4 · Base", "S7 · Desenvolvimento"). Como o número da semana passará a ser derivado por blocos de 7 dias e a coluna `fase` será ignorada, os títulos ricos de fase deixam de existir; no lugar entram títulos genéricos de semana (ver seção 9, premissas).
- **A data de prova e a contagem regressiva escritas à mão** (a referência fixa a `2026-08-23` e o texto "23 ago 2026"). Passam a ser derivadas do CSV.

---

## 6. O que NÃO será tocado

1. **A lógica da função `wt` (cálculo do horário de despertar).** É o coração do app e deve ser preservada exatamente. Comportamento atual a preservar (descrito abaixo na seção 7). A única mudança permitida é que a duração passada a ela venha do CSV (`tempo`) em vez da lista fixa (`dur`) — o cálculo em si não muda.
2. **O visual e a identidade atuais:** cores, tipografia, layout do "hero" com o horário gigante, cartões de dia, cabeçalho, rodapé — tudo mantido como está.
3. **O comportamento das abas** "Esta Semana" e "Ciclo Completo", incluindo destaque do dia atual, esmaecimento dos dias passados, acordeão por semana e marcação de prova. Só muda a origem dos dados que os alimenta.
4. **A natureza do projeto:** continua HTML/CSS/JS puro, sem framework, num arquivo principal, publicável no GitHub Pages.

---

## 7. Comportamento atual que deve ser preservado (registro da lógica de hoje)

Esta seção documenta como o app funciona **hoje**, para servir de referência do que não pode regredir.

### 7.1 Formato de cada registro (lista fixa `const S`)

Cada item de treino tem: `date` (AAAA-MM-DD), `w` (número da semana), `dia` (abreviação em português: Seg, Ter, ...), `tipo` (ex.: "Z4 LT2", "Endurance", "OFF", "PROVA 21K"), `dur` (duração em minutos), `rpe` (esforço percebido) e, opcionalmente, `prova: true` nos dias de prova.

### 7.2 Função de horário de despertar `wt(dur)` — LÓGICA A PRESERVAR

A função recebe a duração do treino em minutos e devolve um horário no formato `H:MM`. O cálculo exato é:

- Calcula `m = 440 − dur` (um total fixo de **440 minutos** menos a duração do treino).
- O resultado `m` é interpretado como minutos desde a meia-noite: a hora é a parte inteira de `m ÷ 60` e os minutos são o resto de `m ÷ 60`, com dois dígitos.

Interpretação do que isso representa: **440 minutos equivalem a 7h20**. O app assume, na prática, que o treino **termina por volta das 8:00** (mostrado na tela como "término ~8:00") e que há uma **folga fixa de 40 minutos** entre acordar e começar a correr. Assim, o horário de despertar é "7h20 menos a duração do treino" — quanto mais longo o treino, mais cedo se acorda. Exemplos com os dados atuais: treino de 43 min → **6:37**; treino de 40 min → **6:40**; treino de 55 min → **6:25**.

**Regra para esta melhoria:** manter esse cálculo idêntico (o mesmo total de 440, a mesma conta, o mesmo formato). A única diferença é que o número de minutos passado à função virá da coluna `tempo` do CSV em vez do campo `dur` da lista fixa.

### 7.3 Cabeçalho e contagem regressiva ("faltam X d")

O cabeçalho mostra um subtítulo fixo ("Ciclo · Buenos Aires / Meia Maratona · 23 ago 2026") e, à direita, "faltam X d". Hoje o "X" é calculado como a diferença, em dias, entre uma **data de prova fixa no código (23/08/2026)** e a data de hoje, arredondada para cima e nunca negativa (mínimo zero). Nesta melhoria, essa data-alvo passa a ser derivada do CSV (ver seção 8).

### 7.4 Escolha do treino em destaque (o "hero")

O bloco de destaque mostra o próximo treino relevante. A regra atual é: se **amanhã** houver treino e ele não for OFF, mostra o de amanhã (rótulo "Amanhã"); caso contrário, mostra o **primeiro treino futuro** com data depois de hoje (rótulo "Próximo treino"). Se esse treino for de prova, o hero troca o horário por "🏁 DIA DE PROVA". Caso contrário, mostra o horário de despertar em destaque, mais duração, RPE e "término ~8:00". Esse comportamento é mantido.

### 7.5 Aba "Esta Semana"

Mostra o rótulo da semana atual e lista os dias daquela semana. Para cada dia: destaca o dia de hoje, esmaece os dias já passados, colore conforme o tipo de treino, mostra duração e RPE quando há treino, e na direita mostra o horário de despertar (via `wt`), ou "descanso" se for OFF, ou "PROVA" se for dia de prova. A "semana atual" é a semana do treino em destaque.

### 7.6 Aba "Ciclo Completo"

Agrupa todos os treinos por número de semana e monta um acordeão: cada semana é um cabeçalho clicável que abre/fecha a lista de dias daquela semana (dias OFF são omitidos nessa visão). A semana atual começa aberta; as outras, fechadas. Cada linha mostra dia/data, tipo, duração/RPE e o horário de despertar (ou 🏁 na prova).

### 7.7 Cores por tipo de treino

Há uma função que escolhe a cor conforme o texto do tipo (PROVA, Endurance, Z5, Z4/Fartlek, Z2/Z3, ou neutro). Ela é dirigida por texto e continua funcionando com os tipos vindos do CSV, sem mudança.

---

## 8. Mapeamento de dados (CSV → app)

| Campo no app (hoje) | Origem no CSV | Regra |
|---|---|---|
| duração usada por `wt()` e pelas telas (`dur`) | **`tempo`** | Convertida para número inteiro de minutos. |
| `date` (AAAA-MM-DD) | **`data`** (DD/MM/AA) | Convertida de DD/MM/AA para o formato interno de data. O ano de dois dígitos é interpretado como 20AA. |
| `dia` (Seg, Ter, ...) | **`dia`** | Usado diretamente. |
| `tipo` | **`tipo`** | Usado diretamente (alimenta rótulo e cor). |
| `rpe` | **`rpe`** | Usado diretamente quando presente. |
| número da semana (`w`) | **derivado** | Agrupar as datas em **blocos de 7 dias a partir da primeira data do ciclo**: dias 1–7 = semana 1, 8–14 = semana 2, etc. Não depende de coluna nova. Se não for possível derivar (datas ausentes/invalidáveis), a aba "Ciclo Completo" lista por data, sem título de semana, sem quebrar. |
| dia de prova (`prova`) | **derivado** | Marcar como prova quando o texto de `tipo` **ou** `treino` contiver "PROVA" (comparação sem diferenciar maiúsculas/minúsculas). Se nada casar, nenhum dia é marcado como prova e o app funciona normalmente. |
| data-alvo da contagem regressiva | **derivada** | A data do dia de prova, se houver; caso contrário, a **última data** do ciclo. É o alvo de "faltam X d". |
| `fase` | — | **Ignorada.** |
| `forca` | — | **Ignorada.** |

**Observação importante sobre a detecção de prova:** no CSV real confirmado, a linha da prova traz `tipo = "Prova"` (apenas inicial maiúscula) e a palavra `PROVA` em maiúsculas na coluna `treino`. Por isso a regra precisa ser insensível a maiúsculas/minúsculas e olhar as duas colunas — não basta comparar `tipo` exatamente com "PROVA".

**Regra geral:** semana e prova são **opcionais**. O núcleo do app — horário de despertar + próximo treino/amanhã + lista do ciclo — deve funcionar mesmo que a semana e a prova não possam ser derivadas.

---

## 9. Premissas assumidas

1. O CSV usa vírgula como separador e tem uma linha de cabeçalho com exatamente os nomes de coluna informados (`fase, data, dia, tipo, treino, tempo, rpe, forca`), na primeira linha.
2. As colunas obrigatórias para este app são **`data`, `dia`, `tipo` e `tempo`**. `rpe` é usado se presente. `fase` e `forca` podem existir ou não — são ignoradas de qualquer modo.
3. Datas vêm em DD/MM/AA com ano de dois dígitos, interpretado como século 21 (ex.: `26` → 2026).
4. Como a coluna `fase` é ignorada e a semana é derivada por blocos de 7 dias, os títulos de fase atuais ("S4 · Base", etc.) deixam de existir. Os cabeçalhos de semana passam a ser genéricos (ex.: "Semana 1", "Semana 2", ...). Isso é uma consequência aceita da regra de ignorar `fase`.
5. A folga de 40 minutos e o horário de término ~8:00 embutidos na função `wt` continuam válidos e não são configuráveis nesta melhoria.
6. O texto do cabeçalho que hoje cita "Buenos Aires / Meia Maratona / 23 ago 2026" pode passar a refletir a data derivada do CSV; o nome do evento em si não vem no CSV e pode permanecer como texto fixo de identidade do app (a definir na implementação, sem impacto na lógica).
7. Um dia OFF pode vir com variações de texto (ex.: "OFF + Estabilidade Core"); o app trata como dia sem corrida quando o tipo começa/contém "OFF" — mantendo o comportamento atual de "descanso" e sem horário de despertar.
8. O CSV pode conter uma coluna `treino` com textos longos e com vírgulas internas dentro dos campos; o parser precisa lidar com campos entre aspas, caso existam. (No arquivo atual os campos longos não usam aspas, mas o parser deve ser tolerante.)
9. Todo o processamento é local no navegador; nenhum dado é enviado a servidor.

---

## 10. Riscos

1. **Campos com vírgula na coluna `treino`.** Se um campo contiver vírgula sem estar entre aspas, um parser ingênuo quebraria a linha em colunas demais. Mitigação: o parser deve ser robusto a isso (contar colunas pela posição das obrigatórias, ou tratar aspas), e uma linha malformada não deve derrubar o app inteiro.
2. **Divergência de semana em relação ao original.** Os blocos de 7 dias a partir da primeira data podem não coincidir com o agrupamento Segunda–Domingo que a lista fixa usava. Isso é aceito por requisito (semana é derivada e opcional), mas pode surpreender visualmente. Mitigação: documentado aqui; títulos genéricos "Semana N".
3. **Perda dos rótulos de fase.** Sem a coluna `fase`, os nomes descritivos ("Desenvolvimento", "Polimento") somem dos cabeçalhos. Risco de percepção de "regressão visual". Mitigação: aceito por requisito; pode ser reavaliado no futuro sem quebrar este escopo.
4. **`localStorage` limitado ou desabilitado.** Em navegação privada ou com armazenamento bloqueado, os dados podem não persistir. Mitigação: o app ainda funciona na sessão atual após carregar o CSV; se não persistir, na próxima abertura volta ao estado "sem ciclo" e pede o arquivo de novo — sem erro.
5. **Cache do PWA servindo versão antiga.** O service worker pode manter em cache uma versão desatualizada do app após um deploy. Mitigação: estratégia de cache simples com versionamento do service worker, de forma que atualizar o app não deixe a usuária presa numa versão antiga.
6. **Fuso horário / "hoje".** O cálculo de "hoje", "amanhã" e "faltam X d" depende do relógio do dispositivo. Mantém-se o comportamento atual (data local do dispositivo).
7. **Ano de dois dígitos.** Assumir século 21 é seguro para este ciclo, mas é uma suposição explícita.

---

## 11. Critérios de aceitação

Cada critério descreve um cenário (entrada → resultado esperado). Incluídos os cenários de erro exigidos.

### Fluxo principal

**CA-01 — Carregar um CSV válido pela primeira vez.**
Entrada: primeira abertura do app (nada salvo); a usuária toca em "Carregar ciclo" e escolhe o `dados_do_ciclo.csv` válido.
Resultado: o app lê o arquivo, monta os treinos, exibe o hero com o horário de despertar do próximo treino (ou de amanhã), a contagem regressiva e as duas abas funcionando — exatamente como o app fazia com a lista fixa, agora com os dados do CSV.

**CA-02 — Horário de despertar idêntico à lógica atual.**
Entrada: um treino com `tempo = 45`.
Resultado: o horário exibido é **6:35** (440 − 45 = 395 min = 6:35), no mesmo formato H:MM de hoje. Para `tempo = 43` → **6:37**; para `tempo = 55` → **6:25**. Ou seja, o cálculo de `wt` não mudou; só a origem do número.

**CA-03 — Reabrir sem pedir o arquivo de novo.**
Entrada: a usuária já carregou um CSV numa sessão anterior e fecha/reabre o app.
Resultado: o app abre direto no conteúdo salvo, sem pedir o arquivo, mostrando os mesmos treinos. O botão "Atualizar ciclo" continua visível.

**CA-04 — Atualizar o ciclo com um CSV novo.**
Entrada: com um ciclo já carregado, a usuária toca em "Atualizar ciclo" e escolhe um CSV diferente e válido.
Resultado: os dados anteriores são substituídos pelos novos, as telas refletem o novo ciclo, e o novo conteúdo passa a ser o que fica salvo para as próximas aberturas.

**CA-05 — Derivação de semana por blocos de 7 dias.**
Entrada: um CSV cujas datas cobrem, por exemplo, 29/06 a 23/08.
Resultado: a aba "Ciclo Completo" agrupa os dias em semanas de 7 dias a partir da primeira data (dias 1–7 = "Semana 1", 8–14 = "Semana 2", ...), com o acordeão abrindo a semana atual por padrão, como hoje.

**CA-06 — Derivação do dia de prova.**
Entrada: uma linha com `tipo = "Prova"` e `treino` contendo "PROVA Meia Maratona...".
Resultado: esse dia é marcado como prova — o hero mostra "🏁 DIA DE PROVA" quando ele for o destaque, a aba "Esta Semana" mostra "PROVA" no lugar do horário, e a aba "Ciclo Completo" mostra 🏁. A contagem regressiva "faltam X d" aponta para a data dessa prova.

**CA-07 — Colunas `fase` e `forca` ignoradas.**
Entrada: o CSV inclui as colunas `fase` e `forca` preenchidas.
Resultado: o app funciona normalmente e não usa nem exibe esses campos; nenhum erro ocorre por eles existirem.

### Cenários de "sem prova" / "sem semana"

**CA-08 — CSV sem nenhuma prova.**
Entrada: um CSV válido em que nenhuma linha contém "PROVA" em `tipo` ou `treino`.
Resultado: nenhum dia é marcado como prova; o app funciona normalmente. A contagem regressiva usa a **última data** do ciclo como alvo.

**CA-09 — Semana não derivável.**
Entrada: um CSV cujas datas não permitem agrupamento em semanas (ex.: datas ausentes ou inconsistentes).
Resultado: a aba "Ciclo Completo" lista os treinos por data, sem títulos de semana, sem quebrar. O núcleo (horário de despertar e próximo treino) continua funcionando.

### Cenários de erro

**CA-10 — Primeira abertura sem CSV carregado.**
Entrada: app aberto pela primeira vez, nada salvo.
Resultado: em vez de telas vazias ou quebradas, aparece um estado claro de "nenhum ciclo carregado" com o botão para carregar o CSV. O app não trava.

**CA-11 — Memória local apagada.**
Entrada: a usuária tinha um ciclo salvo, mas a memória local foi limpa (limpeza de dados do navegador, navegação privada, etc.).
Resultado: o app volta ao estado "nenhum ciclo carregado" (CA-10) e pede o arquivo novamente, sem erro nem tela quebrada.

**CA-12 — Arquivo selecionado não é um CSV válido.**
Entrada: a usuária escolhe um arquivo que não é CSV, ou um CSV sem as colunas obrigatórias (`data`, `dia`, `tipo`, `tempo`).
Resultado: o app mostra uma mensagem clara de "arquivo inválido" e mantém o estado anterior (se já havia um ciclo salvo, ele continua exibido; se não havia, permanece no estado "nenhum ciclo carregado"). Não trava nem salva dados inválidos.

**CA-13 — Linha com data inválida.**
Entrada: um CSV válido no geral, mas com uma linha cuja `data` não é uma data reconhecível.
Resultado: essa linha é descartada (ou ignorada) sem derrubar o restante; os demais treinos aparecem normalmente. Se por causa disso a semana não puder ser derivada, aplica-se CA-09.

**CA-14 — Linha com `tempo` não numérico.**
Entrada: uma linha cujo `tempo` não é um número.
Resultado: o app não quebra. Essa duração é tratada como ausente/zero (dia sem horário de despertar calculável, exibido de forma coerente com o tratamento de OFF/descanso), e os demais dias seguem normais. Nenhum horário incorreto é exibido.

**CA-15 — Data atual antes do início do ciclo.**
Entrada: hoje é anterior à primeira data do CSV.
Resultado: o hero mostra o primeiro treino futuro (o começo do ciclo) como "Próximo treino"; a contagem regressiva mostra os dias até a prova/última data; nada aparece como "passado". App funciona normalmente.

**CA-16 — Data atual depois do fim do ciclo.**
Entrada: hoje é posterior à última data do CSV (ciclo encerrado).
Resultado: não há "próximo treino" futuro; o app não quebra. A contagem regressiva mostra "faltam 0 d" (nunca negativa) e as abas exibem o ciclo já concluído (todos os dias como passados). Nenhum horário de despertar é inventado para datas inexistentes.

### PWA

**CA-17 — Instalação.**
Entrada: a usuária abre o app num navegador compatível.
Resultado: o app é instalável na tela inicial (manifesto válido, ícone e nome corretos) e abre em modo de aplicativo (sem barra de navegador), preservando o visual atual.

**CA-18 — Uso offline.**
Entrada: após abrir o app online ao menos uma vez (com o ciclo já carregado e salvo), a usuária abre o app sem internet.
Resultado: o app carrega normalmente a partir do cache e mostra o ciclo salvo, incluindo horário de despertar e as duas abas. Carregar um CSV novo continua sendo uma ação local que também funciona offline.

---

## 12. Fora de escopo (nesta melhoria)

- Editar treinos dentro do app (o CSV continua sendo a fonte; edições acontecem em quem gera o CSV).
- Tornar a folga de 40 minutos ou o horário de término configuráveis.
- Sincronização em nuvem ou login. Tudo é local no dispositivo.
- Notificações/alarmes de despertar.
- Reintroduzir os nomes de fase nos títulos de semana (poderá ser reavaliado depois).

---

*Aguardando aprovação deste PRD antes de qualquer implementação.*
