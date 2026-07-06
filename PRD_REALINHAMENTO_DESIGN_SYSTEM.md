# PRD — Realinhamento do Despertar_BA26 ao Design System "Sistema Ritmo Certo"

**Documento:** requisitos de produto para realinhar o visual do app "Despertar" (`Despertar_BA26`) ao design system oficial da família "Sistema Ritmo Certo", cuja fonte da verdade é o `DESIGN_SYSTEM.md` do projeto `Painel-treino`.
**Status:** aguardando aprovação. Nenhum código será escrito antes do "ok".
**Data:** 05/07/2026.

---

## 1. Objetivo da melhoria

Hoje o `Despertar_BA26` tem uma paleta de cores e uma tipografia próprias, criadas antes de existir um design system unificado para a família de apps da usuária. O `Painel-treino` já formalizou esse design system no arquivo `DESIGN_SYSTEM.md` (paleta Grafite/Giz/Pista + cores de zona Z1–Z5, tipografia Bebas Neue/Inter/IBM Plex Mono, e o componente "Régua de Zona").

O objetivo desta melhoria é **realinhar apenas o visual** do `Despertar_BA26` a essa fonte da verdade, em quatro frentes:

1. Trocar a paleta de fundo/destaque hoje própria (`#050D15` fundo escuro-azulado, `#22D3EE` azul, `#FB923C` laranja, `#FFD43B` amarelo) pela paleta oficial: **Grafite** (`#14171b`) como fundo e **Pista** (`#d6482e`) como cor de marca/destaque.
2. Realinhar a função que escolhe a cor de cada treino conforme o texto de `tipo`, para que ela use exatamente as sete cores oficiais de zona/força/descanso (Z1 a Z5, Força, Off) em vez da lógica de cores atual (que usa roxo, ciano, laranja e vermelho com critérios diferentes dos da família).
3. Trocar as fontes do sistema (hoje fontes padrão do sistema operacional) pelas três fontes oficiais — Bebas Neue, Inter, IBM Plex Mono —, hospedadas localmente como arquivos `.woff2`, já que o app é offline e não tem etapa de build/empacotador.
4. Adicionar a **Régua de Zona**, o componente mais distintivo do design system, mostrando onde o esforço do treino em destaque cai no espectro Z1→Z5.

**O que NÃO muda nesta melhoria:** a lógica de negócio do app (leitura do CSV, cálculo do horário de despertar, persistência em `localStorage`, comportamento das abas "Esta Semana"/"Ciclo Completo", nome "Sistema Ritmo Certo"). Esta é uma melhoria **puramente visual**.

---

## 2. Relação com o design system e com os apps existentes

- **Fonte da verdade:** `Painel-treino/DESIGN_SYSTEM.md` — documento neutro de tecnologia, escrito justamente para ser reproduzível em HTML/CSS puro (o caso do `Despertar_BA26`). Esta melhoria segue os valores de cor, as regras de tipografia (seção 2) e o esqueleto de Régua de Zona (seção 3.1) descritos ali, sem reinterpretá-los.
- **Padrão de mapeamento de zona a reaproveitar:** o `Painel-treino` já resolveu, em `src/lib/estiloTreino.js`, a lógica de "a partir do texto de `tipo`, qual é a cor/zona do treino". A lógica de lá (normalizar o texto removendo acentos e caixa; tratar `OFF` no início como descanso; procurar um dígito de zona no padrão "Z" seguido de 1 a 5; tratar `VO2` como Z5; tratar `FORCA` como força; tratar `ENDURANCE` como uma faixa entre Z2 e Z4; qualquer outro texto cai num valor neutro dourado, o mesmo tom de Z3) é o padrão que a função equivalente do `Despertar_BA26` (hoje chamada `sc`, no `index.html`) deve passar a seguir, adaptada ao mesmo vocabulário de `tipo` que já vem do `dados_do_ciclo.csv` (documentado no `PRD_APP_DESPERTAR_CSV.md`).
- **Vocabulário de dados inalterado:** o CSV, o parser, o cálculo do horário de despertar (`wt`) e todo o fluxo de carregar/atualizar ciclo (documentados em `PRD_APP_DESPERTAR_CSV.md` e `SPEC_APP_DESPERTAR_CSV.md`) continuam exatamente como estão. Esta melhoria troca apenas **como as cores e fontes são aplicadas**, nunca **o que é calculado ou exibido como dado**.
- **Contexto mais amplo:** o `CONTEXTO_UNIFICACAO_DESIGN.md` (na raiz deste mesmo repositório) registra que a unificação visual da família de apps ainda tem perguntas em aberto (tema claro/escuro, migração de stack, nome de cada app, escopo da Régua de Zona em cada app). Este PRD **não resolve todas essas perguntas** — ele cobre apenas os quatro itens explicitamente pedidos para o `Despertar_BA26` nesta rodada (paleta, mapeamento de zona, tipografia, Régua de Zona). As demais perguntas do contexto seguem em aberto para uma iniciativa futura.

