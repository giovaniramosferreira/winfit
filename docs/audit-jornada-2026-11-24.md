# Auditoria da jornada — 24/11/2026

Base: app local (`npm run dev`) com o backup real exportado (25 sessões, 15 recordes, 3 planos arquivados, 1 circuito, 1 histórico de Kegel). Viewport de 390 px, claro e escuro. Cruzado com o projeto Winfit no Linear.

## 1. O que já existe e funciona
| Área | Estado no app | Linear |
|---|---|---|
| Landing e prévia | limpa, com chamada clara e prévia do app | AURAVIZ-113 (Google) adiado |
| Onboarding (9 perguntas) | fluido, uma pergunta por tela, plano gerado ao fim | AURAVIZ-65 em revisão |
| Home | 4 módulos + circuito + próximo treino, hierarquia boa | AURAVIZ-68 Done |
| Treinar (academia e calistenia) | próximo treino, semana, circuito | AURAVIZ-68 Done |
| Player | série a série, carga anterior, "Como fazer", opções | AURAVIZ-69 Done |
| Progresso | gráfico de carga, volume, treinos por semana, recordes | AURAVIZ-70 Done |
| Detalhe do exercício | ilustração, instruções, histórico e gráfico | AURAVIZ-70 Done |
| Biblioteca (78 exercícios) | busca, filtros, grupos | — |
| Circuito cardio e core | aviso de saúde, histórico | entrega recente |
| Alimentação (diário manual) | refeições, meta, total do dia | AURAVIZ-100 Done |
| Alimentação por foto | PoC local, só em dev | AURAVIZ-75 em andamento, 76 e 98 pendentes |
| Saúde pélvica | pausa de respiração; contração bloqueada | AURAVIZ-96 e 97 em revisão |
| Rotina (lembrete, checklist, check-in) | funciona com o app aberto | AURAVIZ-67 e 74 em revisão |
| Adaptar treino | regras locais por tempo e equipamento | AURAVIZ-73 Done |
| Design system | tokens, claro/escuro, componentes, vitrine | AURAVIZ-144 a 148 |

## 2. O que falta do plano
- **Kegel com contração:** bloqueado até a revisão profissional dos protocolos (AURAVIZ-96). Hoje só há respiração.
- **Lembretes com o app fechado:** só aparecem com o app aberto (AURAVIZ-67, 74).
- **Conta e nuvem reais:** login, sincronização e restauração só testados com backend simulado (AURAVIZ-64, 65, 99). Google adiado (113).
- **IA remota:** chat do assistente (AURAVIZ-72) e análise de fotos com nuvem (AURAVIZ-98, 76) não existem.
- **Validação em aparelhos físicos:** iPhone, Safari, Apple Watch.

## 3. Defeitos encontrados (não estavam no Linear)
1. **Duração do treino errada (corrigido em 24/11, AURAVIZ-149).** A duração é `endedAt − startedAt`. No backup real, 12 de 25 sessões passam de 3 h e a maior tem 167 h (treino deixado aberto). O resumo mostrou "14h10". Corrompe também comparações e estatísticas.
2. **Detalhe da sessão:** nome do exercício e contagem de séries aparecem coladas ("Leg press3 séries · Ver detalhes +").
3. **Painéis inferiores (sheets):** Esc não fecha, o fundo continua focável e o foco não volta a quem abriu. (A sobreposição dos botões do rodapé vista nas capturas era a animação de entrada, que começava com o painel a 60% de opacidade; corrigido junto.) **Corrigido em 24/11 (AURAVIZ-151).**
4. **`confirm()` nativo em 7 pontos** (descartar treino, apagar dados, encerrar circuito, etc.): visual fora da marca e não funciona em contextos embutidos (no navegador do app, "Descartar treino" não faz nada).
5. **Alvos de toque abaixo de 44 px:** chips da Biblioteca e do Assistente (38 px), links "NHS" (18 px), abas da prévia, link de semana na Home (36 px).
6. **Textos de 10 px:** letras dos dias da semana, rótulos da landing e da prévia.
7. **Duas `h1` na Alimentação** (cabeçalho antigo oculto) e botões com nome "✓" no player.
8. **Gráfico:** rótulo do último ponto sobrepõe o ponto; traço preto genérico; sem animação.
9. **Rotina:** abas quase vazias, com muito espaço morto.
10. **Resumo do treino:** vão grande entre os números e o botão; sem celebração de recorde.

## 4. O que falta para "super high-end"
Prioridade por impacto na jornada:

**A. Confiança (corrigir antes de polir):** itens 1 a 4 acima.

**B. Fluidez da jornada**
- Transições entre telas (View Transitions) e entre exercícios do player; hoje há troca seca.
- Esqueletos de carregamento e estados vazios ilustrados nas telas com dados.
- Retomada instantânea: voltar do resumo para o próximo passo sem passar pela Home.
- Feedback tátil (vibração) ao concluir série e ao bater recorde, com opção de desligar.
- Resumo do treino com celebração real: recordes, comparação com o último, compartilhar.

**C. Estética**
- Escala tipográfica única (usar `--ds-text-*`) e ritmo vertical consistente; hoje cada tela tem seus tamanhos.
- Gráficos próprios do design system: cor de marca, gradiente suave, rótulos sem colisão, animação de entrada.
- Ilustrações: unificar traço e paleta (ink) em todos os módulos, inclusive Kegel e Alimentação.
- Microinterações: botão com estado de carregamento, interruptores com mola, chips com ripple sutil.
- Modo escuro revisado tela a tela (contraste dos textos de apoio, cartões com mais profundidade).
- Ícones: conjunto próprio e consistente (hoje 20 traços genéricos).
- Home com saudação e contexto ("Dia 12 da sequência", último treino), em vez de lista estática.

**D. Acessibilidade e performance**
- Alvos 44 px, textos mínimos de 12 px, foco visível, leitores de tela nos painéis.
- Respeitar `prefers-reduced-motion` em todas as animações novas.

## 5. Ordem sugerida
1. Corrigir defeitos 1 a 4 (confiança nos dados e nos painéis).
2. Terminar fase 3b e fase 4 do design system (AURAVIZ-148, 147).
3. Resumo do treino e gráficos (momento de recompensa da jornada).
4. Transições, esqueletos e microinterações.
5. Revisão de ilustrações e ícones.
