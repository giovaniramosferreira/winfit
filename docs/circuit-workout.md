# Circuito por tempo: cardio e core (2026-11-14)

## Origem

Consultoria sobre um circuito de nove exercícios sem equipamento, com 45 s cada e três voltas. A sequência foi mantida. Os nomes, textos e tempos são nossos.

## Decisões

- **Módulo próprio em `/circuit`**, com entrada pela tela de Calistenia. Ele fica fora de `EXERCISES`: o catálogo principal alimenta o gerador por séries e repetições e exige arte em tinta por exercício. Por isso o gerador e a suíte combinatória não mudam.
- **Níveis** mudam só o tempo de trabalho e de descanso. A sequência é a mesma: iniciante 25/20 s, intermediário 35/15 s, avançado 45/15 s. Iniciante usa a versão modificada em todas as estações.
- **Versão modificada única por estação.** A mesma versão cobre o nível iniciante, o baixo impacto (só estações com salto) e as limitações do perfil (`stresses`). Exemplos: polichinelo vira passo lateral, escalador vira joelho ao peito em pé (sem carga nos ombros e sem apoio improvisado), e a prancha com giro vira dead bug.
- **Duração honesta.** 9 × 45 s = 6 min 45 s de trabalho. Uma volta no avançado, com preparo e descanso entre estações, leva cerca de 9 min. Aquecimento (5 × 30 s) e desaquecimento (4 × 30 s) são opcionais e vêm ativados. De 1 a 3 voltas, com 60 s de descanso entre elas.
- **Aviso de saúde** obrigatório antes do primeiro circuito (`healthAckAt`).
- **Cronômetro com âncora absoluta**, no mesmo modelo do módulo pélvico. Ele pausa ao sair da tela ou ir para segundo plano, e o reload restaura a sessão pausada. "Pular etapa" desconta do registro o trabalho não feito. O som e a vibração ficam ativados por padrão, e o áudio é liberado no toque em "Começar". A tela fica acesa via Wake Lock quando o navegador permite.
- **Histórico separado**: tempo de trabalho feito, voltas, nível e se houve baixo impacto. Ele não entra na meta semanal nem nos recordes, porque o modelo `Session` é por série.
- **Progressão**: depois de duas sessões completas seguidas no mesmo ajuste, com ≥ 90% do trabalho feito, o app sugere o próximo nível. No avançado, sugere mais uma volta.

## Persistência

`winfit-circuit-v1` (`src/lib/circuitStore.ts`). As fases são reconstruídas a partir do conteúdo versionado (`src/data/circuits.ts`), não do arquivo. Isso vale na leitura e na importação. Dados ilegíveis são preservados e exportados como estão. O módulo entra no backup de aplicação, na mesclagem com a nuvem (histórico unido por ID), na detecção de alterações para sincronizar e em "Apagar dados".

## Pendências

- Demonstrações ilustradas das nove estações e das versões modificadas.
- Revisão do conteúdo por profissional de educação física antes do lançamento.
- Contar o circuito na meta semanal exige um tipo de sessão por tempo no modelo principal.

## Verificação

`scripts/test-circuit.ts` cobre a sequência, os tempos, as voltas, as versões modificadas, o cronômetro (pausa, relógio para trás, pular), a progressão, a store (aviso, reload, registro, backup forjado, dados ilegíveis, cota e reset). No navegador, a 390 px, verificamos o fluxo perfil com joelho → aviso → versões adaptadas → início → pular → reload pausado → encerrar → histórico, sem erros de console nem rolagem horizontal.
