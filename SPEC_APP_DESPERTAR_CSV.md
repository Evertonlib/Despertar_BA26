# SPEC — Sistema Ritmo Certo (Despertar): migração da lista fixa para CSV

**Documento:** especificação técnica derivada do `PRD_APP_DESPERTAR_CSV.md` aprovado, após leitura do `index.html` real.
**Status:** aguardando aprovação. Nenhum código será escrito antes do "ok".
**Data:** 04/07/2026.
**Arquivo afetado:** apenas `index.html` (mais os novos arquivos de PWA: manifest, service worker, ícones).

---

## 0. Observações de leitura do código (PRD vs. `index.html` real)

O PRD descreve corretamente a estrutura geral, mas a leitura linha a linha do código revelou pontos onde o comportamento real é mais estrito (ou usa atalhos) do que o texto do PRD sugere para os novos requisitos. Onde há diferença, **o código prevalece como descrição do comportamento de hoje**; as correções abaixo são decisões de design para os novos requisitos do CSV, não reinterpretações do PRD.

1. **`wt(dur)` (linha 176-179):** confere exatamente com a seção 7.2 do PRD — `m = 440 - dur`, formato `H:MM`. Nenhuma divergência.

2. **`const S` (linha 92-167):** formato de registro confere exatamente com a seção 7.1 do PRD (`date, w, dia, tipo, dur, rpe`, `prova` opcional).

3. **Detecção de "dia OFF" é por igualdade exata, não por prefixo/conteúdo.** O código testa `s.tipo === "OFF"` (linha 280), `s.tipo !== "OFF"` (linha 309) e `ts.tipo !== "OFF"` em `getHero()` (linha 209) — comparação **exata**, não `startsWith`/`includes`. A premissa 7 do PRD exige tratar variações como `"OFF + Estabilidade Core"` como dia sem corrida. Com o código atual, uma linha assim **não seria** reconhecida como OFF (cairia no fluxo de dia normal, tentando calcular `wt()` sobre ela). Isso não é uma contradição do PRD com o código de hoje — é um requisito novo (premissa 7) que exige mudar essa checagem. Tratado na seção 4.4 abaixo.

4. **A cor de "prova" em `sc(tipo)` é por prefixo exato e case-sensitive.** Linha 182: `tipo.startsWith("PROVA")` (maiúsculas). A seção 8 do PRD registra que, no CSV real, a linha de prova vem com `tipo = "Prova"` (só a inicial maiúscula) — ou seja, `startsWith("PROVA")` **não bateria** com o dado real, e a linha de prova perderia a cor/destaque dourado no `sc()`, mesmo estando corretamente marcada como `prova:true` no registro interno. Esta é uma divergência real que precisa ser corrigida: `sc()` deve receber também a flag `prova` derivada (que já é case-insensitive, seção 8 do PRD) e usar essa flag como critério primário de cor, em vez de depender do texto de `tipo`. Tratado na seção 4.5.

5. **Fallback de semana "atual" (`cw`) é uma constante mágica hoje.** Linha 217: `const cw = hero?.w ?? 6`. Quando não há "hero" (nenhum treino de amanhã, nenhum treino futuro — cenário de fim de ciclo, CA-16), o código cai num valor fixo `6`, que hoje corresponde a uma semana real da lista fixa. Com semanas derivadas do CSV, esse `6` não tem mais significado nenhum e pode nem existir no ciclo carregado — a aba "Esta Semana" e o acordeão da "Ciclo Completo" ficariam órfãos ou vazios em CA-16. Tratado na seção 4.6 (decisão: usar a semana do último registro do ciclo como fallback, em vez de constante fixa).

6. **`WL` (mapa de rótulos de semana) é usado em 3 pontos**, não só na aba de listagem: `hero-meta` (linha 246), `sec-label` da aba "Esta Semana" (linha 275) e botão de acordeão da "Ciclo Completo" (linha 313). Os três precisam trocar `WL[w]` por um rótulo genérico derivado (`"Semana N"`), conforme premissa 4 do PRD.

7. **`dl` (contagem regressiva) usa uma data literal fixa** (`new Date("2026-08-23")`, linha 219) comparada a `new Date(td)` — ambos strings `"AAAA-MM-DD"`, então o parsing (UTC-midnight) é consistente entre os dois lados; não há bug de fuso a corrigir, só a necessidade de trocar a string fixa pela data-alvo derivada (seção 8 do PRD).

