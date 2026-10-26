# Hub de módulos e entrada no treino — E1

A Home é o ponto de entrada dos quatro módulos: Academia (`/training`), Calistenia (`/calisthenics`), Saúde pélvica / Kegel (`/pelvic`) e Alimentação (`/nutrition`). Links auxiliares levam a `/routine` e `/assistant`. As rotas devem ser conectadas em App.tsx pela integração.

`Training` exporta componente padrão com `mode: 'gym' | 'home'` (default gym). Academia reaproveita plano, sequência, seleção de dia, recorde e semana. Calistenia tem uma única área principal: o ciclo de casa e seus exercícios, sem card de academia concorrente. Ambas as áreas compartilham a meta semanal; saúde pélvica e alimentação não são contabilizadas como treinos.

A sessão ativa sempre tem prioridade e exibe sua origem verdadeira, mesmo ao abrir outro módulo. O resumo usa os exercícios da sessão, incluindo substituições. `startTraining(mode, dayId?)` consulta o store no momento do clique antes de iniciar: retorna `resumable` ou `expired` quando já existe sessão; não modifica exercício atual, séries ou descanso. Esse guard também protege a seleção de dia já aberta quando o estado muda.

Sessão antiga oferece continuar, salvar como parcial ou voltar. Não exige descarte. Salvar parcial usa o comportamento atual do store: sessão sem séries não gera treino fictício. Nova origem/dia só pode ser iniciada depois de resolver a sessão existente. Instalação PWA permanece na Home com lazy/Suspense, permitindo renderização de conteúdo sem depender da inicialização do plugin PWA.

## Evidência TDD

Jornadas: acessar quatro módulos; manter academia e casa em áreas próprias; retomar sessão de outra origem sem perda; impedir substituição mesmo escolhendo outro dia; respeitar expiração sem descarte obrigatório.

- `npx --yes tsx scripts/test-session-modules.tsx` RED: módulo sessionModules ausente (nova implementação); checkpoint afb628e. O primeiro ensaio esbarrou no import virtual PWA e não foi contado como RED; o teste foi ajustado para importar o novo módulo antes da Home.
- Mesmo comando GREEN: quatro links, modos separados e sessão/índice preservados. RenderToStaticMarkup com fixture do snapshot inicial Zustand, sem substituir seletores. Asserts verificam rotas dos quatro módulos e auxiliares, gate de contrações, plano de academia, ciclo Casa A, ausência de seleção de plano na calistenia, retomada e expiração.
- `npx --yes tsx scripts/test-pelvic-store.ts` GREEN após exportar validador público puro `validatePelvicData` para backup agregado; teste garante que validar não muta payload de entrada.
- `npx --yes tsx scripts/test-calisthenics.ts`: 11 PASS / 1 FAIL na compatibilidade de importCloudData para gymPlan (mudanças de integração fora destes arquivos). Falha comunicada ao responsável pela integração; não atribuída ao hub.
- `npm run build` e `git diff --check`: validação de integração executada.

Browser QA das rotas, aparência móvel e cliques reais fica com a integração. Não foi medido percentual de cobertura. A revisão profissional de Kegel continua pendente; a Home informa respiração disponível e contrações em revisão.
