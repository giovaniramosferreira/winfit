# Backlog auditado — 2026-09-09

Revisão do código local contra `PRODUCT_SPEC.md`, especialmente seções 22, 23, 30 e 31. Não é validação de produção, métricas ou relógio físico.

## Implementado

- Onboarding, preview explicável, geração por perfil e restrições, orçamento de tempo.
- Player, edição/exclusão de séries, substituição, descanso persistido, retomada, avaliação de esforço.
- Progressão de carga, PR de carga, frequência, gráfico de carga por exercício e lista de sessões.
- PWA, exportação JSON e limpeza dos dados locais.
- Relay e comandos do Apple Watch (não equivale a Apple Health/Health Connect).
- **Nesta mudança:** seção de treino em casa sem equipamentos, com prévia e histórico, preservando plano e sequência da academia.

## Ordem recomendada para o uso pessoal

| Prioridade | Pendência | Evidência no código / critério de entrega |
|---|---|---|
| 1 | Evolução de peso corporal por reps/tempo | `ExerciseDetail.tsx` só desenha carga > 0; `checkPR` ignora peso 0. Mostrar evolução de reps e segundos com unidades corretas e testes sem misturar séries temporizadas com repetições. |
| 2 | Restaurar backup | `Profile.tsx` oferece exportação, mas não importação. Validar arquivo/versão e restaurar com prévia; o export atual também omite sessão em andamento. É lacuna operacional, não item explicitamente exigido como importação pela spec. |
| 3 | Retorno após pausa e faltas (R2) | Home gira pelo último dia executado, mas não oferece replanejamento após 10 dias, pausa declarada ou rampa de retorno baseada no histórico. Rampa atual depende do onboarding. |
| 4 | Registro de desconforto (R3) | Existe filtro de limitações do perfil e troca/pulo, sem motivo de desconforto ou histórico por região. |
| 5 | Detalhe acessível pelo histórico | `Progress.tsx` lista sessões sem abrir seus detalhes; resumo pós-treino não reproduz todas as séries. |
| 6 | R6 completo: adaptar o dia ao ambiente | A seção de casa é um ciclo adicional. Ainda falta conversão do treino do dia por equivalências e alternância com equipamentos domésticos/viagem. |

## Lacunas para o MVP comercial da especificação

| Item da spec | Estado real |
|---|---|
| Catálogo ~250 com mídia | 74 exercícios textuais; sem vídeos/animações. |
| RevenueCat, trial e paywall | Ausentes. README adia para fase 2. |
| Push de treino, resumo e retorno | Ausentes; avisos de PWA não são CRM/push de treino. |
| Analytics e crash reporting | Sem instrumentação PostHog/Sentry ou equivalente identificada. |
| Conta, autenticação e sync | Ausentes; dados em armazenamento local. README adia para fase 2. |
| Privacidade e exclusão de conta | Exportação e limpeza locais existem; não há tela de política ou conta/backend. |
| Mapa muscular, peso corporal histórico, resumo com insight | Ausentes. Biometrics no perfil não é histórico de medidas. |
| QA de lançamento | Scripts de gerador e Watch existem; não há evidência no repo de gates de beta, métricas de crash ou suíte completa de interrupções em dispositivos. |

O README descreve um MVP web reduzido, enquanto a seção 30 da spec exige monetização, CRM e instrumentação no v1.0. Não tratar o documento inteiro como funcionalidades já entregues. Para uso pessoal, priorizar treino e integridade do histórico; para lançar comercialmente, revisar o recorte antes de implementar billing.

## Evoluções futuras previstas, ainda ausentes

Edição fina do plano, medidas/fotos, platô e deload, compartilhamento/indicação, Health/Health Connect. Permanecem nas fases futuras da spec; não são requisitos desta seção de home office.
