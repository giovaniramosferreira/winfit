# WinFit — identidade visual em todas as telas

Direção aprovada: levar a adaptação Pump House já aprovada na Home para todas as telas, com superfícies claras, roxo, cartões arredondados, tipografia Geist e ícones locais. Home 2×2 continua sem scroll em celular retrato; telas com formulários, listas e históricos podem rolar para preservar acesso.

## Contrato compartilhado

- Coordenador: App.tsx, main.tsx, styles.css, novo src/product-ui.css, TabBar/MiniBar e integração final.
- Agente treino: Training, Player, Summary, Library, ExerciseDetail; src/training-ui.css.
- Agente bem-estar: Nutrition, Pelvic, Routine, Assistant e componentes específicos de alimentação/pélvicos; src/wellness-ui.css.
- Agente conta/progresso: Landing/landing.css, Login, Onboarding, Preview, Profile, Progress, SessionDetail e componentes de conta; src/account-ui.css.
- Agente independente depois da integração: testes, revisão de requisitos, navegabilidade/layout e regressões; correções prioritárias por evidência.

## Regras

Preservar lógica, dados, rotas, rótulos acessíveis, gates de Kegel/IA/Google e controles de backup. Nenhuma funcionalidade fictícia, nova dependência, serviço pago ou alteração no Linear. Reutilizar assets locais do kit e ilustrações próprias; manter créditos. Nenhum agente edita arquivos de outro grupo ou faz commits. Estilos de cada grupo entram por main.tsx para não quebrar testes SSR.

As telas internas recebem .product-shell com tokens claros: --bg, --bg-elev, --text, --text-dim, --line, --accent e --accent-strong. Classes compartilhadas disponíveis: screen-topline, screen-kicker, screen-title, screen-subtitle, ui-section-heading. O coordenador define esses estilos. CSS adicional de agentes deve ter escopo por página/família. Sem alteração de regras de negócio.

## Verificação

Executar npm test e npm run build, testar os fluxos reais com navegador interno sem apagar dados da pessoa. Estados complexos podem usar fixtures isoladas renderizadas dos componentes reais. Conferir 390×844 e 320×568, texto/contraste/áreas de toque, player sem controles encobertos e Home com/sem sessão. Um agente de teste separado revisa a integração e reporta limites. Deixar prévia local aberta e entregar relatório conciso.