---

## 3. Arquivos afetados

| Arquivo | Situação | O que acontece |
|---|---|---|
| `index.html` | existente | Bloco `<style>` reescrito com os novos tokens de cor (Grafite/Pista/zonas) e as regras de `@font-face` para as três fontes locais. A função de cor por tipo de treino (`sc`) é reescrita para seguir a lógica de zona oficial. É adicionado o HTML/CSS da Régua de Zona no bloco do "hero". A meta tag `theme-color` no `<head>` passa a usar a cor Grafite. |
| `manifest.webmanifest` | existente | `background_color` e `theme_color` trocam de `#050D15` para a cor Grafite oficial (`#14171b`), para a barra do sistema/splash screen do PWA instalado condizer com o novo fundo. |
| `sw.js` | existente | A lista de arquivos pré-cacheados (`ASSETS`) passa a incluir os novos arquivos de fonte `.woff2`. O nome do cache (`CACHE_NAME`) é incrementado (ex.: de `src-cache-v1` para `src-cache-v2`), para que o service worker existente descarte o cache antigo (sem as fontes) e baixe a versão nova — o mecanismo de limpeza de caches antigos já existe no `sw.js` e não precisa ser criado, só acionado pela troca de nome. |
| Arquivos de fonte `.woff2` (Bebas Neue, Inter, IBM Plex Mono) | **novos** | Arquivos binários de fonte, baixados uma única vez (mesmos pacotes/pesos usados pelo `Painel-treino` via `@fontsource`) e guardados numa pasta local do projeto (ex.: `fonts/`), para servir via `@font-face` sem depender de nenhuma rede externa (nem Google Fonts, nem CDN). |

Nada em `icon-192.png`, `icon-512.png`, no formato do CSV, no parser, no cálculo de horário de despertar ou na estrutura de dados salva em `localStorage` é alterado por esta melhoria.

---

## 4. O que será adicionado

