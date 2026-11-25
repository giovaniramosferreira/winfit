# Befit — jornada observada e spec funcional (referência para o WinFit)

> Levantamento feito no iPhone real via Espelhamento do iPhone em 2026-11-24, sem conta e sem assinatura.
> Foco: usabilidade. Cada seção traz **o que acontece**, **por que funciona** e **como trazer para o WinFit**.
> Respostas dadas no quiz foram de teste (objetivo: força, intermediário, academia grande, 4x/semana). Nada foi comprado, nenhuma conta criada, notificações e Apple Saúde recusados.

---

## 0. Visão geral do funil

```
Abertura (logo) → Quiz 16 passos (com 7 telas de persuasão intercaladas)
  → Pedido de Apple Saúde → Pedido de notificações
  → Cálculo animado do plano (≈15 s) → Plano pronto
  → PAYWALL → (X) oferta de saída 40% → (X) Criar conta (Apple/e-mail) → (X) App em modo visitante
  → Sheet "Conectar Apple Watch" → Boas-vindas + tour de 7 passos → Home "Meu Plano"
```

**Achado central:** o app inteiro é utilizável sem conta e sem pagar; o funil só *empurra* cadastro e assinatura, e cada empurrão tem um X. O que dá a sensação de "app sério" é o quiz longo + persuasão, não um bloqueio.

---

## 1. Onboarding (quiz)

### 1.1 Mecânica comum a todas as telas
| Elemento | Comportamento |
|---|---|
| Barra de progresso | Segmentos finos no topo, verde-limão; contador "N/16" ao lado da seta de voltar |
| Seta de voltar | Canto superior esquerdo, sempre presente; volta inclusive de sub-estados (ex.: lista de lesões → pergunta) |
| "PULAR" | Aparece só em perguntas opcionais (região de foco, meta de peso) |
| Seleção única | **Toca e avança sozinho** (sem botão Próximo). Reduz um toque por tela |
| Seleção múltipla / valores | Botão "PRÓXIMO" fixo embaixo, verde-limão, largo (≈ 280 px), polegar alcança |
| Recomendado | Selo "RECOMENDADO" verde no canto da opção (plano inteligente, 40–60 min, renovação equilibrada) |
| Textos de apoio | Cada pergunta tem subtítulo curto ("Isso pode ser alterado a qualquer momento", "Vamos adaptar seu plano…") |

> Observação: o contador "N/16" não avança nas telas de persuasão (fica repetido), o que parece bug de contagem — **não copiar**; contar só perguntas.

### 1.2 Sequência completa
| # | Tela | Tipo | Opções / detalhes |
|---|---|---|---|
| 1 | Abertura | splash | Logo halter + "Befit" |
| 2 | Qual é o seu objetivo atual? | seleção única com foto | Melhorar condicionamento · Ficar mais forte · Definir o corpo · Ganhar músculos. Foto de corpo à direita de cada cartão |
| 3 | Experiência com treino de força? | seleção única com ícone + subtítulo | Iniciante (<1 ano) · Intermediário (1–2) · Avançado (2–4) · Especialista (4+) |
| 4 | Com que frequência você treina? | seleção única | Regular (≥2x/sem) · Inconsistente · Nunca (>6 meses parado) |
| 5 | Onde você treina atualmente? | seleção única, descrição longa | Academia grande · Academia pequena · Academia em casa · Peso corporal |
| 6 | **Persuasão 1** | gráfico de barras | "Mais força. Mais potência." Sem Befit × com Befit ("3x mais rápido") |
| 7 | Lesão ativa? | seleção única + sub-tela | Sem lesões · Sim → grade 2 colunas de áreas (Ombros, Costas, Joelhos, Peito, Quadríceps, Trapézio, Abdutores, Panturrilhas…) com **ícone anatômico** e checkbox; "Próximo" fica apagado até marcar algo |
| 8 | Região do corpo para focar | multi-seleção com boneco | Lista à esquerda + silhueta anatômica à direita; **ao tocar, a região acende em verde na silhueta e uma linha liga o rótulo ao músculo**. Opções: Corpo inteiro, Ombros, Braços, Peito, Abdômen, Costas, Glúteos, Pernas. "Pular" |
| 9 | **Persuasão 2** | carrossel automático | "Parabéns! Você está entrando numa comunidade que realmente evoluiu" + fotos de treinos com selo de kcal + "+3,4 mi de treinos registrados" |
| 10 | **Persuasão 3** | avaliações | 4,9 ★ · +34 mil avaliações · antes/depois · carrossel de depoimentos |
| 11 | Conectar ao Apple Saúde | pré-permissão | Diagrama Saúde ↔ Befit com chips (Caminhada, Corrida, Progresso, Força, Calorias, Treinos). "Agora não" / "Conectar" |
| 12 | Idade | roda (picker) | Já vem em 30 |
| 13 | Altura | régua horizontal | Já vem em 170 cm; alternador CM / FT-IN |
| 14 | Peso | régua horizontal | Já vem em 70 kg; alternador KG / LB; **cartão de IMC em tempo real** ("Seu IMC é de 24,2. Isso é ótimo!") |
| 15 | Meta de peso (opcional) | régua | Já preenchida a partir do objetivo (+4%); cartão "Você quer ganhar 4% de peso corporal" |
| 16 | Projeção | gráfico de linha | "Prevemos que você estará pesando 73 kg até 08 dezembro" |
| 17 | **Persuasão 4** | mock do app | "Com o Befit você evolui toda semana" — prévia de lista de exercícios com séries/reps/carga |
| 18 | Como configurar os treinos? | seleção única | **Plano inteligente (gerado por IA) — recomendado** · Plano criado por você. "Isso pode ser alterado a qualquer momento" |
| 19 | Frequência semanal | stepper − / + | Sugere 4 dias, com justificativa e chips (Intermediário, Ficar mais forte) |
| 20 | Tempo ideal de treino | seleção única | Rápido ≤20 · Curto 20–40 · **Médio 40–60 (rec.)** · Longo 60+ |
| 21 | Frequência de renovação do plano | seleção única | **Equilibrado (6 sem, rec.)** · Variado (2 sem) · Fixo |
| 22 | **Persuasão 5** | comparativo | "Outro plano" × "Plano Befit" com ✕ e ✓ |
| 23 | Pré-permissão de notificações | tela cheia + alerta do iOS | "Mantenha sua sequência viva." "Quem define lembretes treina 3x mais no primeiro mês." Mão animada apontando para "Permitir" |
| 24–26 | **Persuasão 6–8** | 3 telas de foto cheia | Frases curtas em caixa-alta ("FIQUE MAIS FORTE. TREINE COM CONFIANÇA.") |
| 27 | Parceiros | carrossel de logos | "Seu treino também rende benefícios" — cupons de marcas |
| 28 | Resumo "Consistência…" | painel | Nível fitness 71 → 89–95 em 2 meses; "Top 35% dos usuários"; barras Força/Consistência/Recuperação/Aderência; dica das 48 horas. CTA **"CRIAR MEU PLANO"** |
| 29 | Cálculo | loading animado | Círculo com % (28% → 52% → …) e **mensagens que mudam**: "Calculando seu nível de força…", "Ajustando a meta à sua condição…" + prova social rotativa |
| 30 | Plano pronto | resumo | "SEU PLANO PERSONALIZADO ESTÁ PRONTO · Ganhe músculos em 4 semanas!" · 3 cartões (4x por semana · Intermediário · Academia grande) · "SUA SEMANA DE TREINO" com dias expansíveis, cada um com silhueta do músculo e lista de exercícios (séries • reps • carga). CTA "CONTINUAR" |