8. **Nenhum tratamento hoje para duração inválida/ausente.** O CA-14 do PRD exige que uma linha com `tempo` não numérico não gere um horário incorreto. Hoje `s.dur` sempre vem de um literal numérico válido, então esse caso não existe no código atual — é comportamento novo a implementar (seção 4.3 e 5.4).

9. **Nada de PWA existe hoje** (sem manifest, sem service worker, sem ícone próprio) — confere com o PRD, é tudo novo.

Essas observações moldam as decisões de design das seções 4 a 7.

---

## 1. Objetivo (recapitulação)

Substituir a origem dos dados de treino de uma lista fixa (`const S`, `WL`, data de prova fixa) para um CSV escolhido pela usuária no dispositivo, mantendo intacta a fórmula de `wt()`, o visual e o comportamento das duas abas, e tornando o app um PWA instalável e offline. Identidade visual passa a ser "Sistema Ritmo Certo".

---

## 2. Estrutura de dados interna (substitui `const S`)

Mantido o mesmo formato de registro já usado pelo `render()` hoje, para minimizar mudança na camada de exibição — apenas a origem passa a ser o CSV parseado em vez do literal:

```js
{
  date: "AAAA-MM-DD",   // convertido de "data" (DD/MM/AA)
  dia:  "Seg",           // direto de "dia"
  tipo: "Z4 LT2",        // direto de "tipo"
  dur:  45,              // Number(tempo); null se tempo não for numérico (CA-14)
  rpe:  8,               // direto de "rpe" (pode ser undefined/"" se ausente)
  prova: true,           // derivado: tipo OU treino contém "PROVA" (case-insensitive)
  w:    3                // derivado por blocos de 7 dias; ausente se não for possível derivar (CA-09)
}
```

`S` deixa de ser `const` e passa a ser uma variável populada a partir do CSV (parseado agora, ou recuperado do `localStorage` na abertura seguinte). `WL` é removido — os rótulos de semana passam a ser gerados como `` `Semana ${w}` ``.

---

## 3. Parser de CSV

### 3.1 Leitura do arquivo
- `<input type="file" accept=".csv">` acionado pelo botão "Carregar/Atualizar ciclo".
- Leitura via `FileReader.readAsText`, sem envio a servidor.

### 3.2 Split de linhas e campos
- Quebrar o texto em linhas por `\n`, removendo `\r` residual (arquivos com `\r\n`).
- Ignorar linhas totalmente vazias.
- Função de split de campo **tolerante a aspas**: percorre a linha caractere a caractere, tratando `"` como abre/fecha campo (permitindo vírgula dentro do campo entre aspas) e `""` dentro de um campo entre aspas como aspas literal escapada. Isso atende a premissa 8 e o risco 1 do PRD.

### 3.3 Cabeçalho e colunas obrigatórias
- Primeira linha não vazia é o cabeçalho. Mapear nome de coluna (trim) → índice.
- Colunas obrigatórias: `data`, `dia`, `tipo`, `tempo` (premissa 2 do PRD). Se qualquer uma faltar no cabeçalho → arquivo inválido (CA-12): aborta o parse inteiro, preserva estado anterior, mostra mensagem de erro.
- `fase` e `forca`, se presentes, são lidas mas descartadas (ignoradas, seção 8 do PRD).
- `rpe` e `treino` são lidas se presentes; ausência delas não invalida o arquivo.

### 3.4 Conversão por linha
Para cada linha de dados (não cabeçalho):
1. **Data:** `DD/MM/AA` → validar dia/mês numéricos plausíveis (dia 1-31, mês 1-12); ano de 2 dígitos → `2000+AA`. Se não for reconhecível, a linha inteira é **descartada** (CA-13), sem interromper o restante do arquivo.
2. **`dur`:** `parseInt(tempo, 10)`. Se não for um número válido, `dur = null` (CA-14) — a linha **não** é descartada, apenas fica sem duração/horário calculável.
3. **`dia`, `tipo`:** usados como string, direto (trim).
4. **`rpe`:** usado como veio (string ou número), direto; vazio/ausente vira `undefined`.
5. **`prova`:** `true` se `tipo.toUpperCase().includes("PROVA")` **ou** `treino.toUpperCase().includes("PROVA")`; senão `false`/ausente.
6. Registro válido é acrescentado à lista de saída.

