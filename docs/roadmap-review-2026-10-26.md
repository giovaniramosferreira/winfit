# Revisão do histórico e roadmap — 26/10/2026

Fonte: histórico Git completo e projeto [Winfit no Linear](https://linear.app/poup/project/winfit-797395e7ef1f), consultados em 26/10/2026.

## Código disponível

A main está em bb21ab8. O histórico passa pelo MVP, PWA, Apple Watch, treino em casa/calistenia, conta, atlas anatômico e retorno ao tema roxo. O último ajuste trata dos controles no viewport móvel.

As entregas de Home de quatro sessões, Kegel e diário alimentar descritas como locais/em revisão no Linear não estão na main clonada. Não foram consideradas entregues nesta revisão.

## Plano aprovado em 20/10

- E1 / AURAVIZ-68: Home com Academia, Calistenia, Kegel e Alimentação — In Review.
- E2 / AURAVIZ-96 e E3 / AURAVIZ-97: conteúdo, relaxamento, player e histórico Kegel — In Review.
- E4 / AURAVIZ-100: diário manual com refeições, calorias e meta opcional — In Review.
- E5 / AURAVIZ-76: foto e base nutricional — Todo.
- E6 / AURAVIZ-98: fotos privadas e análise autenticada — Todo.
- E7 / AURAVIZ-99: integração, migração, sincronização, offline e validação móvel — Todo.

## Backlog preservado

F1: consentimento IA (63), sincronização sem sobrescrever dados (64), entrada na conta (65), Watch opt-in (66) e decisão de canal (62; a direção mais recente prioriza o próprio app).

F2: lembrete/checklist (67), entrada de carga e desfazer série (69), progresso para peso corporal (70), detalhes do histórico (71).

F3: assistente contextual (72) e adaptações por tempo/equipamento (73).

F4: check-ins opcionais (74) e alimentação por foto (75/76).

## Recorte desta alteração

Navegação direta para qualquer exercício pelo seletor do player, com contagem de séries e indicação de exercício pulado. Anterior e Próximo ficam independentes de Encerrar treino. A navegação altera apenas currentIndex, preservando séries e descanso. Índices inválidos são ignorados na store.

Limites: histórico de conversas anteriores não está acessível por ferramenta nesta sessão; dados pessoais de treino não são arquivos do repositório. Nenhuma issue foi marcada como concluída e nenhuma publicação foi realizada.
