# Mídias do WinFit

As 78 demonstrações e as duas figuras anatômicas foram criadas para o WinFit com a ferramenta integrada de geração de imagens em 15/10/2026. São ilustrações originais geradas por IA, em tinta cinza, com fundo branco e roupas hachuradas. Não foram extraídas do BetterMe nem de bancos de imagem.

A imagem enviada pelo usuário orientou características gerais de estilo. Ela não foi incorporada, recortada, vetorizada ou usada para remover marca-d'água. As novas mídias não têm arquivos de terceiros para atribuir. Esse registro documenta a origem; não faz uma promessa de exclusividade autoral sobre conteúdo gerado por IA.

Os três exercícios inicialmente aprovados — agachamento corporal, flexão e leg press — estão em `public/media/pilots/`, com fontes e prompts em `docs/media/pilots/`. Os outros 75 ficam em `public/media/catalog/`. Seus briefings, prompts completos, fontes PNG, revisões visuais e seleção de quadros estão em `docs/media/catalog/`. Os PNGs originais da ferramenta também foram preservados. As fontes anatômicas estão em `docs/media/anatomy/` e as versões de produção em `public/media/anatomy/`.

As animações trocam quadros de um atlas WebP local, sem deformar o desenho. Começam mediante ação do usuário e permitem pausa. As quatro pranchas usam uma posição estática, com indicação de sustentação em segundos. As instruções textuais continuam disponíveis. Os arquivos de produção entram no precache do aplicativo; a exibição não depende de um serviço externo.

A revisão visual verifica identidade, apoios, membros, equipamento e ordem das poses. Quadros incorretos foram excluídos ou regenerados, com as decisões registradas nos relatórios. `review-final.json` consolida os 75 exercícios novos e os hashes das fontes revistas. As ilustrações e máquinas são esquemáticas; a revisão e os testes não constituem validação biomecânica profissional. Nos movimentos unilaterais, a sequência mostra um lado; repetir no outro conforme as instruções.

Os desenhos vetoriais anteriores permanecem no código como legado, mas o catálogo completo usa as novas artes. Para substituir por filmagens, usar gravações próprias com autorização das pessoas retratadas ou mídia licenciada para uso no aplicativo, documentando autor, origem, licença e atribuição exigida.

## Pump House / Free Fitness App UI Kit — 27/10/2026

Fonte: [Free Fitness App Ui Kit, publicado por Figma Pro (@uifreebies)](https://www.figma.com/community/file/1091263687486055207/free-fitness-app-ui-kit). A página da comunidade indica [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Cópia aberta na conta do usuário: [arquivo Figma](https://www.figma.com/design/aRxadQrXj8QamZ0ndnClV1/Free-Fitness-App-Ui-Kit--Community-).

Arquivo conferido via integração oficial: página Cover e Page 2, com 48 quadros de telas móveis (incluindo variações/estados). Isso não significa 48 fluxos únicos nem uma biblioteca independente de componentes.

Incorporados quatro SVGs originais, exportados via Figma e guardados em `public/media/pump-house/`: dumbbell.svg (Home/Home, nó 202:10992), heart.svg, play.svg e award.svg (Appbar, nó 202:11072). Dimensões e paths preservados; filtros CSS adaptam a apresentação quando necessário. Elementos são decorativos, com controles rotulados em texto. Atribuição acessível no Perfil. O arquivo fonte e a licença estão ligados acima.

Padrões de cartões, navegação arredondada e destaque de progresso foram adaptados a React/CSS e à paleta roxa WinFit. A grade 2×2, os destinos e os dados reais do produto foram preservados. Fonte Geist local continua em uso; Circular Std não foi baixada nem incorporada. Fotos de modelos, avatares, logos e imagens de terceiros presentes no template não foram importados. As ilustrações de exercícios e bem-estar continuam sendo as mídias próprias já documentadas.

Não há URLs temporárias do Figma no código em execução; os quatro arquivos entram no precache da PWA.

## Revisão de movimento — 27/10/2026

As sequências de exercícios em `public/media/motion/` derivam das ilustrações originais locais do WinFit. Cada repetição contém64quadros calculados localmente com RIFE4.6; não são vídeos externos nem fotos de banco. Fontes originais mantidas. `docs/media/catalog/motion-sources/` contém correções produzidas com a ferramenta integrada de geração de imagens para dead bug, crucifixo e puxada. Briefings: preservar personagem/traço, seis células isoladas com margens, corpo/aparelho/câmera consistentes e movimento específico de cada exercício. Variantes rejeitadas não entram no produto.

Processamento/reprodução: `scripts/prepare-motion-art.mjs`, `docs/media/catalog/motion-anchors.json` e `motion-packing.json`. Ferramenta local de interpolação: [RIFE NCNN Vulkan, distribuição oficial](https://github.com/nihui/rife-ncnn-vulkan), modelo4.6 incluído na distribuição20221029, código MIT. A ferramenta/modelo não são distribuídos no aplicativo; o aplicativo usa apenas os atlas WebP produzidos. Arte corrigida com imagegen integrado; intermediários calculados localmente.
