# Winfit — execução do backlog em 26/10/2026

Fonte: todas as 20 issues abertas e o plano de execução do [projeto no Linear](https://linear.app/poup/project/winfit-797395e7ef1f), consultados nesta sessão. Base main `817a03f`. Este lote depende da PR #3 (ajuste fino de séries), ainda aberta; revisão da integração deve considerar essa dependência. Nenhuma issue foi marcada como concluída e nenhuma alteração de status foi feita no Linear.

## Produto, arquitetura e plano

Manter React/TypeScript/Vite/Zustand, tema atual e hash routes. Academia e Calistenia reutilizam treino existente; saúde pélvica, nutrição e rotina possuem persistência e métricas próprias. Canal inicial continua sendo o próprio app, conforme decisão registrada no projeto em 20/10. Não há WhatsApp, fornecedor de IA ou serviço pago contratado por este trabalho.

Sequência executada: recuperar critérios → testes e módulos independentes → proteção de backup/sincronização/consentimento → integração de rotas e dados → revisão independente → QA de navegador. Os artefatos descritos como locais no Linear não foram encontrados na árvore/histórico consultados; a implementação foi feita sobre o código disponível, sem tratar o estado In Review como prova de entrega.

## Matriz de entrega verificável

| Issue | Implementação neste lote | Evidência e limite |
| --- | --- | --- |
| AURAVIZ-62 | Canal inicial documentado como app; calendário opcional por arquivo | Decisão já registrada no projeto. Nenhuma integração WhatsApp |
| AURAVIZ-63 | Mapa de dados/consentimentos, export/reset, revisão de envio, exclusão do backup remoto | `privacy-data-map.md`; contratos de retenção de futuros fornecedores continuam pendentes |
| AURAVIZ-64 | Login preserva treino local; revisão antes de enviar; merge por IDs; CAS impede sobrescrever cloud alterada; originais recuperáveis | Testes backup/application-backup/cloud-sync + 10 cenários browser com backend simulado. Não substitui teste Supabase real |
| AURAVIZ-65 | Entrada existente reaproveitada e verificada; restauração remota sem onboarding; erro/login/offline distintos | Browser com autoridade simulada. Configuração real de auth não alterada |
| AURAVIZ-66 | Watch off por padrão, destino informado, ativação/revogação e propagação entre abas | Teste privacy + inspeção de tráfego interceptado; zero envio antes de ativar. Sem teste relógio físico |
| AURAVIZ-67 | Agenda/dias/horário/fuso, checklist por local, pausa/adiamento/desligar, arquivo .ics | Testes de fuso, calendário e browser. Avisos internos só com tela aberta; não há push em background contratado |
| AURAVIZ-68 / E1 | Hub com quatro módulos; Academia/Calistenia dedicadas e retomada protegida | SSR + browser390/320; origem, índice, séries e descanso preservados |
| AURAVIZ-69 | Ajuste fino/digitação exata da PR3 + desfazer última série incluindo descanso e pulo anterior | Number dial/browser e undo-set; edição não duplica histórico |
| AURAVIZ-70 | Gráficos e métricas kg/reps/segundos por exercício, sem somar unidades; variações separadas | bodyweight-progress, calisthenics e histórico |
| AURAVIZ-71 | Detalhe de sessão a partir do snapshot, séries reais, trocas/pulos e fallback legado | session-history + browser rota /session/:id |
| AURAVIZ-72 | Prévia contextual local editável, fatos limitados a plano/perfil resumido/3 sessões; explicações locais. Transporte/backend autenticado preparado e desativado | assistant-context/assistant-api. **Chat com IA real não está entregue**: fornecedor, rota autenticada, coordenador durável, orçamento e avaliação pendentes |
| AURAVIZ-73 | Adaptação determinística por tempo/equipamento com prévia; estima séries/pausas/transições e bloqueia aplicar se não couber; plano futuro, sem alterar treino ativo | assistant-context + browser. Não depende de modelo de IA nem muda plano automaticamente |
| AURAVIZ-74 | Check-ins opcionais, dias/horário/fuso/silêncio, pausa, deduplicação com lembrete e registro local | routine + browser. Não há mensagem proativa com app fechado |
| AURAVIZ-75 | Diário manual, totais/metas e rascunho de foto local; fallback manual funcional | Initiative permanece parcial: análise remota/álbum privado não ativados |
| AURAVIZ-76 / E5 | Captura explícita, limite/tipo, canvas para remover metadados, cálculo por rótulo com fonte/versão/porção confirmada; pesquisa de licenças atualizada | meal-analysis/nutrition. **Seleção/ingestão de base brasileira e benchmark de visão pendentes**; nenhuma kcal inventada por modelo |
| AURAVIZ-96 / E2 | Conteúdo próprio versionado; respiração geral separada; gate para contrações | **Protocolos de contração continuam indisponíveis até revisão profissional registrada**, exigida pelo próprio aceite. Sem níveis ou doses clínicas inventados |
| AURAVIZ-97 / E3 | Motor de fases, pausa/reload/background, áudio/vibração opcionais e histórico independente | Timer/store/browser; apenas respiração disponível em uso público. Não equivale a validação clínica |
| AURAVIZ-98 / E6 | Factories de análise autenticada, owner/path, schema restrito, consentimento/destino, idempotência/quota por adapter; SQL RLS/bucket privado preparados | Testes sintéticos; **migration, adapters, sanitizador backend, isolamento real e fornecedor ainda não configurados**. Factory retorna503 sem dependências |
| AURAVIZ-99 / E7 | Envelope versionado; export/import com prévia e recuperação; módulos separados; quota/corrupção visíveis sem sobrescrever original | Backup/workout-storage + browser. **Entrega real de nuvem/fotos/IA e aparelhos físicos continuam pendentes** |
| AURAVIZ-100 / E4 | Diário manual por data/horário/tipo, itens/porções/kcal opcionais, edição idempotente, exclusão/restauração e metas por vigência | nutrition e browser; null diferente de zero. Sem desconto de calorias de treino ou afirmação de déficit real |

## Aceites de integração e segurança

- AC-001: navegar entre áreas ou iniciar outro dia durante um treino mantém sessão, séries, índice e prazo de descanso. Evidência: SSR/session-modules, navegação e browser.
- AC-002: export/import inválido não substitui dados; arquivo válido exige prévia e mescla mantendo originais. Quota reverte estado em memória e conserva cópia de recuperação. Evidência: application-backup e sync browser.
- AC-003: dois treinos ativos distintos são preservados: o local continua e o remoto fica parcial no histórico. Sessão já finalizada nunca ressuscita. IDs duplicados inválidos são rejeitados. Evidência: backup.
- AC-004: Watch não envia sem ativação; revogação, inclusive em outra aba, impede novos envios. Mudança de destino exige autorização nova. Evidência: privacy e browser com relay interceptado.
- AC-005: login/autenticação não é confirmação de backup. Envio manual inclui módulos privados somente com checkbox; conta diferente exige confirmação de transferência; PATCH/DELETE usam comparação atômica de updated_at. Evidência: cloud-sync + sync browser.
- AC-006: corrupção de storage conserva o original e impede sobrescrita; treinos novos só em memória podem ser exportados separadamente. Redefinição exige backup e confirmação. Evidência: workout-storage e revisão.

## Validação consolidada

- `npm test`: 22/22 suítes passaram; inclui 56.000 combinações do gerador.
- Browser local: 25 checks de módulos/layout e 10 cenários de sincronização simulada, zero pageerrors. Relatórios: `docs/qa/backlog-mobile.md`, `docs/qa/sync-browser.md`.
- Teste de rodinha com toque CDP, captura, teclado, entrada7.25, registro/edição e prancha41s passou.
- `npm run build` e `git diff --check` passaram. TypeScript dos handlers server verificado separadamente.
- Cobertura dos módulos de nutrição/handlers foi medida pelos testes específicos (>90% linhas transpiladas); cálculo da rodinha100%. Isso **não é cobertura global da UI ou de infraestrutura real**.
- `npm audit --omit=dev`: duas vulnerabilidades moderadas preexistentes em React Router. Auditoria completa também aponta dependências de ferramentas antigas; atualização de framework/stack não foi misturada a esta entrega.
- Revisão independente encontrou e corrigiu conflito ativo remoto, ressurreição de concluído, rollback de quota, falso sucesso pélvico, transferência de conta, perda de rotina remota, logout concorrente, revogação persistida/entre abas e IDs duplicados.

## Pendências que exigem evidência externa

1. Revisão profissional do conteúdo e critérios de progressão Kegel antes de liberar contrações.
2. Escolha de provedor/base, licença, orçamento/retensão e benchmark autorizado para foto/chat; nenhuma chamada paga foi feita.
3. Configurar e testar infraestrutura autenticada real: Supabase/RLS/bucket privado, coordenador durável, sanitizador de imagens e rotas dos handlers. SQL está preparado, não aplicado.
4. Safari/iPhone/Watch físicos, leitor de tela, push real e medição de Core Web Vitals.
5. Aprovar/mesclar PRs e só então acompanhar deploy do commit correto. Este documento não declara produção atualizada.

Autoavaliação: precisão4 (testes locais verificáveis; remoto simulado), completude3 (gates externos acima impedem fechar todo backlog), clareza4 (matriz por issue), ação4 (PR e comandos reproduzíveis), concisão4 (módulos separados com documentação de limites). Média3,8/5. Melhoria prioritária: validar a infraestrutura real e a revisão profissional, sem apresentar preparação como entrega concluída.
