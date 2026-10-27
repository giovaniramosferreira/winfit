# Configurar login Google

A landing e a tela Entrar já incluem o botão. Ele permanece desativado enquanto `VITE_GOOGLE_AUTH_ENABLED` não for `true` **e** URL/chave pública Supabase não estiverem preenchidas. O fluxo usa código de autorização com PKCE/S256 e verificador temporário neste navegador, válido por dez minutos. Não há SDK ou serviço novo.

## Ativação posterior

1. No Google Auth Platform, configure o aplicativo e crie um cliente OAuth para aplicação Web. Cadastre as origens exatas de desenvolvimento/produção usadas pelo app.
2. Copie do Supabase, em Authentication → Sign In / Providers → Google, a URL de callback e cadastre-a como redirect autorizado no Google. O formato normalmente é `https://<project-ref>.supabase.co/auth/v1/callback`; use o valor mostrado pelo seu projeto.
3. Ative Google no Supabase e informe o Client ID e Client Secret do Google **somente nesse painel**. Não coloque o Client Secret em variáveis `VITE_*`, código ou Git.
4. Em Authentication → URL Configuration do Supabase, cadastre os retornos exatos do app. Para a prévia deste projeto: `http://127.0.0.1:5173/`. Se usar `localhost`, cadastre também `http://localhost:5173/`. Em produção, cadastre a URL HTTPS com a barra final. Se hospedar em subdiretório, use o caminho da instalação.
5. Crie `.env.local` (ignorado pelo Git) com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_GOOGLE_AUTH_ENABLED=true`. Reinicie o servidor de desenvolvimento; em produção, gere uma nova build com essas variáveis.

## Conferência antes de liberar

- O botão deve abrir o consentimento Google e retornar para `/?code=…`; o app remove o código da URL, troca-o por sessão e abre `#/login` enquanto verifica a conta.
- Conta com plano local ou backup restaurado segue para Home. Conta sem plano segue para onboarding. A tela aguarda a restauração antes de decidir.
- Cancelar o consentimento ou retornar sem o verificador deve mostrar uma mensagem e permitir tentar novamente. Não deve apagar plano ou registros locais.
- Entrar não deve enviar os registros locais. O backup continua com revisão e confirmação próprias no Perfil.
- “Experimentar sem conta” segue para onboarding ou para o plano local existente, sem iniciar autenticação.
- Se a configuração ainda não estiver pronta, mantenha `VITE_GOOGLE_AUTH_ENABLED=false`.

Testado localmente com contratos simulados de geração/troca PKCE e falhas. O login real ponta a ponta depende da configuração acima e ainda não foi executado.

Referências oficiais: [Google no Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [retornos permitidos](https://supabase.com/docs/guides/auth/redirect-urls), [fluxo PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow).
