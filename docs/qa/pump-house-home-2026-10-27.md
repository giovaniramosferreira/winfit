# Adaptação inicial Pump House — 27/10/2026

Pedido aprovado: aproveitar telas/componentes do kit gratuito e adaptar o rosa para a paleta roxa WinFit. Primeiro recorte: Home, navegação da Home e créditos no Perfil.

Fontes Figma: Home/Home 202:10972; Appbar 202:11072; ícone 202:10992; arquivo aRxadQrXj8QamZ0ndnClV1. Contexto de design e renders obtidos pela integração oficial antes da edição.

Mudanças: superfícies brancas/lavanda, destaque roxo com resumo semanal real, cartões 2×2 com ilustrações próprias, ícones importados do kit, atalhos arredondados e navegação inferior em cápsula. Rotas e tratamentos de retomada/expiração permanecem. O contador semanal usa sessionsThisWeek e a meta do perfil/plano; nenhum dado ilustrativo do template foi incorporado.

Teste session-modules confirma o contador vazio e seu incremento com uma sessão concluída, quatro ilustrações, rotas, atalhos e retomada compacta. Verificação visual: 390×844 e 320×568 sem overflow vertical ou horizontal. SVGs locais conferidos como carregados e com dimensões nativas. Arquivos/fontes não autorizados do template não foram importados; créditos em docs/media-licenses.md e Perfil.

Outras telas do aplicativo não foram redesenhadas neste recorte. Interface Figma original não foi recolorida ou editada: a adaptação está no código local do WinFit.

Também conferido com sessão fictícia ativa: 320×568 e 390×844, scrollHeight igual à altura disponível e sem recorte de controles. O SVG play carregou localmente. Artefato de teste temporário removido, sem gravar dados na conta/navegador do usuário.

Revisão independente apontou herança do token --olive no tema claro; corrigido para o acento roxo local para preservar contraste em ações de salvar treino parcial e avisos PWA.