### 1.3 O que funciona (usabilidade)
1. **Valores iniciais sensatos** em idade/altura/peso/meta: o usuário só confirma, não digita.
2. **Feedback imediato nas medidas**: IMC e % de ganho aparecem na mesma tela.
3. **Recomendações marcadas** reduzem a decisão a "aceitar".
4. **Toda decisão traz "pode ser alterado depois"** — baixa o medo de errar.
5. **Silhueta anatômica interativa** deixa a escolha de foco/lesão concreta.
6. **Cálculo animado com mensagens** cria a percepção de personalização (trabalho feito *por* mim).
7. **Plano mostrado ao final do quiz** com exercícios e cargas já preenchidos — o usuário vê valor antes de qualquer pedido.

### 1.4 O que evitar (padrões escuros / atritos)
- Mão apontando para "Permitir" na pré-permissão; "Não permitir" fica sem destaque.
- Contagem de progresso inconsistente.
- Muitas telas de persuasão em sequência (6–8 só de fotos de corpo); fotos idealizadas e antes/depois podem afastar o público do WinFit.
- Paywall com contagem regressiva/“oferta única” e **segundo paywall ao fechar** (Black Week 40%).
- Texto "Se sair, perderá esta oferta!" com ícone de alerta.

### 1.5 Para o WinFit
- Adotar: valores padrão + feedback instantâneo, seleção única que avança sozinha, selo "Recomendado", "pode mudar depois", plano pronto antes de qualquer cadastro.
- Adaptar: reduzir persuasão a 1–2 telas, com tom do WinFit (nada de corpo idealizado).
- Substituir: pré-permissão honesta, com os dois botões de peso igual.

---

## 2. Monetização e conta

| Tela | Conteúdo | Observação |
|---|---|---|
| Paywall | "Ganhe músculos toda semana" · 4,9 ★ (+34.000) · 3 benefícios · depoimento · selo **72% DESCONTO** · **Plano anual R$ 18,32/mês (R$ 219,90/ano)** pré-selecionado · **Plano mensal R$ 69,90** · "Cancele quando quiser" · CTA "CONTINUAR" · "Restaurar compra" · X no canto | Âncora de preço: mensal caro faz o anual parecer barato. Brinde animado no canto |
| Oferta de saída | "40% OFF · Se sair, perderá esta oferta!" · Plano anual Black Week R$ 10,82/mês (R$ 129,90/ano) | Aparece ao fechar o paywall |
| Criar conta | "Mantenha seu plano, treinos, recordes e dados salvos em todos seus dispositivos" · **Entrar com a Apple** · **Continuar com e-mail** · X | Conta é oferecida *depois* do valor percebido e é descartável |
| Modo visitante | App completo | Nenhum bloqueio imediato; recursos premium ficam com cadeado/coroa (ver §3) |

**Para o WinFit:** o WinFit já promete "Sem cadastro. Seus dados ficam no seu aparelho." — manter como diferencial. Se houver plano pago no futuro, pedir conta só para sincronizar/backup, nunca para usar.

---

## 3. Navegação e home "Meu Plano"

### 3.1 Barra inferior (5 abas, ícone + rótulo em caixa-alta)
`MEU PLANO · TREINOS · PROGRESSO · EXERCÍCIOS · PERFIL` — aba ativa em "pílula" mais clara; sempre visível, inclusive com o CTA verde flutuante acima dela.

### 3.2 Meu Plano
| Elemento | Comportamento |
|---|---|
| Título "Meu Plano ⌄" | Seletor do plano ativo (dropdown) |
| Coroa verde | Atalho para o paywall |
| Ícone de ajustes + ⋮ | Opções do plano (editar, renovar, trocar) |
| Abas **DIA 1 · DIA 2 · DIA 3 · DIA 4** | Um treino por dia; o dia atual já vem selecionado |
| "7 EXERCÍCIOS" + ícones de expandir / ⋯ | Contagem e ações em lote |
| Lista de exercícios | Miniatura ilustrada com **ícone do músculo-alvo sobreposto**, nome, `3 sets • 8 reps • 16 kg`, ⋮ por item, marca "C/ AQUECIMENTO" quando há série de aquecimento |
| **INICIAR TREINO** | Botão verde fixo, largo, acima da barra inferior; um toque |

**Por que funciona:** abre direto no treino do dia, já com carga sugerida. Do app aberto ao primeiro exercício = **1 toque**.

