# WinFit — Plano completo (24/11/2026)

Objetivo do fundador: **jornada o mais fluida possível, com estética "super high-end"**. Este plano junta o que está no Linear, o que o código já entrega, a auditoria da jornada e a comparação com o Befit. Nada aqui altera issues ou código: é a proposta para aprovação.

## 1. Fontes lidas
- **Linear, projeto Winfit:** 4 documentos (Visão Geral 04/11, Plano de execução 20/10, Sprint 05/11 com as decisões de 04/11, Referência Befit de hoje), 5 milestones e as 14 issues abertas na íntegra (62 a 76, 96 a 100, 113), com comentários. Mais as 10 issues criadas hoje (144 a 153).
- **Repositório:** `docs/` inteiro (roadmap 26/10, backlog-execution, meal-analysis, assistant-integration, privacy-data-map, UI review 15/11) e `docs/befit-journey-spec.md` (outra sessão, ainda sem commit).
- **App:** navegação completa com o seu backup real (25 sessões, 302 séries, 15 recordes).
- **Fora de escopo:** os documentos dos projetos Poup Cleaner, Auraviz e Rede social (13 no total) pertencem a outros produtos. Só li os títulos. Digo se quiser que eu leia.

## 2. Onde estamos
| Área | Estado | Evidência |
|---|---|---|
| Home, Treinar, Calistenia, Circuito | pronto | AURAVIZ-68 Done |
| Player (série, anterior, desfazer, substituir com escopo, RPE, parcial) | pronto | 69 Done; auditoria |
| Progresso e detalhe do exercício | pronto | 70, 71 Done |
| Adaptar treino por tempo/equipamento | pronto (regras locais) | 73 Done |
| Diário de alimentação manual e metas | pronto | 100 Done |
| Design system (tokens, claro/escuro real, componentes, painéis) | fases 1 a 3 feitas, 3b e 4 pendentes | 144 a 148, 151 |
| Duração do treino | corrigida (em revisão) | 149 |
| Alimentação por foto | **só PoC local**, sem backend, sem IA remota | 75; Food-101 deu no-go |
| Kegel | só respiração; contração bloqueada por revisão profissional | 96, 97 |
| Lembretes e check-ins | só com o app aberto | 67, 74 |
| Conta, nuvem e sincronização | código pronto, **nunca validado com Supabase real** | 63, 64, 65, 99 |
| Assistente com IA | prévia local; remoto desligado | 72 |
| Publicação | **nada publicado**; branch local sem push; `main` 19 commits atrás | 75 |

**Divergências encontradas**
1. Os status do Linear estão parados em 27/10 (com uma atualização em 05/11). Nenhum deles reflete o design system, a duração, os painéis nem a reconciliação da branch.
2. A direção de 05/11 pede "foto + um toque, sem digitar". O PoC exige revisar alimento, preparo e gramas. Falta redesenhar o fluxo.
3. **Carga com decimais:** o player arredonda para inteiro (`Math.round`, `NumberDial integer`), mas 39 das suas 302 séries têm 17,5, 22,5, 72,5 ou 77,5 kg. Hoje não dá para registrar esses valores. **Não está em nenhuma issue.**
4. Peso no backup (86 kg) difere do informado (90 kg) no Sprint de 05/11. Pendente de confirmação.

## 3. Princípios
- **Estética como requisito:** cada entrega passa pelo design system (tokens, componentes, claro e escuro, 320 e 390 px, movimento reduzido). Nada de cor, raio ou espaço fora da escala.
- **Um toque para o essencial:** abrir, treino do dia, iniciar, concluir série. Medir "toques até a primeira série".
- **Honestidade de dados:** estimativa nunca vira medição; desconhecido não é zero; nada "Done" sem evidência.
- **Sem culpa e sem armadilha:** sem paywall, contagem regressiva, pré-marcar compartilhamento nem sequência punitiva.
- **Privacidade:** foto e dados só saem do aparelho com consentimento claro; segredos só no backend.
- **Um escritor por área:** o Linear registra desenvolvimento paralelo em outro chat. Antes de cada fase, conferir branch e PR.