### 3.5 Pós-processamento
- Ordenar os registros válidos por `date` ascendente (defensivo — o CSV já deve vir ordenado, mas não presumir).
- **Semana (`w`):** se houver ao menos 1 registro com data válida, `w = floor((date - primeiraData) / 7 dias) + 1` para todos os registros. Se não houver nenhuma data válida (todas as linhas descartadas por CA-13, ou arquivo vazio de dados), nenhum registro recebe `w` — aciona o modo "sem semana" (CA-09).
- **Data-alvo da contagem regressiva:** data do registro com `prova === true` mais recente (se houver mais de um marcado, usa a de maior data); senão, a última data do ciclo (já ordenado).
- Se, depois de todo o parse, **nenhum registro válido restar**, tratar como arquivo inválido (CA-12) — mensagem de erro, sem substituir o ciclo salvo.

---

## 4. Ajustes na lógica de exibição (`render`, `getHero`, `sc`)

### 4.1 `wt(dur)` — sem alteração na fórmula
Passa a receber a duração vinda do CSV (`s.dur`) e uma base calculada a partir da hora de término escolhida:

```js
const baseMin = horaTerminoParaMinutos(horaTermino) - 40; // substitui o "440" fixo
const wt = dur => {
  const m = baseMin - dur;
  return `${Math.floor(m/60)}:${(m%60).toString().padStart(2,"0")}`;
};
```
`horaTerminoParaMinutos("HH:MM")` converte a hora escolhida (ex.: `"08:00"` → 480; `"06:30"` → 390). A fórmula em si (subtrair duração e 40 min) não muda.

### 4.2 `getHero()`
Mesma lógica (amanhã se não-OFF, senão primeiro treino futuro), só trocando a checagem de OFF por igualdade exata para a checagem tolerante (seção 4.4).

### 4.3 Duração ausente/inválida (`dur === null`)
Onde hoje o código decide entre "descanso" (OFF), "PROVA" ou `wt(s.dur)`, passa a ter uma terceira condição: se `dur === null` e o dia não é OFF nem prova, mostrar um estado neutro (ex.: `"—"`, mesmo estilo visual do `day-wake-off`) em vez de chamar `wt(null)`. Aplica-se nos três pontos que hoje chamam `wt()`: hero (linha 254), linha do dia na aba "Esta Semana" (linha 297) e item do acordeão na "Ciclo Completo" (linha 330).

### 4.4 Detecção de "OFF" tolerante a variações
Substituir as 3 comparações exatas (`=== "OFF"` / `!== "OFF"`) por uma função única:
```js
const isOffTipo = tipo => (tipo || "").trim().toUpperCase().startsWith("OFF");
```
Usada em `getHero()`, na aba "Esta Semana" e no filtro da "Ciclo Completo". Atende à premissa 7 do PRD (variações como "OFF + Estabilidade Core").

### 4.5 Cor/destaque de prova em `sc()`
`sc(tipo, prova)` passa a receber o flag `prova` derivado (seção 3.4) como segundo parâmetro e usá-lo como critério primário, antes do teste textual:
```js
const sc = (tipo, prova) => {
  if (prova) return {text:"#FFD43B", bar:"#FFD43B", bg:"rgba(255,212,59,.12)"};
  if (tipo.includes("Endurance")) ...
  // demais regras inalteradas
};
```
Isso corrige a divergência da seção 0.4 (tipo real "Prova" não bate com `startsWith("PROVA")`).

### 4.6 Semana "atual" (`cw`) sem constante mágica
Troca o fallback fixo `?? 6` por: se não há `hero` (fim de ciclo, CA-16), usar o `w` do **último registro** do ciclo (`S[S.length-1]?.w`). Se `S` estiver vazio, a tela nem chega a este ponto (estado "sem ciclo carregado").

### 4.7 Rótulo de semana genérico
Todo uso de `WL[w]` é trocado por `` `Semana ${w}` ``. Se `w` for `undefined` (CA-09, semana não derivável), a "Ciclo Completo" lista os registros por data sem agrupar em acordeão (uma lista simples ordenada por data), e a aba "Esta Semana" mostra a mensagem "Semana não disponível" no lugar do `sec-label`, mas mantém hero e funcionamento normal.

---

## 5. Persistência (`localStorage`)

### 5.1 Chave e schema
Uma única chave, ex. `srcCiclo`, contendo um JSON:
```json
{
  "versao": 1,
  "horaTermino": "08:00",
  "nomeEvento": "Meia Maratona de Buenos Aires",
  "carregadoEm": "2026-07-04T12:00:00.000Z",
  "treinos": [ { "date": "...", "dia": "...", "tipo": "...", "dur": 45, "rpe": 8, "prova": false, "w": 3 }, ... ]
}
```