### 3.3 Tour inicial (7 passos, pulável)
Cartão flutuante com seta "→" e "PULAR TUTORIAL" sempre visível; a aba explicada acende na barra inferior e o resto escurece. Passos: Modo de Treino → Treinos semanais → Treinos de especialistas → Progresso → Exercícios (+500) → "Vamos começar! Clique em Iniciar Treino". Termina **empurrando para a ação**, não para um menu.

### 3.4 Interrupções que atrapalham (anotar para evitar)
- **Botão-presente com contagem regressiva (00:18:46)** flutua sobre a lista e **cobre botões de série concluída** durante o treino. Tem "−" para minimizar, mas volta.
- Sheet "Conectar Apple Watch" abre antes da primeira tela útil.
- CTA verde "DESBLOQUEAR…" fixo em Treinos, Exercícios, Progresso e Perfil ocupa a parte de baixo.

---

## 4. Treino ativo (a parte mais bem resolvida do app)

### 4.1 Início
Ao tocar "Iniciar treino": sheet **"Como registrar seu treino"** com 3 dicas ilustradas por mãozinha — (1) toque no check para concluir uma série, (2) toque no peso ou repetições para editar, (3) toque na etiqueta da série para mudar o tipo. Fecha tocando fora. Aparece no primeiro treino.

### 4.2 Tela
```
[⌄ minimizar]      Terça-Feira      [⋮ opções]
● 00:17 Duração    38 Calorias    304 Volume (kg)      ← atualizam a cada série
7 EXERCÍCIOS                    Adicionar exercício +
┌ Supino Inclinado com Halteres            ⋮
│ 2/3 registrado • 16kg
│ Adicionar nota…
│  SET   REPS   PESO (KG) [⚖]
│  A      8      6,00      (✓)   ← A = aquecimento (etiqueta amarela)
│  1      8     16,00      (✓)
│  2      8     16,00      (✓)
│  + ADICIONAR SET     MARCAR TODOS OS SETS ✓✓
└────────────────────────────────────
[        ✓ FINALIZAR TREINO        ]   ← fixo
```
- **Tipo de série por etiqueta**: A (aquecimento), numeradas (normal) — toque na etiqueta troca o tipo.
- **Cabeçalho vivo**: duração, calorias e volume aumentam ao concluir cada série (feedback imediato de progresso).
- **Chevron ⌄** minimiza o treino para navegar pelo app sem perdê-lo.

### 4.3 Edição de carga (bottom sheet)
Toque no peso/reps → sheet com **dois pickers de roda** (REPS | KG com decimal), título do exercício e contador "3/4 sets", **check verde para confirmar**, atalho "Entenda a diferença entre *Peso total* e *Por lado*" (ícone de halter) e **caixa marcada "Aplicar os mesmos valores aos próximos sets"**.
- Digitar não é necessário; rolar a roda resolve.
- Ao confirmar, **a série é marcada como feita** e o descanso começa (ver 4.4).

### 4.4 Descanso automático
Ao concluir uma série abre sheet inferior pequeno: nome do exercício, "Descanso", **cronômetro 00:59**, botões **−15 s / +15 s**, X para fechar. Tempo padrão **1:00** por exercício (editável) e geral (editável nas opções).

### 4.5 Menu do exercício (⋮)
Substituir exercício · Adicionar super série · Editar tempo de descanso (1:00) · Reordenar exercícios · Exercício opcional (toggle) · **Remover do treino** (vermelho, separado).
- **Substituir** abre sheet com ícones (Befit Lens, favoritos, busca) e lista **"RECOMENDADO"** de equivalentes do mesmo músculo, cada um com botão de troca.

### 4.6 Opções do treino (⋮ do topo)
Visualizar notas (toggle) · **Preenchimento automático de peso** (toggle) · **Coaching IA** (toggle) · Opções de visualização · Salvar treino · Tempo de descanso geral (1:00) · Finalizar treino · **Cancelar treino** (vermelho).

### 4.7 Finalização
Sheet "Finalizar treino": área opcional "Adicione uma imagem e compartilhe seu progresso", **duração editável (✎)**, "0/7 exercícios ✓", e três números — **peso total, total de reps, calorias** — + botão verde. Finalizar com poucas séries **não bloqueia nem pergunta** se tem certeza.

---

## 5. Pós-treino (momento de maior valor percebido)

Sequência, sem paywall no meio (o paywall entra depois):

1. **"Primeira sequência conquistada!"** — chama animada, confete, **"1 Ofensiva Diária"**, 4 bolinhas da meta semanal (a 1ª marcada), "3 treinos restantes para alcançar sua meta semanal", botões **"Como funciona"** e **"Continuar"**.
2. **"Compartilhe com sua foto da academia"** — três cartões de pré-visualização; "Adicionar foto" ou **"Agora não"**.
3. **Resumo "Seu 1º treino"** — carrossel de cartões compartilháveis (ex.: *NOVO RECORDE PESSOAL · Supino Inclinado · 16 KG*); ações **Personalizar · Stories · Copiar · Salvar · Compartilhar**; interruptores **Publicar no Strava** (desligado) e **Publicar no Apple Health** (**ligado por padrão**, mesmo após eu ter recusado a conexão com a Saúde → inconsistência a evitar); "Compartilhe e seja repostado! @befitapp.br"; detalhes do treino abaixo.
4. **"Curtindo o Befit até agora? 🤔"** — 5 estrelas + "Agora não", pedido de avaliação **logo no pico emocional**.
5. **Paywall "83% OFF"** (fechável) — depois de fechar, a avaliação reaparece uma segunda vez.
6. Cai em **Progresso** já com a semana preenchida.

**O que funciona:** celebração visual forte, meta semanal explícita ("3 restantes"), cartão compartilhável gerado automaticamente com o recorde.

**O que evitar:** pedir avaliação duas vezes; paywall imediatamente após a celebração; opção de publicar ligada por padrão.

---

## 6. Aba Treinos (biblioteca)

