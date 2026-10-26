# Rotina, histórico e assistente local — 26/10/2026

## Rotas e integração

- `SessionDetail`: `/session/:id`; lê a sessão finalizada pelo ID, não o plano atual. Exibe séries com kg/reps/segundos, pulo e substituição; logs legados sem vínculo continuam visíveis com aviso.
- `Routine`: `/routine`; agenda por dias, hora e fuso IANA, checklist por academia/casa/viagem, pausa 7 dias, adiamento 30 minutos e desativação. Check-in opt-in com energia e observação, frequência, horário de silêncio e exclusão.
- `Assistant`: `/assistant`; explicações locais declaradas, contexto opt-in editável e sem envio externo. IA remota indisponível até haver backend autenticado. `AuthenticatedAssistantAdapter` documenta contrato futuro; não chama endpoints nem aceita chave de provedor no cliente.

`routineStore.ts` usa `winfit-routine-v1`; `exportRoutineData()`, `importRoutineData(unknown): boolean` e `resetRoutineData()` são os pontos para o backup/restauração/limpeza global. A importação é validada. O módulo não envia dados remotamente. O contexto do assistente permanece apenas na tela e é apagado ao desativar a opção.

## Limites explícitos

Avisos aparecem na tela Rotina enquanto aberta; não são push e não prometem execução em background. Um aviso por data local coordena treino/check-in e evita duplicação. Caso os horários sejam diferentes, dispensar o primeiro aviso dispensa os demais daquele dia; check-in manual continua disponível. Horário de silêncio afeta somente o convite de check-in. Um navegador fechado exige calendário externo: `.ics` exporta recorrência e alarme. Alterações posteriores exigem atualizar/remover o evento no calendário externo. O app não controla permissão/entrega do calendário.

Adaptação é uma prévia por regras: remove opcionais quando o tempo pedido é menor, preserva obrigatórios e não promete cumprir o tempo informado. Trocas buscam mesmo grupo/slot, sem aumentar habilidade, com mesma unidade temporal e respeitando limitações/equipamentos. Peso corporal sozinho exclui movimentos com apoio. Sem equivalente, aplicação é bloqueada e o item é explicado. Aplicação muda apenas o dia do plano futuro, mantém sessão ativa/séries/descanso intactos e rejeita prévia se o plano mudou.

Não foi implementada prescrição clínica, análise de sintomas, adaptação automática de carga por check-in, chatbot remoto ou push de servidor.

## Verificação

TDD: testes adicionados e executados com falha `ERR_MODULE_NOT_FOUND` para os três módulos antes da implementação (commit `e100029`). Após implementação: `npx tsx scripts/test-routine.ts`, `npx tsx scripts/test-session-history.ts`, `npx tsx scripts/test-assistant-context.ts`. Cobrem fuso, silêncio cruzando meia-noite, deduplicação, pausa/adiamento, validação, histórico temporal/legado e adaptação imutável. Build TypeScript/Vite passou. Cobertura percentual e validação em aparelho físico não foram medidas; requer integração de rotas e QA móvel antes de afirmar conclusão do fluxo.
