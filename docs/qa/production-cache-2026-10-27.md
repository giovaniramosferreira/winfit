# Validação de publicação e correção do cache offline

A publicação da PR7 ficou live no Render, commit f9337db. Durante a propagação, sete URLs novas de imagens responderam com HTML do fallback SPA e HTTP200 na CDN. Após expirar o cache de borda, os78 arquivos publicados passaram na comparação SHA256 com o ledger aprovado. Porém uma aba real ainda mostrava erro no supino com halteres: o precache já havia guardado a resposta HTML como imagem.

Correção: o manifesto de precache das ilustrações WebP agora inclui Subresource Integrity SHA256 dos bytes aprovados. Uma resposta HTML ou imagem divergente não pode ser instalada com sucesso. A revisão passa de MD5 para SHA256, obrigando o download correto das entradas antigas uma única vez; não toca localStorage, IndexedDB, sessões, backups ou histórico. A atualização continua solicitada pelo botão Atualizar, sem recarregamento forçado durante treino.

Regressão: teste de integridade aceita a imagem esperada, rejeita HTTP/data com HTML divergente, preserva entradas não afetadas e falha em fonte ausente. Build verificado:154 WebP protegidos, incluindo os74 novos atlas e originais. Verificação de produção após o segundo deploy será registrada pelo coordenador.
