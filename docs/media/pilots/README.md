# Piloto de ilustração em tinta — 15/10/2026

Três artes originais geradas com a ferramenta integrada `image_gen`: agachamento corporal, flexão de braço e leg press. A imagem do usuário orienta somente traço, volume e hachuras; não foi incorporada ao aplicativo, recortada nem usada para remover marca-d'água. Os PNGs `*-fonte.png` preservam os resultados originais da geração. Prompts em `prompts.md`.

Os atlas de produção estão em `public/media/pilots/*-v2.webp`. A montagem recorta as células da folha, alinha os apoios, aplica a mesma escala aos quadros de um exercício e comprime em WebP. Não redesenha nem interpola o corpo. A animação troca quadros discretos; não é vídeo ou captura de uma pessoa.

Arquivos finais: `public/media/pilots/agachamento-v2.webp`, `public/media/pilots/flexao-v2.webp` e `public/media/pilots/leg-press-v2.webp`.

Agachamento e flexão usam seis poses com retorno em ordem inversa. No leg press, foram selecionadas somente as três primeiras poses da folha, até uma extensão com leve flexão do joelho; as três últimas foram descartadas por estender demais as pernas. O atlas duplica as três poses selecionadas em ordem inversa para formar o ciclo. Metadados da seleção e alinhamento em `atlas-metadata.json`.

Critérios inspecionados: contorno corporal expressivo, shorts hachurados, mãos e pés legíveis; agachamento com pés apoiados; flexão com mãos/pés no chão e tronco alinhado; leg press com encosto, trilhos e pés sobre a plataforma. A geração tem pequenas variações de contorno entre quadros; a revisão visual não é validação biomecânica profissional.

Os três IDs de `src/data/illustrationPilots.ts` foram aprovados pelo usuário e preservados. Em 15/10/2026, ele autorizou a expansão para os demais exercícios e figuras musculares; essa etapa está documentada em `docs/media/catalog/` e `docs/superpowers/plans/2026-10-15-expansao-personagem.md`. As artes ficam locais e entram no precache PWA. Não há mídia externa ou pedidos a um serviço de imagem durante o uso do aplicativo.
