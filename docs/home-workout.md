# Treino em casa — 2026-09-09

## Decisão

Adicionar uma seção para home office sem equipamentos na Home. Reutilizar catálogo, gerador, player e histórico, mantendo o plano principal. O ciclo A/B/C de casa avança com sessões salvas, inclusive parciais; sessões descartadas não avançam. Não substitui automaticamente um dia de academia nem implementa toda a regra R6 da especificação.

## Fluxo e arquivos

1. `src/pages/Home.tsx` usa `homeWorkout(profile, plan, seed, sessions)` para mostrar a prévia e duração estimada.
2. `src/lib/homeWorkout.ts` monta um ciclo curado de três sessões completas A/B/C, em vez de reutilizar o gerador de academia com o catálogo reduzido. Cada sessão inclui inferiores, empurrar, cadeia posterior/costas e core; B adiciona unilateralidade e C prioriza estabilidade.
3. O filtro remove máquinas, pesos, elásticos e cinco itens que exigem acessórios/apoio: flexões inclinada e declinada, remada com toalha na porta, flexora deslizante e panturrilha em degrau. Não tratamos porta, sofá ou toalha como equipamento seguro. A puxada prona no solo é uma alternativa sem equipamento para controle escapular/costas, mas a interface deixa claro que ela não equivale a uma puxada com carga; para isso, o usuário precisa de barra ou elástico.
4. `startHomeSession()` da store cria uma sessão com `source: 'home'` e `profileSnapshot`. O `planId` é `<plano principal>:home`; o `dayId` acrescenta a posição do ciclo. Isso preserva a sequência do plano principal e permite identificar o mesmo dia no histórico.
5. `Player.tsx` usa o perfil da sessão nas substituições. Na sessão de casa, filtra acessórios e só oferece troca para hoje. A store também recusa equipamentos e contraindicações incompatíveis.
6. Série, timer, Watch, conclusão, resumo e histórico usam os mecanismos existentes. A janela de retomada continua sendo 8 horas; um novo início não sobrescreve a sessão ativa. Na verificação de encerramento foi corrigido um erro preexistente de ordem de hooks no player: os dois cálculos após o retorno condicional não usam mais `useMemo`.

## Persistência e compatibilidade

`Session.source?: 'home'` e `Session.profileSnapshot?: TrainingProfile` são opcionais. Sessões antigas continuam válidas. Não há mudança de chave nem limpeza de storage. O snapshot é persistido junto com a sessão ativa e mantido na sessão encerrada e exportação do histórico.

Nenhuma nova rota, API, payload de rede ou banco. Os comandos de Watch continuam iguais. O plano gerado para prévia é transitório; apenas a sessão iniciada é salva.

Ao encerrar pelo player, uma referência de encerramento impede o redirect de sessão vazia de disputar a navegação para o resumo enquanto a transição de rota termina.

## Base de prescrição e limites conhecidos

O formato de corpo inteiro é deliberado: uma revisão sistemática com meta-análise não encontrou diferença relevante entre divisão e full body para força/hipertrofia quando o volume é equivalente ([PubMed, 2024](https://pubmed.ncbi.nlm.nih.gov/38595233/)). A ACSM também aponta que exercícios de peso corporal e rotinas em casa trazem benefícios relevantes ([ACSM](https://acsm.org/resistance-training-guidelines-update-2026/)); a OMS recomenda fortalecimento dos grandes grupos musculares em pelo menos dois dias da semana ([WHO](https://www.who.int/tools/your-life-your-health/life-phase/later-adulthood/being-active-in-later-adulthood)). Isso não transforma calistenia sem barra em substituta perfeita de uma academia: puxada carregada continua sendo a limitação material, comunicada no produto.

- Sem progressão visual ou PR de repetições/tempo: gráficos existentes priorizam kg.
- Volume externo de treino sem carga continua sendo 0 kg; séries e frequência são registradas.
- A cobertura muscular depende do catálogo e das limitações: não inventamos equivalentes para padrões indisponíveis, especialmente puxadas sem equipamentos.
- Não há agendamento dos dias de home office; o início é manual.

## Verificação

`scripts/test-home-workout.ts` verifica ausência de equipamentos/apoios e respeito a contraindicações, preservação do plano/perfil, bloqueio de substituição com equipamento, proteção da sessão ativa, reidratação e histórico. A suíte combinatória existente valida o gerador original; a suíte Watch cobre os comandos da store.

Verificação local em navegador: onboarding de academia → prévia de casa → início → série → reload com série e timer preservados → conclusão parcial → resumo. Após as correções do player, o encerramento abriu o resumo sem novos erros de console. Home preservou o dia de academia e contabilizou a sessão de casa.