- **PERSONALIZAÇÃO** — atalhos em cartões horizontais: *Registrar cardio* (selo NOVO!), *Criar treino rápido*, *Criar treino p…* (rolagem lateral).
- **"TREINOS RÁPIDOS PARA [INTERMEDIÁRIO ⌄]"** — filtro por nível direto no título; **Ver tudo**.
- Cartão grande com foto: nível, título ("Construtor de Peito e Tríceps em Casa"), **`50 min • Academia Pequena`**, estrela de favorito. Rolagem horizontal.
- Treinos premium mostram coroa; o CTA "DESBLOQUEAR TODOS OS TREINOS" fica fixo.
- Seções seguintes (não exploradas) — "planos criados pela Equipe de Especialistas".

## 7. Aba Exercícios (biblioteca)

- Abas: **POR MÚSCULO · EQUIPAMENTOS · RANKING**; ícones ⭐ (favoritos) e 🔍 (busca).
- **Befit Lens (AI)** — cartão em destaque no topo: *"Aponte a câmera pra identificar o equipamento"*.
- Lista por músculo com **ilustração anatômica** (músculo em verde) e contagem ("Peito · 49 exercícios").
- Lista de exercícios do músculo: grade 2 colunas com ilustração (músculo em vermelho), ⭐ favorito, filtros **"Todos os níveis ⌄"** e **"Academia Grande ⌄"** (o local do quiz já vem aplicado), **ordenar por Popularidade**, **+ criar exercício**.
- Detalhe do exercício: ilustração grande com **animação do movimento**, botão expandir, ⭐; tags (*Peito*, *Muito popular*); abas **Visão geral · Instruções · Analytics**; "Músculos" com ícone + **primário/secundário**; **"Ouvir instruções — Audiodescrição · 0:20"** (acessibilidade).

## 8. Aba Progresso

- Faixa da semana com **bolinhas por dia** (hoje destacado, "1min" embaixo), setas de semana, ícones compartilhar e calendário.
- Cartões: **Total de treinos** e **Ofensiva diária** (ícone de chama).
- Cartão-troféu: **"Você bateu 1 recorde pessoal esta semana ›"**.
- **PROGRESSO SEMANAL** (tempo total, média por treino) — **borrado** atrás do CTA "DESBLOQUEAR TODO O PROGRESSO": gráficos ficam à vista, mas ilegíveis (isca de valor).
- Compartilhar o progresso a partir do topo.

## 9. Aba Perfil

- Avatar com **selo de alerta amarelo** + chip **"CRIAR SUA CONTA"** (lembrete discreto, nunca bloqueante) · nome "Usuário Befit" · ícone de sair.
- Três números: **Total de treinos · Recordes · Tempo ativo**.
- **PERFIL E AJUSTES:** Estatísticas de medição · Unidades de medida (kg/cm) · Idioma (Português).
- **CONEXÕES:** Strava ("Não conectado"), Apple Saúde, Apple Watch (não rolei até o final).

---

## 10. Padrões transversais de usabilidade

| # | Padrão | Onde aparece | Valor |
|---|---|---|---|
| P1 | **Bottom sheets** para tudo que é secundário (edição de carga, descanso, opções, substituição) | Treino ativo | Mantém o contexto; fácil de descartar tocando fora |
| P2 | **Valores sugeridos já preenchidos** (carga, reps, idade, altura, peso) | Quiz, treino | Usuário confirma em vez de digitar |
| P3 | **"Aplicar aos próximos sets"** | Edição de carga | Um ajuste vale para a sequência |
| P4 | **Seleção única avança sozinha** | Quiz | Menos toques |
| P5 | **Selo "Recomendado"** | Quiz | Decisão assistida |
| P6 | **Cabeçalho vivo** (duração/kcal/volume) | Treino ativo | Feedback instantâneo |
| P7 | **Ilustração anatômica com músculo destacado** | Quiz, listas, detalhe | Entende-se o exercício sem ler |
| P8 | **Todo overlay tem X** (paywall, conta, sheets) | Todo o app | Sensação de controle |
| P9 | **CTA principal verde, largo, fixo embaixo** | Todo o app | Zona do polegar, nunca se perde |
| P10 | **Cores com função**: verde = ação/sucesso, amarelo = aquecimento/alerta, vermelho = destrutivo | Todo o app | Leitura rápida |
| P11 | **Ações destrutivas em vermelho e separadas** | Menus | Evita erro |
| P12 | **Celebração + meta explícita** ("3 treinos restantes") | Pós-treino | Retenção sem culpa |
| P13 | **Modo visitante completo**, conta só como convite | Conta/Perfil | Zero atrito para começar |
| P14 | **Dicas contextuais ilustradas** só no primeiro uso | Treino | Aprendizado no momento certo |

### Problemas de usabilidade do Befit (não copiar)
1. Banner/presente com contagem regressiva **sobre os botões de série** durante o treino.
2. Três paywalls em sequência (anual → 40% → 83%) e reaparecimento depois do primeiro treino.
3. Pedido de avaliação duplicado.
4. Contador de progresso do quiz repetido nas telas de persuasão.
5. Apple Health "ligado" por padrão no resumo, contradizendo a recusa anterior.
6. Mãozinha induzindo "Permitir" em notificações.
7. Fotos de corpos idealizados (excludente).
8. Scroll horizontal em vários cartões sem indicação de que há mais.
9. Finalizar treino com 1 série concluída de 7 sem confirmação nem aviso.

---

## 11. Spec funcional proposta para o WinFit

> Prioridade: **P0** = essencial para a experiência equivalente; **P1** = alto valor; **P2** = depois.
> Cada requisito traz critério de aceite verificável. Itens marcados *(verificar)* dependem do estado atual do WinFit, que não foi reaudítado nesta sessão.

