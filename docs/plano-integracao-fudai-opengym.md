# Plano de integração: lições do Fud AI e do openGym no WinFit

Data: 2026-11-24. Base: **WinFit** (React 18 + Vite + TypeScript, Zustand, PWA, Cloudflare Worker, Supabase).
Objetivo: aproveitar **lógicas e lições** dos dois apps, reimplementadas na stack do WinFit. Nada de portar código.

> Fontes lidas: arquivos do [fud-ai](https://github.com/apoorvdarshan/fud-ai) (Kotlin, MIT) e do
> [openGym](https://github.com/DuarteSantos8/openGym) (JS/React, AGPL-3.0). Não rodei o Fud AI (nativo; a máquina não tem Xcode nem Android SDK).
> O que está aqui vem da leitura do código e do README, não de execução.

## 1. Licenças: como "aproveitar" sem contaminar

| App | Licença | Regra prática |
|---|---|---|
| Fud AI | MIT | Pode adaptar código com aviso de copyright. Mesmo assim, é Kotlin: reescrever em TypeScript. |
| openGym | AGPL-3.0 | **Não copiar trechos de código.** Copiar contamina o WinFit com AGPL (código aberto obrigatório para quem usa por rede). Reimplementar a *ideia* a partir do comportamento descrito é seguro. |

Fórmulas (Mifflin-St Jeor, Epley, 7.700 kcal/kg) são domínio comum. Prompts do Fud AI são MIT, mas vale reescrever para português do Brasil.
Se algum dia o WinFit quiser copiar código do openGym, a decisão de licenciar o WinFit como AGPL é do dono do produto, não técnica.

## 2. Estado atual do WinFit (verificado em `src/`)

**Já existe:** diário de refeições com tombstone e persistência versionada (`nutrition.ts`, `nutritionStore.ts`), meta calórica manual,
fotos com re-encode sem EXIF (`mealPhoto.ts`), proveniência obrigatória por alimento (`mealAnalysis.ts`, `foodCatalog.ts`),
visão de refeições local/Ollama/PoC (`mealVision.ts`, `localMealVision.ts`, `server/*`), assistente com consentimento e idempotência (`server/assistant.ts`),
dupla progressão simples (`progression.ts`), RPE/RIR em tipos, circuitos, backup, sync com nuvem (`cloudTransport.ts`).

**Não existe (busca por palavras-chave em `src/`):** BMR/TDEE e macros-alvo, ajuste adaptativo de meta, previsão de peso, código de barras, alergênicos,
água, jejum, retry com backoff, "streak"/semanas seguidas, deload, calculadoras (1RM por RPE, DOTS), contas de anilhas, supersets, fusão de sync por revisão.

## 3. Decisão central: conflito entre as filosofias

O WinFit hoje é **conservador por contrato**: "imagem identifica candidatos, nunca fornece kcal ou quantidades confiáveis" (`docs/meal-analysis.md`).
O Fud AI faz o oposto: o modelo devolve kcal, macros, gramas e ingredientes, e o usuário revisa.

**Proposta** (precisa de decisão sua, ver §7): três níveis de proveniência, mantendo o contrato atual como o nível mais confiável.

1. `user-label` / `catalog` (USDA, base licenciada): como hoje, cálculo determinístico.
2. `ai-estimate` (novo): vem do modelo, marcado visualmente como estimativa, com **faixa** (mín–máx) em vez de número exato, **confirmação obrigatória** e fora do total "confirmado" até o usuário aceitar.
3. `manual`: digitado pelo usuário.

Os portões de privacidade existentes (consentimento por destino, bucket privado, sem upload implícito) continuam valendo para o nível 2.

## 4. Lições do Fud AI → adaptação no WinFit

| # | Lição (onde está) | Adaptação em TS | Prioridade |
|---|---|---|---|
| F1 | **Metas por fórmula**: BMR por Mifflin-St Jeor, ou Katch-McArdle se houver % de gordura; TDEE = BMR × nível de atividade (6 níveis); proteína por kg (maior em déficit), gordura 0,6 g/kg, carboidrato = restante (`UserProfile.kt`) | `src/lib/goals.ts` puro + testes; hoje o WinFit só tem meta manual | Alta |
| F2 | **Macros fixados vs automáticos**: o usuário fixa um macro e os outros se rebalanceiam proporcionalmente | Mesmo módulo; estado `pinned` por macro | Média |
| F3 | **Meta adaptativa semanal**: ajuste = (ritmo-alvo − ritmo observado) × 7.700 ÷ 7, limitado a ±150 kcal/dia, ignorado abaixo de 25, piso = max(BMR, 1.200), teto = 1,25 × TDEE, exige ≥ 4 dias de dieta e ≥ 3 pesagens (`AdaptiveGoalService`) | `adaptiveGoal.ts` puro, sempre **sugestão** que o usuário aceita | Alta |
| F4 | **Completude do dia**: dia `missing` / `likely_partial` / `likely_complete`; nunca inferir baixa ingestão de dia parcial (`GoalEvidence.kt`) | Casa com o `daySummary` do WinFit, que já marca "total parcial" por pendências. Estender com a heurística de completude | Alta |
| F5 | **Previsão de peso** (30/60/90 dias, dias até a meta) por balanço energético + regressão linear, sem LLM; detecta sub-registro | `weightForecast.ts`; depende de F1 e do registro de peso (já existe) | Média |
| F6 | **Prompt estruturado com JSON estrito**: kcal, macros, `serving_size_grams`, `unit_options`, `ingredients` somando ao total, `null` para nutriente desconhecido, "prefira balança/rótulo visíveis à estimativa visual", "não invente contagem", "não conte duas vezes o mesmo alimento em ângulos diferentes" | Reescrever em PT-BR; validar a resposta com o mesmo estilo estrito de `validateVisionResult` (rejeitar campos extras) | Alta |
| F7 | **Unidades de porção**: gramas são a fonte da verdade; `{unit, quantity, grams_per_unit}` permite "2 fatias" | Estender `FoodItem` com `unitOptions` opcional | Média |
| F8 | **Multi-foto (até 10) + nota** analisadas juntas | Estender `MealPhotoDraft` | Média |
| F9 | **Retry**: 503/429/529 com espera 1s/2s/4s; fluxo interativo faz **1 retry** de 1,5 s; cancelar aborta a requisição de verdade (`RetryPolicy.kt`) | `fetchWithRetry` com `AbortController`; usar em `localMealService` e no assistente | Alta |
| F10 | **Reparo condicional**: só pede segunda chamada ao modelo quando não há macros (ex.: água); caso contrário mostra o resultado de imediato (`ServingUnitRepairPolicy`) | Regra de 5 linhas; evita dobrar a latência | Baixa |
| F11 | **Rascunho de falha**: entrada que falhou fica salva para Retry/Cancel ilimitado (`FailedMealDraft`) | `MealPhotoDraft` hoje descarta ao recarregar (decisão de privacidade). Manter em memória por padrão, oferecer retry sem recarregar | Baixa |
| F12 | **Revisão com desbloqueio**: editar kcal/macros e depois travar, de modo que mudar a porção escala a partir da edição | Já existe `editFoodItem` com regra parecida. Alinhar | Baixa |
| F13 | **"E se?"**: pré-visualiza como a refeição muda os totais do dia antes de registrar | Componente novo sobre `daySummary` + meta | Média |
| F14 | **Alergênicos**: compara nome/ingredientes/rótulo com sensibilidades do usuário em 4 níveis (declarado, pode conter, possível, não avaliável) | `allergens.ts`; só faz sentido com ingredientes/rótulo | Baixa |
| F15 | **Código de barras** via Open Food Facts | Depende de licença dos dados (ODbL: atribuição e compartilhamento). Avaliar antes, como o WinFit já faz com TBCA/USDA | Baixa |
| F16 | **Chaves BYOK no dispositivo** (13+ provedores) | **Não copiar no web**: chave no navegador é exposta. Manter chamadas via Worker (`server/worker.ts`) com consentimento por destino | Decisão |
| F17 | Extras de produto: refeições salvas (recentes/frequentes/favoritas), água, jejum, horários de refeição personalizados, metas de micronutrientes | Fase posterior, opcional por módulo | Baixa |

## 5. Lições do openGym → adaptação no WinFit (só ideias, sem copiar código)

| # | Lição (módulo do openGym) | Adaptação | Prioridade |
|---|---|---|---|
| G1 | **Progressão derivada do histórico**, nada guardado: o próximo alvo é função pura do que foi feito, então corrigir uma série errada já corrige a sugestão (`progression.js`) | O `suggestFor` do WinFit já é puro. Formalizar como "políticas" nomeadas | Alta |
| G2 | **Leitura honesta da sessão**: série não marcada = falha; menos séries que o plano = falha; só avança carga se tudo foi cumprido | Conferir se `allTopped` em `progression.ts` ignora séries não concluídas (hoje usa só `logs`) | Alta |
| G3 | **Várias políticas** de progressão (linear, dupla, por faixa) com o motivo sempre visível ("sugestão que você não consegue auditar é sugestão em que você deixa de confiar") | Adicionar política escolhida por exercício e o texto do motivo (o `note` já existe) | Média |
| G4 | **Deload**: após N semanas sem progresso, reduz carga por um fator configurável (`DELOAD_AFTER`, `DELOAD_FACTOR`) | `deload.ts` puro, sempre sugestão | Média |
| G5 | **Mapa de fadiga** por músculo: conta *séries duras efetivas*, não tonelagem; secundários valem 0,4; meia-vida de recuperação por músculo; teto por sessão | Alimenta o `BodyPlate` já existente | Média |
| G6 | **Sequência semanal** derivada dos treinos (nunca guardada): congelamento a cada 4 semanas, no máximo 2, e regra configurável (nenhum / suave / generoso) | `streak.ts` puro; duas telas leem o mesmo resultado, sem estado para dessincronizar | Alta (engajamento) |
| G7 | **Calculadoras**: 1RM (várias fórmulas), carga por RPE, tabela % do 1RM, DOTS/Wilks, IMC, gordura pelo método da Marinha | `tools.ts`; o 1RM por Epley já existe (`e1rm`) | Baixa |
| G8 | **Contas de anilhas** por barra e por academia ("X por lado") | Só se o público usar barra | Baixa |
| G9 | **Sync por revisão**: `PUT` com `baseRev` antigo recebe 409; mescla por campo com carimbos e tombstones, em vez de "o mais novo sobrescreve tudo" | O WinFit tem `cloudTransport.ts` e `supabase/schema.sql`. Verificar se o sync atual perde dados entre dispositivos antes de portar | Alta se houver sync multi-dispositivo |
| G10 | **Balanço estrutural** (qual exercício limita os outros), séries de aquecimento automáticas, supersets, séries por lado | Backlog | Baixa |

## 6. Fases propostas (cada uma com testes no estilo TDD que o WinFit já usa)

1. **Núcleo nutricional sem IA** (F1, F2, F3, F4, F5): `goals.ts`, `adaptiveGoal.ts`, `weightForecast.ts`, perfil (altura, sexo, nascimento, atividade, objetivo) e UI de meta calculada. Zero risco de privacidade.
2. **Camada de IA robusta** (F6, F9, F10, F16): `fetchWithRetry`, validação estrita, prompt PT-BR, novo nível `ai-estimate`. Só liga com provedor, região e consentimento aprovados, como `docs/meal-analysis.md` já exige.
3. **Fluxo de foto** (F7, F8, F13): multi-foto com nota, unidades de porção, ingredientes, "E se?".
4. **Treino** (G1 a G6): políticas e leitura honesta, deload, sequência semanal, fadiga.
5. **Sync** (G9) e extras (F14, F15, F17, G7, G8).

## 7. Decisões que dependem de você

1. Aceitar o nível `ai-estimate` (kcal vindo do modelo, marcado como estimativa) ou manter "imagem só dá candidatos"?
2. Provedor de IA: o PoC usa Ollama local; o Fud AI usa provedores remotos. Qual será o destino de produção?
3. O WinFit será proprietário? Isso confirma que openGym entra só como inspiração, nunca como código.
4. Código de barras e Open Food Facts: vale entrar, dado o cuidado com licença de dados que o projeto já tem?
5. Por onde começar: recomendo a Fase 1, que entrega valor sem IA, sem custo e sem risco de privacidade.

## 8. Limites desta análise

- Li ~20 arquivos do Fud AI e os módulos principais do openGym (cabeçalhos e exports). Não li as telas nem rodei nenhum dos dois.
- "Não existe no WinFit" vem de busca por palavras-chave em `src/`; pode haver variações de nome.
- Números como ±150 kcal e 7.700 kcal/kg são do Fud AI e **não foram validados clinicamente**. Tratar como sugestão ajustável.
