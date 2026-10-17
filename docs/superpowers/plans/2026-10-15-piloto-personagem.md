# Piloto do personagem — três movimentos

**Pedido e critério:** refazer agachamento corporal, flexão de braço e leg press, mostrar no navegador e aguardar avaliação antes de estender aos outros 75 exercícios. Usar a referência somente como direção de traço/hachura, criar arte original e preservar o tema roxo e o player.

**Abordagem:** ilustrações originais geradas com a ferramenta de imagem, em sequências de poses, com corpo proporcional, contorno de tinta e shorts hachurados. Montagem local dos quadros em atlas WebP alinhados pelos apoios. Componente isolado para esses três IDs, reprodução/pausa via animação de posições do atlas; os demais conservam o componente vetorial atual. Leg press deve mostrar encosto, trilhos e plataforma, com pés em contato e sem travar os joelhos.

- [x] Gerar e inspecionar os três conjuntos; descartar quadros que violem os critérios de pose.
- [x] Testar primeiro o escopo exato de três IDs, arquivos locais e reprodução inicialmente pausada.
- [x] Integrar atlas e componente isolado; preservar rotas, dados e controles de treino.
- [x] Incluir WebP no cache PWA e documentar fontes/prompts.
- [x] Rodar testes e build; conferir os três no navegador, incluindo reprodução e pausa; deixar comparações para o usuário.

Etapa concluída e aprovada pelo usuário. A autorização posterior estendeu o personagem aos demais movimentos e mapas musculares, conforme `2026-10-15-expansao-personagem.md`; a restrição inicial deste piloto foi atendida.

## Evidências de verificação

- Três testes do piloto e quatro de ilustrações passaram; 12 testes de calistenia e suíte de casa passaram.
- Build TypeScript/Vite/PWA concluído; os três atlas WebP aparecem no precache gerado.
- Novas artes abertas no navegador em desktop e celular; agachamento e flexão examinados em poses diferentes; controles de reprodução/pausa conferidos. Leg press com máquina completa e seleção de poses sem extensão total.
- Limite: troca discreta de quadros, com pequenas variações de contorno; sem validação biomecânica profissional. Expansão bloqueada por escopo até avaliação do usuário.