### 11.1 Onboarding
| ID | Requisito | Critério de aceite | Prio |
|---|---|---|---|
| ON-1 | Quiz com **objetivo, experiência, frequência atual, local de treino, lesões, foco, idade, altura, peso, meta, dias/semana, tempo por treino, renovação** | Todas as respostas ficam salvas no aparelho e alteram o plano gerado | P0 |
| ON-2 | Seleção única **avança sozinha**; múltipla/valores tem botão fixo embaixo | 1 toque por pergunta de seleção única | P0 |
| ON-3 | **Valores iniciais** em idade/altura/peso/meta | Usuário chega ao fim só tocando "Próximo" | P0 |
| ON-4 | **Voltar** em toda tela, inclusive sub-estados; **Pular** em opcionais | Voltar nunca perde respostas | P0 |
| ON-5 | Progresso "N/total" **só conta perguntas** | Contador sempre cresce de 1 em 1 | P0 |
| ON-6 | Selo **Recomendado** com justificativa curta ("com base no seu objetivo e nível") | Aparece em dias/semana, duração, renovação | P1 |
| ON-7 | **IMC e projeção** em tempo real nas telas de peso/meta, com linguagem neutra e sem julgamento | Texto nunca usa "gordo/magro"; oferece ocultar | P1 |
| ON-8 | **Silhueta anatômica interativa** para foco e lesões | Tocar acende a região; seleção multi com contagem | P1 |
| ON-9 | **No máximo 2** telas de persuasão (prova social + comparativo honesto) | Sem fotos corporais idealizadas | P1 |
| ON-10 | **Cálculo animado** com 3 mensagens específicas ("Escolhendo exercícios para academia grande…") | Dura 4–8 s; nunca trava | P1 |
| ON-11 | **Plano pronto** com semana expansível, exercícios, séries/reps/carga, **antes de qualquer pedido de conta** | Botão "Começar" leva ao treino do dia | P0 |
| ON-12 | Pré-permissão de notificações com **dois botões de igual peso** e texto honesto | "Agora não" tem o mesmo destaque que "Ativar" | P0 |

### 11.2 Conta e dados
| ID | Requisito | Critério de aceite | Prio |
|---|---|---|---|
| AC-1 | **Uso completo sem conta**; dados no aparelho (já é a promessa do WinFit) | Nenhuma tela exige cadastro | P0 |
| AC-2 | Chip discreto "Salvar na nuvem" no Perfil; nunca modal automático | Aparece só no Perfil e após o 3º treino | P1 |
| AC-3 | Exportar / importar dados | Arquivo gerado e reimportável | P1 |

### 11.3 Home — Meu Plano
| ID | Requisito | Critério de aceite | Prio |
|---|---|---|---|
| HM-1 | Abrir **no treino do dia**, dia correto pré-selecionado, abas por dia | Dia atual destacado | P0 |
| HM-2 | Lista com miniatura, **músculo-alvo sobreposto**, séries × reps × carga, marca de aquecimento | Cada item legível sem abrir | P0 |
| HM-3 | **Iniciar treino** fixo, largo, 1 toque | Do abrir do app ao 1º exercício = 1 toque | P0 |
| HM-4 | Menu do plano: editar, renovar, trocar, criar do zero | Todas as ações com desfazer | P1 |
| HM-5 | Tour de 5–7 passos, pulável, termina em "Iniciar treino" | "Pular" visível sempre | P1 |
| HM-6 | **Nenhum overlay** flutuante sobre botões de ação | Verificação visual em 360 px de largura | P0 |

### 11.4 Treino ativo
| ID | Requisito | Critério de aceite | Prio |
|---|---|---|---|
| TR-1 | Tabela **SET · REPS · PESO** com check por série | Concluir = 1 toque | P0 |
| TR-2 | **Tipos de série** por etiqueta (aquecimento, normal, falha, drop) | Toque na etiqueta troca o tipo | P1 |
| TR-3 | **Cabeçalho vivo**: duração, calorias estimadas, volume | Atualiza a cada série em < 300 ms | P0 |
| TR-4 | **Edição por sheet com picker de roda** (reps, kg com 0,25/0,5 de passo) | Sem teclado obrigatório | P0 |
| TR-5 | **"Aplicar aos próximos sets"** marcado por padrão | Séries seguintes recebem o valor | P0 |
| TR-6 | Alternância **Peso total / por lado** com explicação curta | Ícone na edição de carga | P1 |
| TR-7 | **Descanso automático** com −15/+15 s, tempo por exercício e geral, vibração/som ao terminar | Inicia ao concluir série; não bloqueia a tela | P0 |
| TR-8 | Menu do exercício: substituir (com **recomendados do mesmo músculo e local**), super série, descanso, reordenar, opcional, remover | Ações destrutivas em vermelho e confirmáveis | P0 |
| TR-9 | Opções do treino: notas, **preenchimento automático de carga** (última carga usada), salvar treino, cancelar | Cancelar pede confirmação | P0 |
| TR-10 | **Minimizar** o treino e navegar pelo app | Barra "treino em andamento" retorna ao treino | P1 |
| TR-11 | Dicas ilustradas **só no primeiro treino** | Não reaparecem | P1 |
| TR-12 | Adicionar exercício durante o treino, com busca | ≤ 3 toques | P0 |
| TR-13 | **Finalizar** mostra resumo (volume, reps, kcal, duração editável) e **avisa quando há séries pendentes** ("2 de 7 exercícios; finalizar mesmo assim?") | Confirmação só quando houver pendência | P0 |
| TR-14 | Notas por exercício | Persistem para a próxima vez | P1 |

### 11.5 Pós-treino
| ID | Requisito | Critério de aceite | Prio |
|---|---|---|---|
| PT-1 | Tela de **celebração** com sequência e meta semanal ("faltam N") | Mostra dias da semana com marcas | P0 |
| PT-2 | **Detecção de recorde pessoal** por exercício (carga, reps, volume) | Selo "Novo recorde" no resumo e no histórico | P0 |
| PT-3 | **Cartão compartilhável** gerado automaticamente (imagem) com opção de foto | Compartilhar, salvar, copiar, stories | P1 |
| PT-4 | Integrações (Apple Saúde, Strava) **desligadas por padrão** | Respeita a recusa anterior | P0 |
| PT-5 | **Um** pedido de avaliação, só após 3º treino concluído | Nunca duplica | P1 |

