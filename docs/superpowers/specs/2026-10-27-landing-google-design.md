# Landing e entrada Google

Direção aprovada pelo usuário em 27/10/2026: manter roxo, experimentar sem conta e preparar Google para configuração posterior.

A rota raiz apresenta a landing, inclusive com plano local existente. O visitante vê proposta de valor, prévia ilustrativa do app, quatro módulos com disponibilidade verdadeira, funcionamento e perguntas frequentes. Quem já tem plano pode abrir o app; experimentar sem conta preserva o plano existente ou inicia o onboarding.

Login Google usa Supabase OAuth com PKCE, sem SDK adicional. Uma flag pública explicitamente falsa por padrão controla a disponibilidade. Sem configuração, o botão fica desativado com explicação visível; não há redirecionamento nem requisição. A chave secreta Google fica somente no provedor. Login por link de e-mail continua disponível quando configurado.

O callback troca código por sessão, verifica usuário pelo fluxo existente e retorna à tela de login. Erros/cancelamento têm texto seguro, sem exibir mensagens arbitrárias do provedor. O login aguarda a restauração/backup antes de decidir entre Home e onboarding. Não envia dados locais automaticamente.

Verificação: testes de PKCE/flag/erros, build, suíte existente e revisão no navegador em 320, 390 e desktop; cliques de login desativado, FAQ e experimentar sem conta.
