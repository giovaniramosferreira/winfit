# QA independente — interface completa WinFit

Data: 27/10/2026. Revisão independente após integração dos três grupos de telas. Navegador IAB controlado exclusivamente por cua_repl; sem Playwright externo/CDP. Nenhum registro do usuário foi criado, alterado ou removido. Fixtures SSR temporárias dos componentes reais Home/Player/Training foram geradas em processo Node isolado, sem persistência no navegador, e removidas ao final.

## Resultado

- `npm test`: 23/23 suites aprovadas; gerador validou 56.000 combinações sem falhas.
- `npm run build`: TypeScript e Vite aprovados, 130 módulos, PWA gerada.
- `git diff --check`: aprovado.
- Inspeção dos diffs das páginas e das quatro folhas novas confirma aplicação de classes/tokens claros e roxos em todas as famílias; imports centralizados em main.tsx. Sem nova dependência, serviço pago ou conteúdo funcional fictício introduzido pelo redesign. Landing identifica sua prévia como ilustrativa.
- Raiz sempre mostrar Landing foi confirmada pelo coordenador como decisão intencional do escopo anterior.

## Cobertura de navegador

Medições de largura em 320×568 e 390×844: Home, Training, Calisthenics, Nutrition, Pelvic, Routine, Assistant, Profile, Progress, Library, ExerciseDetail, SessionDetail, Summary, Login e primeiro passo de Onboarding. Nenhuma largura excedeu a área disponível após correção do input de backup. Outras telas podem rolar verticalmente.

Home sem sessão: scrollHeight igual à altura da viewport (568/844), scrollWidth igual à largura (320/390). Home com sessão em fixture: mesmos resultados; botão Retomar, quatro módulos e navegação visíveis sem rolagem. Player em fixture nas duas dimensões: rodapé visível, controles de anterior/próximo/encerrar acessíveis; em 320px, Encerrar ocupa y515–560 de568, próximo y457–507. Conteúdo central rola. Training ativa com MiniBar em320: barra fica acima da navegação, sem sobreposição entre as duas; conteúdo dispõe de padding inferior.

Inspeção visual de screenshots: Home com/sem sessão nas duas dimensões; Player nas duas; Training, Calistenia, Pelvic, Assistant, Nutrition, Profile, Progress, ExerciseDetail, Preview e primeiro passo de Onboarding em320; Summary e Login em390; Landing em390. Library e SessionDetail tiveram DOM e medição nas duas larguras, sem revisão visual exaustiva de cada item. Preview validado no estado de carregamento e plano pronto em320.

Gates observados: Kegel “Aguardando revisão profissional” desativado; Google desativado em Login e Landing; Assistant informa indisponibilidade da conversa IA e mantém contexto/consulta desativados até opção explícita; Nutrition informa análise IA indisponível. Controles de exportação/importação de backup continuam presentes.

## Bugs encontrados e corrigidos

1. **Atalhos quebravam o HashRouter** (`src/pages/Assistant.tsx:39`, `src/pages/Routine.tsx:31`): links `href="#assistant-adaptation"` e três links `#routine-*` enviavam o usuário à Landing. Reproduzido em navegador. Convertidos para botões `scrollIntoView()` sem animação imposta. Reteste confirmou hashes `#/assistant` e `#/routine` preservados, seção alvo visível.
2. **Perfil com overflow horizontal em320** (`src/account-ui.css`, regra final): input nativo de backup avançava até x315, enquanto clientWidth era305 (10px de excesso). Limitado a100% do contêiner e min-width0. Reteste: scrollWidth305/clientWidth305.

## Limites

Dados de Nutrition e Pelvic já apareciam inválidos/indisponíveis na sessão existente; conteúdo original foi preservado. Não foi testado salvamento de refeição, redefinição, importação, envio externo, conta autenticada, sincronização real, compra ou gravação de séries. Fixtures são SSR estático: validam geometria, não eventos de treino. Não percorremos as nove perguntas até salvar nem todos os diálogos/estados vazios/de erro; a cobertura comportamental adicional vem das23 suites. Não afirmamos revisão visual individual de78 exercícios. Nenhum problema importante aberto foi encontrado no escopo efetivamente inspecionado.

## Evidências locais

- `/private/tmp/winfit-home-320.jpg`
- `/private/tmp/winfit-home-390.jpg`
- `/private/tmp/winfit-home-active-320.jpg`
- `/private/tmp/winfit-player-320.jpg`

Home deixada aberta; override temporário de viewport removido. Coordenador deve abrir a aba original visível para entrega.