## 4. Decisões que preciso de você
| # | Decisão | Recomendação |
|---|---|---|
| D1 | Teto de custo da IA de visão (Claude, decidido em 04/11) por usuário/mês | definir um teto antes da Fase 4 |
| D2 | Retenção das fotos originais (você já decidiu guardá-las) | 90 dias, com exclusão a qualquer momento |
| D3 | Metas iniciais 2100 kcal / 180 g P / 200 g C / 64 g G e peso 90 kg (não 86) | confirmar e atualizar a biometria atual sem apagar o histórico |
| D4 | Kegel: quem faz a revisão profissional e o que fazer até lá | manter só respiração; marcar a revisão como bloqueio externo |
| D5 | Lembretes com app fechado | Web Push só em PWA instalada (iOS 16.4+), com backend; senão manter calendário .ics |
| D6 | Identidade visual para "high-end" | manter o roxo e evoluir profundidade, tipografia de destaque e movimento |
| D7 | Itens do Befit de maior escopo (treinos próprios, biblioteca de treinos prontos, câmera de equipamento) | fora do V3; reavaliar depois da Fase 3 |
| D8 | Quando enviar a branch, abrir PR e publicar | PR já na Fase 0; publicar só após a Fase 4 validada |
| D9 | Renomear a chave do time (`AURAVIZ`) | opcional; só afeta tickets novos |

## 5. Fases
Tamanhos relativos (P, M, G, GG), sem datas. Cada item vira issue ao entrar em execução.

### Fase 0 — Base segura (P)
- Commits lógicos e push da branch `codex/winfit-meal-vision-poc`; PR com CI. **Hoje todo o trabalho vive só no disco.**
- Remover o que sobrou do redesenho antigo (`*-usability.css`, `test-wellness-usability.tsx`) e reverter `.claude/launch.json`; descartar `stash@{0}` depois do merge.
- Higiene do Linear: atualizar status e resumo do projeto, o documento central e os milestones; criar o milestone **V3 — Jornada high-end**; registrar a decisão sobre a Befit.
- Aceite: `main` com o trabalho, CI verde, Linear refletindo o código.

### Fase 1 — Confiança dos dados e acabamento base (M)
- **Novo N1: carga com decimais** (passos 0,5 / 1 / 2,5; sem arredondar). Aceite: registrar 17,5 e 22,5; recordes e gráficos corretos; backup antigo intacto.
- 149 (duração) e 151 (painéis) em revisão: validar e fechar.
- 150 (detalhe da sessão), 152 (acessibilidade), 148 (migrar botões, selos e cartões; `WatchModal` para `Sheet`), 147 (revisão visual 320/390 px, claro e escuro).
- Aceite: auditoria automática sem alvo abaixo de 44 px nem texto abaixo de 12 px; nenhum `className="btn` fora de `components/ui`.

### Fase 2 — Treino fluido (G) — ciclo 1 do Befit + 153
- Cabeçalho vivo (duração ativa + volume), descanso com −15 s e por exercício.
- Quiz: valores iniciais, "Pular", selo "Recomendado", cálculo com 3 mensagens específicas.
- Lista do dia com miniatura e carga sugerida (Home e Treinar).
- **Resumo do treino com celebração**: recordes, comparação com o último, "faltam N esta semana", dias da semana, compartilhar.
- Gráficos próprios do design system (rótulos sem colisão, animação de entrada).
- Transições entre telas e entre exercícios (View Transitions), esqueletos de carregamento, vibração opcional, Home com contexto pessoal.
- Aceite: do abrir do app à primeira série em 2 toques; `prefers-reduced-motion` respeitado.

### Fase 3 — Profundidade do treino (G)
- Silhueta anatômica interativa para lesões e foco (reaproveita `BodyPlate`).
- Tipos de série (aquecimento fora do volume e do recorde).
- Adicionar exercício, reordenar, notas por exercício.
- Favoritos e filtro por equipamento; tour e dicas só no primeiro treino; áudio das instruções.
- Perfil: totais e medidas com histórico. Progresso: faixa da semana, ofensiva "sem culpa" (semanas cumpridas) e compartilhar.
- Ilustrações e ícones unificados; modo escuro revisado tela a tela.

