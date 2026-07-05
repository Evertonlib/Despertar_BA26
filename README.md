# Sistema Ritmo Certo (Despertar)

PWA de arquivo único (`index.html`) que calcula o horário de despertar para o treino de corrida a partir de um CSV de ciclo de treino, sem backend. Roda offline após o primeiro carregamento e é instalável na tela inicial do celular.

## Como funciona

1. Na primeira abertura, o app pede o CSV do ciclo de treino (o mesmo arquivo usado pelo app irmão [`Painel-treino`](../Painel-treino)).
2. Ao carregar o CSV, é pedida uma única vez a **hora de término desejada do treino** e, opcionalmente, o **nome do evento/prova** — esses dados ficam salvos junto com o ciclo.
3. O horário de despertar é calculado subtraindo do horário de término: a duração do treino do dia + 40 minutos fixos de preparo.
4. O app mostra:
   - **Hero** com o próximo treino relevante (amanhã, ou o próximo dia que não seja OFF) e o horário de despertar em destaque.
   - Aba **Esta Semana**: dias da semana atual com tipo de treino, duração, RPE e horário de despertar.
   - Aba **Ciclo Completo**: todas as semanas do ciclo, em acordeão, com a semana atual expandida por padrão.
   - Contagem regressiva ("faltam X dias") até a data-alvo (a última prova do ciclo, ou o último dia se não houver prova).
5. Tudo é persistido em `localStorage` (`srcCiclo`), então o app reabre direto no conteúdo. O botão "Atualizar ciclo" permite recarregar um novo CSV a qualquer momento.

### Formato esperado do CSV

Colunas obrigatórias: `data` (formato `dd/mm/aa`), `dia`, `tipo`, `tempo` (minutos). Colunas opcionais reconhecidas: `treino`, `rpe`.

- Linhas com `data` inválida são descartadas silenciosamente.
- `tipo` começando com `OFF` é tratado como dia de descanso (sem cálculo de despertar).
- `tipo` contendo a palavra `PROVA` marca o dia como prova (usa emoji 🏁 no lugar do horário e define a data-alvo da contagem regressiva).
- A cor de destaque de cada treino é derivada do texto de `tipo` (`Endurance`, `Z5`, `Z4`/`Fartlek`, `Z2`/`Z3`, ou neutro).
- O número da semana é derivado automaticamente a partir da primeira data válida do ciclo (blocos de 7 dias).

## Stack

- HTML + CSS + JavaScript puro, sem framework e sem build step — um único `index.html`.
- Parser de CSV próprio, tolerante a aspas, embutido no script.
- PWA via `manifest.webmanifest` + `sw.js` (service worker com cache estático simples, sem dependência de Workbox).

## Estrutura do projeto

```
index.html                     # HTML + CSS + JS (parser de CSV, cálculo de despertar, renderização)
manifest.webmanifest           # Nome, ícones e cor de tema do PWA
sw.js                          # Service worker (cache dos assets essenciais para uso offline)
icon-192.png / icon-512.png    # Ícones do app
```

Documentação de produto: [`PRD_APP_DESPERTAR_CSV.md`](PRD_APP_DESPERTAR_CSV.md) e [`SPEC_APP_DESPERTAR_CSV.md`](SPEC_APP_DESPERTAR_CSV.md).

## Rodando localmente

Não há dependências nem build. Basta servir a pasta com qualquer servidor estático (o service worker exige `http://` ou `https://`, não funciona em `file://`), por exemplo:

```bash
npx serve .
```

## Deploy

Publicado como site estático no GitHub Pages diretamente a partir da raiz do repositório — não há passo de build.