### 5.2 Abertura do app
- Ler a chave; se ausente ou JSON inválido → estado "nenhum ciclo carregado" (CA-10/CA-11).
- Se presente e válida → popular `S`, `horaTermino`, `nomeEvento` e renderizar normalmente (CA-03).

### 5.3 Carregar/Atualizar ciclo
- Botão sempre visível (rótulo "Carregar ciclo" no estado vazio, "Atualizar ciclo" quando já há dados).
- Ao escolher um arquivo: parse (seção 3). Se inválido (CA-12) → mostrar mensagem de erro, **não** sobrescrever `localStorage` nem o estado em memória atual.
- Se válido: exibir um pequeno formulário para confirmar **hora de término** (obrigatória) e **nome do evento** (opcional), pré-preenchido com os valores salvos anteriormente (se existirem) ou vazio/padrão na primeira carga. Ao confirmar, grava tudo em `localStorage` e re-renderiza (CA-01, CA-02b, CA-02c, CA-04).

### 5.4 Linhas descartadas
Linhas com data inválida são silenciosamente descartadas do array final (CA-13); linhas com `tempo` inválido permanecem no array com `dur: null` (CA-14) — não afetam a validade geral do arquivo.

---

## 6. Cabeçalho e identidade

- `<title>` e `hdr-sub` passam a refletir "Sistema Ritmo Certo".
- `hdr-desc` passa a mostrar a data derivada (data-alvo, formatada) e, se `nomeEvento` estiver preenchido, o nome antes da data (ex.: `"Meia Maratona de Buenos Aires · 23 ago 2026"`); se vazio, mostra só a data (premissa 6, CA-02c).
- `dl` (dias restantes) passa a usar a data-alvo derivada (seção 3.5) em vez do literal `"2026-08-23"`.

---

## 7. Estados de tela novos

1. **Sem ciclo carregado** (primeira abertura ou `localStorage` vazio/limpo): mensagem + botão "Carregar ciclo". Nenhuma aba, hero ou header de ciclo é renderizado.
2. **Arquivo inválido** (CSV sem colunas obrigatórias, não-CSV, ou zero linhas válidas após parse): mensagem de erro visível (ex. banner temporário), mantendo o que já estava na tela antes da tentativa (ciclo anterior ou estado "sem ciclo").
3. **Normal**: layout atual (header, hero, tabs) alimentado pelos dados do CSV.
4. **Ciclo sem semana derivável** (CA-09): normal, mas sem agrupamento por semana na "Ciclo Completo" e com rótulo "Semana não disponível" na "Esta Semana".
5. **Fim de ciclo** (CA-16): sem hero, contagem "faltam 0 d", abas mostram tudo como passado.

---

## 8. PWA

- **`manifest.webmanifest`** (novo arquivo): `name: "Sistema Ritmo Certo"`, `short_name`, `start_url: "."`, `display: "standalone"`, `background_color: "#050D15"`, `theme_color: "#050D15"`, ícones 192px e 512px referenciando os novos arquivos de ícone.
- **`sw.js`** (novo arquivo): cache-first dos arquivos estáticos essenciais (`index.html`, manifest, ícones); nome de cache versionado (ex. `src-cache-v1`); no evento `activate`, remove caches de versões antigas — mitigação do risco 5 do PRD (cache preso em versão antiga).
- **Ícone(s)** (novo, gerado no projeto): fundo escuro (`#0B1825`, no tom do app) com símbolo laranja (`#FB923C`) remetendo a despertador/ritmo, exportado em 192×192 e 512×512, referenciado no manifest — substitui o quadrado azul genérico.
- `index.html` passa a registrar o service worker (`navigator.serviceWorker.register('sw.js')`) e referenciar o manifest via `<link rel="manifest">`.

---

## 9. Fora de escopo (reconfirmado do PRD)

Edição de treinos no app, folga de 40 min configurável, sincronização em nuvem/login, notificações/alarmes, rótulos de fase nos títulos de semana.

---

## Plano de Execução