### Fase 4 — Alimentação por foto (GG) — prioridade de produto de 04 e 05/11
Depende da Fase 5A (autenticação e backend) para o que sai do aparelho.
1. **Fluxo foto → um toque**: cartão de confirmação com porções rápidas, tocar para corrigir, adicionar ou remover item; sem campos obrigatórios. O PoC local fica como fallback.
2. **Visão com Claude no backend**: só candidatos, sem calorias do modelo; `ANTHROPIC_API_KEY` apenas no servidor; EXIF removido, limites, timeout e idempotência (contratos já existem em `server/meal-analysis.ts`).
3. **Base nutricional**: ampliar a TACO (citação permitida) com USDA como complemento; **TBCA bloqueada** até permissão comercial; proveniência em cada item (AURAVIZ-76).
4. **Consentimento** separado para guardar e para enviar foto, com revogação (AURAVIZ-63).
5. **Fotos privadas**: Storage com RLS, URLs temporárias, exclusão de foto e derivados (AURAVIZ-98).
6. Metas e macros no diário (D3) e **"Minha Evolução"** (proposta em estudo; exige especificação e aprovação).
7. **Testes ponta a ponta no celular**: arroz+feijão+frango, prato misto, sem comida, erro de rede, autorização negada, correção, exclusão, virada de dia, upload repetido; iPhone Safari e PWA instalada.
- Aceite (do Linear): foto real processada, alimentos e porções editáveis, kcal e macros com proveniência, diário e metas atualizados, falhas tratadas, dados protegidos e testes no iPhone documentados.

### Fase 5 — Plataforma (G)
- **5A. Conta real:** Supabase Auth com e-mail e senha, confirmação por código via Resend, recuperação de senha, limites de tentativa. Validar 64 e 65 com duas contas e rede interrompida.
- **5B. Sincronização e migração** dos dados locais (backup prévio, importação idempotente, sem perda) (AURAVIZ-99).
- **5C. Lembretes com app fechado** (D5): Web Push com VAPID e atualização ao mudar o treino (AURAVIZ-67, 74).
- **5D. Assistente com IA remota** (AURAVIZ-72): só após consentimento, cotas e avaliação de respostas.
- **5E. Apple Watch no aparelho físico; Kegel** após a revisão profissional (AURAVIZ-96, 97).
- **5F. Login Google** (AURAVIZ-113), por último.

### Fase 6 — Lançamento (M)
Deploy na Vercel com rollback preparado, verificação de PWA e offline, orçamento de desempenho, observabilidade sem dados pessoais, política de privacidade e termos, e convite a um grupo pequeno restaurando backup real.

## 6. Dependências
```
Fase 0 → Fase 1 → Fase 2 → Fase 3
Fase 1 → 5A → 5B → Fase 4 → Fase 6
Fase 4 (backend) ← 5A + AURAVIZ-63 + 76
5C, 5D ← 5A + consentimento (63)
Kegel (96, 97) ← revisão profissional (externa)
```
As Fases 2 e 3 (treino) não dependem de backend e podem andar em paralelo com 5A.

## 7. Riscos
| Risco | Mitigação |
|---|---|
| Supabase nunca testado de verdade | 5A antes de qualquer promessa de nuvem; 2 contas e queda de rede no aceite |
| Custo e precisão da visão | teto (D1); medir com fotos brasileiras; estimativa sempre revisável |
| Push no iOS só em PWA instalada | decidir D5 cedo; manter .ics como alternativa |
| Licenças de dados (TBCA, GPL do OpenNutriTracker) | só TACO e USDA; não copiar GPL sem revisão |
| Revisão profissional do Kegel é externa | marcar como bloqueio e não prometer data |
| Trabalho paralelo em outros chats | um escritor por área; conferir branch e PR antes de cada fase |
| Mudança visual ampla (migração de componentes) | por tela, com captura antes e depois e `npm test` a cada passo |

## 8. Próximos passos (se aprovado)
1. Fase 0 inteira.
2. Fase 1: criar a issue de carga decimal e fechar 149, 151, 150, 152.
3. Fase 2 em ciclos curtos, começando por resumo do treino e cabeçalho vivo.
4. Em paralelo, responder D1 a D5 para destravar as Fases 4 e 5.