### 11.6 Biblioteca de treinos e exercícios
| ID | Requisito | Critério de aceite | Prio |
|---|---|---|---|
| BI-1 | Aba Treinos com **atalhos de personalização** (cardio, treino rápido, criar) e **filtro por nível** no título | Atualiza a lista sem sair da tela | P1 |
| BI-2 | Cartões de treino: foto, nível, **duração • local**, favorito | Tudo visível sem abrir | P1 |
| BI-3 | Exercícios por **músculo / equipamento / ranking**, busca, favoritos | Contagem visível por grupo | P1 |
| BI-4 | **Filtros de nível e local** com os valores do quiz já aplicados | O usuário não precisa refazer | P1 |
| BI-5 | Detalhe do exercício: **animação**, músculos primários/secundários, instruções em texto e **áudio**, histórico/analytics | Áudio com legenda em texto | P1 |
| BI-6 | **Identificar equipamento pela câmera** (equivalente ao Befit Lens) | Foto → lista de exercícios compatíveis | P2 |
| BI-7 | Criar exercício e treino próprios | Salvos e reutilizáveis | P1 |

### 11.7 Progresso
| ID | Requisito | Critério de aceite | Prio |
|---|---|---|---|
| PG-1 | Faixa da semana com bolinhas, navegação de semana, calendário completo | Dia com treino marcado | P0 |
| PG-2 | Cartões: total de treinos, **ofensiva diária**, recordes da semana | Toque no recorde abre a lista | P0 |
| PG-3 | Gráficos: tempo total, média por treino, volume, **carga por exercício** | Todos legíveis (nada borrado) | P1 |
| PG-4 | **Ofensiva sem culpa**: permitir "dia de descanso" sem perder a sequência | Configurável | P1 |
| PG-5 | Compartilhar o progresso da semana como imagem | Já existe no WinFit *(verificar)* | P1 |

### 11.8 Perfil e ajustes
| ID | Requisito | Critério de aceite | Prio |
|---|---|---|---|
| PF-1 | Totais (treinos, recordes, tempo ativo) | Atualizam em tempo real | P1 |
| PF-2 | Medidas corporais com histórico e gráfico | Peso/altura editáveis | P1 |
| PF-3 | Unidades (kg/lb, cm/ft) e idioma | Mudança imediata | P0 |
| PF-4 | Conexões (Apple Saúde, Strava, relógio) com estado claro | "Conectado / Não conectado" | P2 |

### 11.9 Princípios de design (transversais)
1. **Um toque para o essencial:** abrir → treino do dia → iniciar → concluir série.
2. **Sheets em vez de telas** para decisões secundárias; sempre dispensáveis tocando fora.
3. **Padrões inteligentes** (última carga, mesmos valores nos próximos sets, descanso por exercício).
4. **Feedback imediato** em cada toque (volume, kcal, check animado, vibração).
5. **Cor com função**, ação principal sempre verde/destaque e na zona do polegar.
6. **Nada flutuante sobre botões de ação**; promoções só em momentos de pausa.
7. **Sem culpa:** nenhum "perderá esta oferta", sem fotos idealizadas, sem pré-marcar compartilhamento.
8. **Respeito à escolha:** recusar permissão não pode ser punido nem desfeito por padrão.

---

## 12. Lacunas deste levantamento (não exploradas)

- Rolagem completa de **Perfil** (Conexões, suporte, termos, excluir conta) e de **Treinos** (seções de especialistas).
- **Befit Lens** (câmera), **Registrar cardio**, **Criar treino rápido**, criação de exercício próprio.
- Aba **Analytics** do exercício (coberta pelo balão promocional) e **Ranking**.
- **Paywall** completo após o 1º treino (só visto o topo; nada comprado).
- Fluxos de **conta** (Apple / e-mail) e **Apple Watch** (não iniciados por exigirem dados pessoais).
- Comportamento **offline**, **notificações** (recusadas) e **Apple Saúde** (recusado).
- Observação metodológica: o controle pelo Espelhamento do iPhone não rola listas longas com facilidade; telas muito longas foram vistas só no topo.

---

## 13. Comparação com o WinFit atual (auditoria do código em 2026-11-24)

> Base: leitura de `src/pages/{Onboarding,Preview,Home,Training,Player,Summary,Progress,Library,ExerciseDetail,Profile}.tsx`, `src/App.tsx`, `src/components/TabBar.tsx`. Não rodei o app nesta comparação; itens sobre aparência/gestos estão marcados *(confirmar no aparelho)*.
> Legenda: ✅ já tem · 🟡 parcial · ❌ não tem

### 13.1 Onde o WinFit já está à frente (manter e proteger)
| Tema | WinFit | Befit |
|---|---|---|
| **Uso sem conta / dados no aparelho** | Promessa explícita, exportar/apagar em Perfil | Conta empurrada em 3 telas |
| **Rascunho do onboarding** | Salvo a cada mudança; fechar e voltar retoma (`Onboarding.tsx:68`) | Não verificado |
| **Revisar respostas antes de gerar** | Resumo com chips tocáveis que levam direto ao passo (`Onboarding.tsx:247`) | Não tem |
| **"Por que este plano?"** | Racional do plano no preview (`Preview.tsx:45`) | Só texto de marketing |
| **Coluna "Anterior"** por série | Mostra carga×reps da última vez (`Player.tsx:212`) | Não tem |
| **Desfazer última série** e **excluir série** | Existem (`Player.tsx:245`, `:269`) | Não encontrei |
| **Substituir com escopo** | "Só neste treino" × "Sempre (atualiza o plano)" (`Player.tsx:424`) | Só troca |
| **Esforço percebido (RPE)** ao encerrar | 5 níveis, opcional | Não tem |
| **Aviso de treino parcial** | "Você registrou X de Y séries. Será salvo como parcial." (`Player.tsx:313`) — **já cumpre TR-13** | Sem aviso |
| **Retomar treino interrompido** | "Treino inacabado" com continuar/salvar parcial (`Home.tsx:74`) | Não verificado |
| **Calistenia / sem equipamento, circuito, saúde pélvica, alimentação, rotina, assistente, Apple Watch, PWA offline** | Existem | Befit não tem a maioria |
| **Conteúdo educativo do exercício** | "Evite" (erros comuns), anatomia com origem/inserção/ação, histórico e gráfico por exercício (`ExerciseDetail.tsx`) | Mais raso |
| **Sem paywall, sem contagem regressiva, sem promoção sobre botões** | — | Principal atrito do Befit |