- [x] Task 1 — Extrair `wt()`, `sc()`, `getHero()` e o `render()` atual para trabalharem sobre uma variável `S` (não mais `const`), sem nenhuma outra mudança de comportamento (passo de preparação, sem alterar a UI).
- [x] Task 2 — Implementar o parser de CSV tolerante a aspas (split de linha/campo) como função pura, testável isoladamente com exemplos de texto CSV (sem ainda conectar ao app).
- [x] Task 3 — Implementar a conversão por linha (data DD/MM/AA → AAAA-MM-DD, `dur` numérico ou `null`, derivação de `prova` case-insensitive) e a validação de colunas obrigatórias, retornando lista de registros + lista de erros/descartes.
- [x] Task 4 — Implementar a derivação de semana (`w`) por blocos de 7 dias e da data-alvo da contagem regressiva (prova mais recente ou última data), incluindo os casos "não derivável".
- [x] Task 5 — Adicionar o botão "Carregar/Atualizar ciclo" com `<input type="file">`, disparando o parser e mostrando mensagem de erro em caso de CSV inválido, sem ainda persistir nada.
- [x] Task 6 — Adicionar o formulário de hora de término (obrigatória) e nome do evento (opcional) exibido após um parse bem-sucedido, e recalcular `wt()`/cabeçalho com esses valores em memória.
- [x] Task 7 — Implementar a persistência em `localStorage` (schema da seção 5.1): salvar ao confirmar o formulário, e carregar automaticamente na abertura do app.
- [x] Task 8 — Implementar os estados de tela "nenhum ciclo carregado" e "arquivo inválido" (seção 7), cobrindo primeira abertura, `localStorage` limpo e CSV rejeitado.
- [x] Task 9 — Corrigir a detecção de "OFF" para tolerante a variações (`isOffTipo`, seção 4.4) e a cor/destaque de prova via flag derivada em `sc()` (seção 4.5), substituindo os testes exatos/case-sensitive atuais.
- [x] Task 10 — Substituir `WL[w]` pelo rótulo genérico `Semana N` nos 3 pontos de uso, tratar `w` ausente (lista por data sem acordeão) e substituir o fallback fixo de `cw` pela semana do último registro (seção 4.6).
- [x] Task 11 — Tratar `dur === null` na exibição (hero, "Esta Semana", "Ciclo Completo") sem chamar `wt()` com valor inválido (seção 4.3).
- [x] Task 12 — Atualizar cabeçalho/identidade: título "Sistema Ritmo Certo", nome do evento opcional, data e contagem regressiva derivadas do CSV (seção 6).
- [x] Task 13 — Testar manualmente os cenários de aceitação CA-01 a CA-16 (fluxo principal, sem prova/semana, e erros) num CSV de exemplo.
- [x] Task 14 — Criar `manifest.webmanifest` e o(s) ícone(s) do app, e referenciar o manifest no `index.html`.
- [x] Task 15 — Criar `sw.js` com cache versionado dos arquivos essenciais e limpeza de caches antigos, e registrar o service worker no `index.html`.
- [ ] Task 16 — Testar instalação (CA-17) e uso offline (CA-18) num navegador compatível.

---

## Desvios

1. **Task 13 — método de teste manual substituído por testes automatizados via jsdom.** O Spec pede para "testar manualmente" os cenários CA-01 a CA-16 em um navegador. Este ambiente de execução não tem acesso a um navegador gráfico. Em vez de pular a verificação, os 16 cenários foram traduzidos em asserções automatizadas que carregam o `index.html` real via `jsdom` e dirigem o app pelos mesmos caminhos que um uso real usaria (preencher o formulário, confirmar, trocar de aba, reabrir com `localStorage` pré-populado etc.), lendo o resultado do DOM gerado. As 50 asserções (cobrindo CA-01 a CA-16) passaram. Isso não é uma reinterpretação dos critérios de aceitação — é a mesma verificação, feita por script em vez de cliques manuais, porque não havia outra forma de executá-la neste ambiente.

2. **Task 16 — não realizada.** Instalação do PWA (CA-17) e uso offline (CA-18) exigem um navegador real com interface gráfica (para o prompt de instalação e para alternar a rede no DevTools), o que não está disponível neste ambiente de execução (sem navegador, sem display). Não foi possível testar esses dois critérios de aceitação. Como alternativa parcial, foram feitas verificações estáticas: `manifest.webmanifest` é JSON válido e aponta para os ícones existentes (`icon-192.png`, `icon-512.png`, ambos gerados e presentes no diretório), e `sw.js` tem sintaxe válida (`node --check`), registra cache versionado (`src-cache-v1`), pré-armazena os arquivos essenciais no `install`, e limpa caches antigos no `activate`. A tarefa permanece com o checkbox desmarcado porque o que o Spec pede — testar de fato num navegador — não foi feito; recomenda-se que a usuária faça esse teste manual num celular/navegador real antes de publicar.
