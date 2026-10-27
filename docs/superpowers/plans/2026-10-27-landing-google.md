# Landing Google Implementation Plan

**Goal:** Entregar a direção aprovada, pronta para revisão local no celular.
**Architecture:** Landing e prévia estática isoladas; botão Google compartilhado entre landing e login; módulo OAuth pequeno integrado à restauração existente. Estilos próprios não alteram telas de treino.
**Tech Stack:** React, React Router, CSS existente, Web Crypto e Supabase Auth REST.

1. [x] Testar primeiro geração PKCE, configuração ausente/desativada, troca de código, perda do verificador e erro do servidor em `scripts/test-google-oauth.ts`.
2. [x] Implementar `src/lib/googleOAuth.ts`, integrar `src/lib/auth.ts`, adicionar botão compartilhado e ajustar `Login.tsx` para aguardar carregamento e exibir erros.
3. [x] Substituir `Landing.tsx`, criar prévia ilustrativa e CSS isolado. Manter roxo, benefícios reais, respiração com contrações em revisão, alimentação manual, FAQ e opção sem conta.
4. [x] Manter landing como entrada em `App.tsx`, preservando guards e acesso ao plano existente.
5. [x] Documentar configuração em `.env.example` e guia OAuth; registrar teste no executor existente.
6. [x] Executar teste OAuth, `npm test`, `npm run build`, verificar interações e responsividade no Chrome; deixar prévia de celular aberta.

Execução no checkout local em branch `codex/landing-google` para manter a prévia já aberta e o mesmo armazenamento do navegador. Nenhuma publicação ou alteração no Linear faz parte desta entrega.

Verificação em 27/10/2026: 23/23 suítes passaram, incluindo 56.000 combinações do gerador; build passou. Revisão independente apontou evento incorreto no callback: corrigido para popstate e protegido por teste do adaptador real com retorno e cancelamento simulados. Navegador conferido em 320×740, 390×844 e 1366×900; sem overflow horizontal. Entrar, experimentar sem conta, FAQ e navegação interna verificados. Login real Google não executado, pois a configuração foi adiada conforme solicitado. Aviso de build preexistente sobre InstallCard importado de forma estática e dinâmica permanece.