### 13.2 Matriz de requisitos (spec §11 × WinFit)
**Onboarding**
| ID | Status | Hoje no WinFit | Ação |
|---|---|---|---|
| ON-1 quiz completo | 🟡 | 9 passos: objetivo, experiência, rotina atual, local, equipamento, dias, tempo, limitações, idade/peso. **Faltam:** altura, meta de peso, foco muscular, renovação do plano | Adicionar foco muscular (opcional, "Pular") e renovação; altura/meta só se alimentarem algo (IMC, projeção) |
| ON-2 seleção única avança sozinha | ✅ | `next()` com 180 ms (`Onboarding.tsx:75`) | — |
| ON-3 valores iniciais | ❌ | Idade e peso começam **vazios**, placeholders 28/72; "Gerar meu plano" só habilita com idade (`:252`) | Pré-preencher (ou régua/roda) e permitir "Pular" em peso/idade |
| ON-4 voltar e pular | 🟡 | Voltar ✅ (inclui pular passo de equipamento, `:80`); **sem "Pular"** nas opcionais | "Pular" em peso e foco |
| ON-5 progresso honesto | ✅ | Barra e `aria-valuenow` por passo; sem telas de persuasão | — |
| ON-6 selo "Recomendado" | ❌ | Nenhum | Marcar frequência/tempo sugeridos com base no objetivo e no nível |
| ON-7 IMC/projeção neutros | ❌ | — | Opcional; cartão discreto sob peso/altura, com "ocultar" |
| ON-8 silhueta anatômica interativa | ❌ | Limitações em 4 botões de texto (joelho, lombar, ombro, punho) | **Reaproveitar `BodyPlate`/`anatomy.ts`** para lesões e foco |
| ON-9 ≤ 2 telas de persuasão | ✅ | Nenhuma (landing já faz esse papel) | Considerar 1 tela de prova real ("o que você terá") |
| ON-10 cálculo animado | 🟡 | "Montando seu plano…" por 700 ms, mensagem única (`Preview.tsx:15`) | 3 mensagens específicas ("Escolhendo exercícios para academia completa…") por ~3 s |
| ON-11 plano pronto antes de conta | ✅ | Preview com dias expansíveis, exercícios e séries×reps | Mostrar **carga sugerida** quando houver histórico/estimativa |
| ON-12 pré-permissão honesta | ❌ | Não há pedido de notificações no fluxo | Se for pedir, usar dois botões de peso igual |

**Conta e dados**
| AC-1 uso sem conta | ✅ | — | Manter como diferencial de marca |
| AC-2 convite discreto à conta | ✅ | `AccountCard` no Perfil | — |
| AC-3 exportar/importar | ✅ | Exportar em Perfil; `DataControls` | — |

**Home / plano**
| ID | Status | Hoje | Ação |
|---|---|---|---|
| HM-1 abrir no treino do dia | 🟡 | Home tem **"Começar treino"** que já inicia o próximo dia do ciclo (`Home.tsx:33`), mas **não mostra a lista de exercícios** nem abas por dia; a lista está em Treinar | Mostrar os 3–4 primeiros exercícios na home ou levar direto ao Treinar |
| HM-2 lista com músculo-alvo e séries×reps×carga | 🟡 | Em Treinar: nº, nome, músculo, séries×reps (sem miniatura, **sem carga**) (`Training.tsx:66`) | Miniatura (`ExerciseThumb` já existe) + carga sugerida |
| HM-3 iniciar em 1 toque | ✅ | CTA no topo da Home | — |
| HM-4 menu do plano | 🟡 | "Editar plano" no Perfil, "Escolher outro dia" em Treinar | Atalho a partir de Treinar |
| HM-5 tour | ❌ | Nenhum | Tour curto (3–4 passos) no 1º acesso, pulável |
| HM-6 nada flutuante sobre ações | ✅ | `MiniBar` some na Home e no player; confirmar posição sobre o CTA em outras telas *(confirmar no aparelho)* | — |

**Treino ativo**
| ID | Status | Hoje | Ação |
|---|---|---|---|
| TR-1 tabela com check | ✅ | Série · Anterior · kg · reps · ✓ (`Player.tsx:198`) | — |
| TR-2 tipos de série | ❌ | Não há aquecimento/falha/drop | Etiqueta tocável (A, N, F, D); aquecimento não conta no volume nem no recorde |
| TR-3 cabeçalho vivo | 🟡 | "Exercício i de n · feitas/total" + barra (`:157`); **sem duração, kcal, volume** | Mostrar duração e volume acumulado no cabeçalho |
| TR-4 picker com passo fino | 🟡/❌ | `NumberDial`; **carga inteira** (`Math.round`, `integer`, `Player.tsx:114,124`) → **não aceita 2,5 kg**; reps até 30 | **Prioridade alta:** aceitar 0,5/1/2,5 kg; subir limite de reps ou permitir livre |
| TR-5 aplicar aos próximos | ✅ | `defaultWeight/defaultReps` usam a última série (`:97`) | Tornar visível ("Repetir última") |
| TR-6 total/por lado | ❌ | — | Só relevante para halteres e máquinas; baixa prioridade |
| TR-7 descanso | 🟡 | Barra com +30 s e Pular, bip e vibração; tempo por exercício vem do plano (`restSec`) | Adicionar **−15 s**, editar descanso por exercício e geral |
| TR-8 menu do exercício | 🟡 | Substituir ✅, Pular ✅, ir para exercício ✅; **faltam** super série, reordenar, opcional (existe `optional` no modelo), adicionar exercício | Adicionar "Reordenar" e "Adicionar exercício" |
| TR-9 opções do treino | 🟡 | Watch, encerrar, descartar (com `confirm`) | Notas e "salvar como modelo" |
| TR-10 minimizar | ✅ | Botão voltar mantém o treino; `MiniBar` fora da Home | — |
| TR-11 dicas no 1º treino | ❌ | — | Sheet com 3 dicas só na 1ª sessão |
| TR-12 adicionar exercício durante o treino | ❌ | — | Busca na biblioteca → adicionar à sessão |
| TR-13 aviso de pendências | ✅ | — | — |
| TR-14 notas por exercício | ❌ | — | Campo opcional, reexibido na próxima vez |