1. **Tokens de cor oficiais** (variáveis de cor, no mesmo espírito das variáveis CSS documentadas no `DESIGN_SYSTEM.md`): Grafite (fundo), Grafite soft (fundo de cartões/superfícies elevadas — hero, linhas de dia, corpo do acordeão), Grafite line (bordas/divisores), Pista (cor de marca e destaque), Pista dark (estado pressionado, se aplicável a botões), e as sete cores de zona/força/descanso (Z1 a Z5, Força, Off).
2. **Nova lógica de cor por tipo de treino**, substituindo a função `sc()` atual, seguindo o mesmo padrão de reconhecimento de texto já validado no `Painel-treino` (`estiloTreino.js`): descanso (`OFF...`) na cor Off; zona explícita (`Z1`…`Z5` no texto do tipo) na cor daquela zona; `VO2` tratado como Z5; treino com força (`FORCA`/"força") na cor Força; `Endurance` tratado como uma faixa contínua entre Z2 e Z4 (cor de destaque dourada, a mesma de Z3); qualquer texto que não se encaixe em nenhuma regra cai no tom neutro (dourado, igual ao de Z3) — nunca fica sem cor.
3. **Cor específica para dia de prova**: os dias marcados como prova (hoje destacados em amarelo) passam a usar a cor Pista, reservada no design system para estados de destaque/marca — mantendo a prova visualmente distinta de qualquer zona de esforço.
4. **Três fontes oficiais carregadas localmente** via `@font-face`, nos mesmos pesos usados pelo `Painel-treino` (Bebas Neue peso 400; Inter pesos 400/500/600/700; IBM Plex Mono pesos 400/500), aplicadas nos mesmos papéis descritos no `DESIGN_SYSTEM.md`: Bebas Neue no nome do app e no tipo do treino em destaque; Inter no texto corrido; IBM Plex Mono nos rótulos, datas, badges e números (horário de despertar, duração, RPE, "faltam X d").
5. **Pilha de fallback de fonte**, ativada automaticamente pelo navegador caso um arquivo `.woff2` não carregue: fontes de sistema (`sans-serif` para título/texto corrido, `ui-monospace, monospace` para rótulos), exatamente como recomendado no `DESIGN_SYSTEM.md` — o app nunca fica com texto invisível ou quebrado por causa de fonte.
6. **Régua de Zona** no bloco de destaque ("hero") do próximo treino: uma faixa de 5 segmentos coloridos (Z1 a Z5, na ordem azul→verde→dourado→laranja→vermelho), aparecendo logo abaixo do tipo de treino em destaque, com o(s) segmento(s) correspondente(s) ao treino do dia em opacidade cheia e os demais atenuados (~22% de opacidade), na versão compacta (sem rótulos "Z1..Z5" escritos, dado o espaço reduzido do cartão de hero num app mobile). A Régua não aparece quando o treino em destaque é de descanso, de força pura, ou de prova (situações sem uma posição de zona fisiológica única).
7. **Atualização da cor de tema do PWA** (`theme-color` no HTML e `theme_color`/`background_color` no manifesto) para a cor Grafite oficial, mantendo a barra do sistema/splash screen do app instalado consistente com o novo fundo.

---

## 5. O que será removido

- **A paleta de cor própria atual**: fundo `#050D15`, azul `#22D3EE`, laranja `#FB923C`, amarelo `#FFD43B`, e os tons intermediários derivados deles (ex.: `#0B1825`, `#162535`, `#1E4A70`, `#3D6482`, `#94B8D4`, `#F0F8FF`). Todos são substituídos pelos tokens oficiais (Grafite, Pista, cores de zona) ou por tons derivados deles por opacidade, seguindo a lógica de opacidade sobre a cor base descrita no `DESIGN_SYSTEM.md` (texto secundário a 70–80% de opacidade, texto terciário/metadado a 40–50%).
- **A lógica de cor atual da função `sc()`**: os critérios hoje usados (`Endurance` → roxo `#C084FC`; `Z5` → vermelho `#FF4D6D`; `Z4`/`Z3-Z4`/`Fartlek`/`Z5-Z4` → laranja `#FB923C`; `Z2`/`Z3` → ciano `#22D3EE`; prova → amarelo `#FFD43B`; default → cinza `#64748B`) são substituídos pela lógica de zona oficial descrita na seção 4.2.
- **A dependência de fontes do sistema operacional** (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` para o texto geral, e `'Courier New', monospace` para os números/horários) como fontes primárias — passam a ser apenas o *fallback* caso a fonte oficial não carregue, nunca mais a fonte principal usada quando tudo funciona normalmente.

---

## 6. O que NÃO será tocado

1. **A leitura do CSV, o parser e a persistência em `localStorage`** — nenhuma linha da lógica de `parseCSVText`, `buildRecords`, `parseCiclo`, `salvarCiclo`, `carregarCicloSalvo` muda.
2. **O cálculo do horário de despertar (`wt`)** — a fórmula (hora de término − duração do treino − 40 minutos fixos de preparo) permanece exatamente como está, documentada e validada no `PRD_APP_DESPERTAR_CSV.md`.
3. **O comportamento funcional das abas** "Esta Semana" e "Ciclo Completo", o destaque do dia atual, o esmaecimento de dias passados, o acordeão por semana, a marcação de prova, a contagem regressiva "faltam X d", o fluxo de carregar/atualizar ciclo e o formulário de hora de término/nome do evento.
4. **O layout estrutural das telas** (quais blocos existem, em que ordem aparecem, o que cada aba mostra) — esta melhoria troca cores, fontes e adiciona a Régua de Zona, mas não redesenha a disposição dos elementos, não introduz tema claro/escuro alternável, não redesenha o cartão de treino no padrão completo do `Painel-treino` (barra lateral de 4px, chips com anel, nota de força destacada, etc.) e não altera o cabeçalho `sticky`/com desfoque.
5. **O nome do app** ("Sistema Ritmo Certo"), o `manifest.webmanifest` (exceto as cores, ver seção 4.7), os ícones (`icon-192.png`, `icon-512.png`) e a estratégia geral de cache do service worker (apenas a lista de arquivos e o número da versão do cache mudam, não a lógica de instalar/ativar/responder).
6. **A stack do projeto**: continua HTML/CSS/JS puro, sem framework, sem build, com HTML/CSS/JS unificado no `index.html` (as fontes `.woff2` entram como arquivos binários à parte, da mesma forma que os ícones já existem como arquivos à parte hoje).
7. **Os demais três apps da família** (`Painel-treino`, `Gerador-de-Planilhas`, `Ciclo-Inteligente`) — esta melhoria cobre exclusivamente o `Despertar_BA26`.

---

## 7. Premissas assumidas

1. O app permanece **apenas em modo escuro** (não introduz alternância de tema claro/escuro). O `DESIGN_SYSTEM.md` define os dois temas, mas o `Despertar_BA26` hoje só tem um tema fixo; esta melhoria troca os valores desse único tema pelos tokens oficiais do **modo escuro** (fundo Grafite, texto Giz, cartões Grafite soft), sem adicionar um botão de alternância. Isso pode ser revisitado numa iniciativa futura.
2. A Régua de Zona aparece **apenas no bloco de destaque (hero)** do próximo treino, na versão compacta (sem os rótulos "Z1..Z5" escritos por extenso abaixo da faixa) — não é replicada em cada linha da lista "Esta Semana" nem em cada item do acordeão "Ciclo Completo", para não sobrecarregar visualmente listas com vários dias por tela. Caso a usuária queira a Régua também nas listas, isso pode ser tratado como um ajuste de escopo na Spec ou numa iteração futura.
3. A cor de dia de prova passa a ser a cor Pista (`#d6482e`), por não haver um "amarelo" na paleta oficial e por Pista ser a cor reservada a destaques/estados especiais no design system.
4. Tratamento de `Endurance` como faixa Z2–Z4 (cor de referência dourada) segue exatamente a mesma regra já usada em `Painel-treino/src/lib/estiloTreino.js`, para manter as duas aplicações consistentes entre si quando exibirem o mesmo tipo de treino vindo do mesmo CSV.
5. Os arquivos de fonte `.woff2` a hospedar localmente são os mesmos pacotes e pesos que o `Painel-treino` já usa via `@fontsource` (Bebas Neue 400; Inter 400/500/600/700; IBM Plex Mono 400/500), no subset `latin` (cobre os acentos do português).
6. O ícone do app (`icon-192.png`/`icon-512.png`) **não muda de cor ou desenho** nesta melhoria — só o `theme_color`/`background_color` do manifesto (a cor de fundo ao redor do ícone/splash) é realinhada.
7. Botões, badges e outros elementos que hoje usam laranja/amarelo/ciano como cor de ação (ex.: botão "Carregar/Atualizar ciclo", badge de "Hoje") passam a usar a cor Pista como cor de ação/destaque padrão, no lugar das cores atuais — mantendo um único acento de marca em vez de múltiplas cores de destaque concorrendo entre si.
8. Nenhuma nova coluna do CSV é lida por causa desta melhoria; o mapeamento de zona continua se apoiando apenas no texto já existente na coluna `tipo`.

---

## 8. Riscos identificados

1. **Peso adicional de download na primeira visita.** Os arquivos `.woff2` aumentam o tamanho baixado no primeiro carregamento do app (antes não havia nenhuma fonte customizada). Mitigação: usar apenas os pesos realmente necessários (os mesmos do `Painel-treino`) e deixar o service worker cachear tudo após o primeiro carregamento, para que aberturas seguintes (inclusive offline) não paguem esse custo de novo.
2. **Cache do service worker servindo uma versão sem as fontes novas.** Se o nome do cache (`CACHE_NAME`) não for incrementado ao publicar, usuárias que já tinham o app instalado continuariam vendo a versão antiga (fontes de sistema, cores antigas) até uma limpeza manual de cache. Mitigação: bumping do nome do cache é parte explícita desta melhoria (seção 3), reaproveitando a lógica de limpeza de caches antigos que o `sw.js` já possui.
3. **Falha ao carregar um arquivo de fonte** (arquivo ausente, corrompido, ou caminho relativo errado após publicação no GitHub Pages). Mitigação: a pilha de fallback (`sans-serif`/`ui-monospace, monospace`) garante que o texto continue legível mesmo se uma fonte não carregar — o app não trava nem fica com texto invisível.
4. **Estranhamento visual da usuária com a mudança de mapeamento de cor por tipo de treino.** Um treino que hoje aparece, por exemplo, em roxo (`Endurance`) ou ciano (`Z2`/`Z3`) passará a aparecer em outra cor (dourado para Endurance, azul/verde para Z1/Z2, etc.), pois os critérios de cor mudam para seguir o padrão oficial de zona. Mitigação: é uma consequência aceita e desejada desta melhoria (alinhar as cores entre os apps da família), documentada aqui para não ser confundida com um defeito.
5. **Contraste de texto sobre o novo fundo Grafite.** O tom Grafite (`#14171b`) é ligeiramente mais claro que o fundo quase-preto atual (`#050D15`); textos e bordas que hoje usam opacidade/tons calculados sobre o fundo antigo precisam ser recalculados sobre Grafite para manter legibilidade. Mitigação: seguir a lógica de opacidade sobre a cor de texto do tema (não cinzas arbitrários) conforme a seção 4 do `DESIGN_SYSTEM.md`.
6. **Ambiguidade entre "dia de prova" e "treino neutro/Z3"** se a cor de prova escolhida (Pista) não ficar suficientemente distinta visualmente da cor neutra (dourado, tom de Z3) em determinados fundos/estados. Mitigação: Pista (`#d6482e`, vermelho-alaranjado) e a cor neutra Z3 (`#d7a233`, dourado) são tons perceptivelmente diferentes o bastante para não se confundirem lado a lado; validar visualmente na implementação.

---

## 9. Critérios de aceitação

Cada critério descreve um cenário (entrada → resultado esperado), incluindo cenários de erro.

### Paleta de cores

**CA-01 — Fundo e cor de marca trocados.**
Entrada: a usuária abre o app com um ciclo já carregado.
Resultado: o fundo geral do app é a cor Grafite oficial (`#14171b`), não mais o azul-escuro `#050D15` anterior; elementos de destaque/ação (ex.: botão "Atualizar ciclo", badge "Hoje") usam a cor Pista oficial (`#d6482e`) como cor de ação, não mais laranja/ciano/amarelo antigos.

**CA-02 — Cor de fundo de cartões e divisores.**
Entrada: a tela mostra o bloco de destaque (hero), as linhas de dia e o acordeão do ciclo completo.
Resultado: os fundos elevados (hero, linha de dia, corpo do acordeão) usam o tom "Grafite soft" oficial, e as bordas/divisores usam a cor de texto padrão a baixa opacidade, seguindo a lógica de opacidade do design system — nenhum desses elementos permanece com os tons antigos (`#0B1825`, `#162535`, `#1E4A70` etc.).

### Mapeamento de cor por zona

**CA-03 — Cor de zona explícita no tipo do treino.**
Entrada: um treino do CSV tem `tipo` contendo, por exemplo, "Z1", "Z2", "Z3", "Z4" ou "Z5".
Resultado: a cor exibida (badge, barra lateral, texto do tipo) é exatamente a cor oficial daquela zona: Z1 azul `#4d7ea8`, Z2 verde `#3f9e83`, Z3 dourado `#d7a233`, Z4 laranja `#dd7a2c`, Z5 vermelho `#c73a2f`.

**CA-04 — Treino de "Endurance" tratado como faixa Z2–Z4.**
Entrada: um treino com `tipo` contendo "Endurance" (sem número de zona explícito).
Resultado: a cor exibida é o tom neutro/dourado (mesmo de Z3), e a Régua de Zona (quando exibida, ver CA-08) mostra os segmentos Z2, Z3 e Z4 ativos simultaneamente, não apenas um ponto único.

**CA-05 — Treino de VO2máx tratado como Z5.**
Entrada: um treino com `tipo` contendo "VO2" (sem o número da zona escrito).
Resultado: a cor exibida é a cor oficial de Z5 (vermelho `#c73a2f`), e a Régua de Zona ativa apenas o segmento Z5.

**CA-06 — Treino de força.**
Entrada: um treino com `tipo` contendo "força"/"FORCA".
Resultado: a cor exibida é a cor oficial de Força (roxo `#7c5cbf`); a Régua de Zona não é exibida para esse treino (não há posição de zona fisiológica associada à força pura).

**CA-07 — Dia de descanso (OFF).**
Entrada: um dia com `tipo` começando com "OFF" (incluindo variações como "OFF + Estabilidade Core").
Resultado: a cor exibida é a cor oficial de descanso (cinza `#767d87`); a Régua de Zona não é exibida.

**CA-08 — Dia de prova.**
Entrada: um dia marcado como prova (`tipo` ou `treino` contendo "PROVA").
Resultado: o destaque do dia de prova usa a cor Pista (`#d6482e`), distinta de qualquer cor de zona; a Régua de Zona não é exibida nesse dia (prova não tem uma posição de zona única).

**CA-09 — Tipo de treino não reconhecido por nenhuma regra.**
Entrada: um `tipo` com um texto que não contém "OFF", nenhum número de zona, "VO2", "FORCA"/"força" nem "Endurance" (ex.: um texto novo ou digitado de forma inesperada no CSV).
Resultado: o app não quebra e não fica sem cor — aplica a cor neutra (dourado, mesmo tom de Z3), sem marcar nenhuma posição na Régua de Zona, exatamente como o comportamento "default" já documentado no `PRD_APP_DESPERTAR_CSV.md` para tipos não mapeados.

### Régua de Zona

**CA-10 — Régua com ponto único.**
Entrada: o treino em destaque (hero) tem uma zona única e explícita (ex.: "Z4").
Resultado: a Régua de Zona aparece logo abaixo do tipo de treino no hero, com 5 segmentos na ordem Z1→Z5 (azul, verde, dourado, laranja, vermelho); apenas o segmento correspondente a Z4 fica em opacidade cheia, os demais quatro ficam visivelmente atenuados (~22% de opacidade), sem desaparecer.

**CA-11 — Régua com faixa ativa.**
Entrada: o treino em destaque é do tipo "Endurance".
Resultado: a Régua de Zona mostra os segmentos Z2, Z3 e Z4 em opacidade cheia simultaneamente, e os segmentos Z1 e Z5 atenuados.

**CA-12 — Régua ausente em dias sem posição de zona.**
Entrada: o treino em destaque é de descanso, de força pura, ou de prova.
Resultado: a Régua de Zona não é renderizada para esse dia — nenhum espaço vazio ou faixa "zerada" aparece no lugar dela, o layout do hero se ajusta sem deixar um vão visual estranho.

### Tipografia

**CA-13 — Fontes oficiais aplicadas nos papéis corretos.**
Entrada: o app é aberto com as fontes locais disponíveis (primeira visita com internet, ou visitas seguintes com o cache do service worker já preenchido).
Resultado: o nome do app no cabeçalho e o tipo do treino em destaque usam Bebas Neue; o texto corrido (descrições, mensagens de erro/estado vazio) usa Inter; rótulos, badges, datas, horário de despertar, duração e RPE usam IBM Plex Mono — nenhum desses elementos permanece na fonte de sistema (`-apple-system`/`Segoe UI`/`Courier New`) enquanto as fontes oficiais estiverem disponíveis.

**CA-14 — Fallback quando uma fonte não carrega.**
Entrada: por qualquer motivo um arquivo `.woff2` falha ao carregar (ex.: arquivo corrompido, caminho incorreto após publicação).
Resultado: o navegador aplica a pilha de fallback (`sans-serif` para título/texto corrido, `ui-monospace, monospace` para rótulos/números) automaticamente; o texto continua legível, nenhum elemento fica em branco, e o restante do app (dados, cálculo de horário, navegação entre abas) funciona normalmente.

**CA-15 — Fontes disponíveis offline após o primeiro carregamento.**
Entrada: a usuária abriu o app ao menos uma vez com internet (fontes baixadas e cacheadas pelo service worker) e depois abre o app sem internet.
Resultado: as três fontes oficiais aparecem normalmente, carregadas do cache local, sem nenhuma tentativa de acesso à rede — igual ao comportamento offline já garantido para o restante do app.

### PWA / cores de tema

**CA-16 — Cor de tema do PWA instalado.**
Entrada: a usuária instala o app na tela inicial (ou já o tem instalado e abre após a atualização).
Resultado: a barra do sistema/splash screen do app instalado usa a cor Grafite oficial (`#14171b`), refletindo `theme_color`/`background_color` do `manifest.webmanifest` e a meta tag `theme-color` do `index.html` — não mais o azul-escuro `#050D15` anterior.

**CA-17 — Atualização de uma instalação existente.**
Entrada: uma usuária já tinha o app instalado com a versão visual antiga (cores/fontes anteriores) e o service worker antigo em cache.
Resultado: ao reabrir o app com internet disponível, o novo `CACHE_NAME` faz o service worker buscar e cachear os novos arquivos (incluindo as fontes), e a versão antiga do cache é removida — a usuária passa a ver a paleta, tipografia e Régua de Zona novas sem precisar desinstalar/reinstalar o app manualmente.

---

## 10. Fora de escopo (nesta melhoria)

- Introduzir tema claro/escuro alternável no `Despertar_BA26` (o app permanece só no tema escuro, ver premissa 1).
- Redesenhar o cartão de treino no padrão completo do `Painel-treino` (barra lateral de 4px, chips com anel, nota de força destacada, cabeçalho `sticky` com desfoque, botão de alternar tema).
- Adicionar a Régua de Zona às listas "Esta Semana" e "Ciclo Completo" (só o hero, ver premissa 2) — pode ser avaliado depois.
- Migrar o `Despertar_BA26` para a stack React/Vite/Tailwind do `Painel-treino`.
- Redesenhar os ícones do app (`icon-192.png`/`icon-512.png`).
- Qualquer mudança nos outros três apps da família (`Painel-treino`, `Gerador-de-Planilhas`, `Ciclo-Inteligente`).
- Qualquer alteração na lógica de dados, no cálculo de horário de despertar, no parser de CSV ou na persistência local.

---

*Aguardando aprovação deste PRD antes de qualquer implementação.*