**Pós-treino**
| PT-1 celebração com sequência e meta | 🟡 | Summary com confete quando há recorde; **sem sequência/ofensiva e sem "faltam N"** | Linha "2 de 4 esta semana · faltam 2" + dias da semana |
| PT-2 recorde pessoal | ✅ | `checkPR` por série, selo e lista no resumo (`Summary.tsx:60`) | — |
| PT-3 cartão compartilhável | ✅ | `renderShareCard` → compartilhar ou baixar | Incluir recorde e opção de foto |
| PT-4 integrações desligadas | ✅ | Não publica em lugar nenhum | — |
| PT-5 avaliação | ✅ | Não pede | Opcional: um pedido após o 3º treino |

**Biblioteca**
| BI-1 atalhos de personalização | ❌ | Treinar tem Academia/Calistenia e circuito | Atalhos "Treino rápido", "Criar treino" |
| BI-2 cartões com duração • local | ❌ | Não há biblioteca de treinos prontos | P2 |
| BI-3 músculo / equipamento / ranking, favoritos | 🟡 | Busca ✅ (aceita apelidos e latim), chips por músculo, **"Posso fazer"**; **sem favoritos, equipamento ou ranking** | Favoritos + aba equipamento |
| BI-4 filtros com valores do quiz | ✅ | "Posso fazer" já usa local, equipamento e limitações do perfil | — |
| BI-5 detalhe | 🟡 | Animação, instruções, erros comuns, músculos, histórico ✅; **sem áudio** | Áudio opcional (`speechSynthesis`, offline) |
| BI-6 câmera p/ equipamento | ❌ | Há `MealVisionLab` (visão para refeições) | Possível reuso do pipeline local; P2 |
| BI-7 criar exercício/treino próprio | ❌ | — | P1 junto com TR-12 |

**Progresso**
| PG-1 faixa da semana | 🟡 | `week-dots` em Treinar; em Progresso, barras de 8 semanas | Levar a faixa da semana a Progresso + calendário |
| PG-2 cartões total/ofensiva/recordes | 🟡 | Treinos da semana, volume (+% vs semana anterior), total, recordes ✅; **sem ofensiva** | Ofensiva "sem culpa" (PG-4) |
| PG-3 gráficos | ✅ | Gráfico do exercício líder, evolução por exercício, histórico, barras por semana | — |
| PG-4 dia de descanso sem perder sequência | ❌ | — | Definir como "semanas seguidas cumprindo a meta" em vez de dias seguidos |
| PG-5 compartilhar progresso | 🟡 | Compartilhar só no resumo do treino | Botão no topo de Progresso |

**Perfil**
| PF-1 totais | ❌ | Cartão do plano, sem totais | Treinos, recordes, tempo ativo |
| PF-2 medidas com histórico | ❌ | Peso só no onboarding | P1 |
| PF-3 unidades e idioma | ❌ | Só kg/PT-BR fixos | kg/lb se houver público fora do Brasil |
| PF-4 conexões | 🟡 | Apple Watch ✅; sem Saúde/Strava | P2 |

### 13.3 Backlog priorizado (impacto × esforço)
| # | Item | Por quê | Esforço |
|---|---|---|---|
| 1 | **Carga com decimais** (TR-4): passo 0,5/1/2,5 kg | Hoje é impossível registrar 2,5 kg; afeta recordes e progressão | Baixo/médio (`NumberDial`, `setInputLimits`, `logSet`) |
| 2 | **Cabeçalho vivo** (TR-3): duração + volume | Feedback imediato; pouca lógica nova | Baixo |
| 3 | **Valores iniciais e "Pular"** no quiz (ON-3/ON-4) | Reduz atrito e abandono | Baixo |
| 4 | **Descanso**: −15 s, tempo por exercício (TR-7) | Controle fino sem sair do fluxo | Baixo |
| 5 | **Carga e miniatura na lista do dia** (HM-2) | Home e Treinar mostram o que vem a seguir | Baixo/médio |
| 6 | **Meta semanal no resumo** (PT-1): "faltam N" + dias | Retenção sem culpa | Baixo (`homeSummary` já calcula) |
| 7 | **Lesões e foco por silhueta** (ON-8) | Reaproveita `BodyPlate`; diferencial visual | Médio |
| 8 | **Tipos de série** (TR-2) com aquecimento fora do volume | Dados mais corretos | Médio (modelo `SetLog`) |
| 9 | **Adicionar exercício / reordenar / notas** (TR-8, TR-12, TR-14) | Flexibilidade real no treino | Médio |
| 10 | **Favoritos e filtro por equipamento** (BI-3) | Biblioteca mais útil | Baixo/médio |
| 11 | **Dicas no 1º treino** (TR-11) e **tour curto** (HM-5) | Aprendizado no contexto | Baixo |
| 12 | **Selo "Recomendado"** (ON-6) | Decisão assistida | Baixo |
| 13 | **Áudio das instruções** (BI-5) | Acessibilidade | Baixo (Web Speech) |
| 14 | **Totais no Perfil** (PF-1) e **medidas** (PF-2) | Retorno de longo prazo | Médio |
| 15 | **Treino próprio / biblioteca de treinos prontos** (BI-1, BI-2, BI-7) | Maior ganho de escopo | Alto |

### 13.4 Não copiar (decisão de produto)
Paywall em sequência, oferta de saída, contagem regressiva flutuante, mão apontando "Permitir", corpos idealizados, publicação ligada por padrão, pedido de avaliação duplicado. O WinFit já evita todos — registrar como **princípio do produto**, não como lacuna.

### 13.5 Próximos passos sugeridos
1. Fechar os itens 1–6 do backlog como um único ciclo "Treino mais fluido" (todos em `Player.tsx`, `Summary.tsx`, `Onboarding.tsx`).
2. Rodar o WinFit no iPhone pelo Espelhamento para confirmar os pontos marcados *(confirmar no aparelho)* e comparar lado a lado com os prints do Befit.
3. Só então decidir sobre 7–15 (silhueta, tipos de série, treinos próprios).
