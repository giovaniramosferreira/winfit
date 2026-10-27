# Auditoria independente dos sprites — 27/10/2026

**Estado final:**78/78artes liberadas no escopo visual inspecionado (74 sequências com64quadros e4sustentações estáticas). Nenhuma falha grosseira conhecida aberta após os retestes; ver última seção. Os diagnósticos abaixo preservam as etapas anteriores e não descrevem necessariamente o arquivo final.

## Escopo e método

Inventário completo: **78 artes**, sendo **74 sequências animadas e4 sustentações estáticas**. Revistos todos os seis quadros publicados de cada sequência, em13 pranchas de contato; depois percorridos os13 lotes no navegador IAB em reprodução, com capturas em momentos distintos do ciclo. A revisão temporal é feita por capturas de fases, não por julgamento de um vídeo contínuo; a inspeção de todos os quadros complementa esse limite. Nenhum registro do usuário foi alterado.

Estado deste documento: **diagnóstico inicial, anterior à nova interpolação**. Não constitui aprovação dos sprites novos.

## Causas estruturais

- O renderer alterna apenas6poses a cada0,5–0,67s; alguns atlas repetem poses e oferecem só3 posições reais.
- Quase todo catálogo usa alinhamento por tinta, recentralizando horizontalmente e levando maxY ao mesmo chão em cada quadro. Ao movimentar braços/pernas, a caixa muda e equipamento inteiro desliza.
- Puxada/crossover têm fragmentos na fronteira entre as linhas do atlas, que contam como tinta e causam salto vertical de33–37px no sprite empacotado.
- Algumas fontes também variam perspectiva/contorno de equipamentos; translação sozinha não resolve, em especial crucifixo com halteres.

## Recomendações de correção

Interpolação precisa criar intermediários compensados por movimento, preservando um único contorno; crossfade produz fantasma e não atende. Estabilizar só estrutura fixa por região de referência; cabos, pilhas, rolos, alavancas, plataformas e cargas móveis devem continuar se movendo. Regenerar fonte com membro cortado ou mudança de câmera. Quatro pranchas estáticas permanecem sem animação, como sustentação.

Arquivo de âncoras: `docs/media/catalog/motion-anchors.json`. Contém regiões normalizadas de33 estruturas fixas (32catálogo+leg-presspiloto). Coordenadas são diagnóstico visual; o registro deve validar correspondência e rejeitar erro antes de publicar. Não são máscaras de congelamento nem autorização para travar pilhas/cargas.

## Checklist por arte

Índices de quadros abaixo começam em0 e se referem à fonte selecionada. Todas as linhas tiveram inspeção de quadros e foram abertas em reprodução no lote indicado; sustentações confirmadas sem movimento.

| # / lote | Arte | Fonte/poses | Diagnóstico inicial |
|---|---|---|---|
| 1 / 1 | agachamento-corporal | 6 poses (0,1,2,3,4,5) | Descida/retorno coerentes; pés pequenos saltos. Faltam poses intermediárias. |
| 2 / 1 | flexao | 6 poses (0,1,2,3,4,5) | Descida coerente; mãos/pés variam pouco no desenho. Faltam poses intermediárias. |
| 3 / 1 | leg-press | 6 poses (0,1,2,3,4,5) | Alavanca/plataforma/pesos devem mover; base precisa permanecer fixa. Leve oscilação da base. |
| 4 / 1 | flexao-joelhos | 6 poses (0,1,2,3,4,5) | Joelhos/mãos são apoio; há pequenas mudanças de contorno. Ciclo coerente. |
| 5 / 1 | prancha | 1 estática | Sustentação estática íntegra. Manter sem animação. |
| 6 / 1 | prancha-joelhos | 1 estática | Sustentação estática íntegra. Manter sem animação. |
| 7 / 2 | prancha-lateral | 1 estática | Sustentação estática íntegra. Manter sem animação. |
| 8 / 2 | prancha-lateral-joelhos | 1 estática | Sustentação estática íntegra. Manter sem animação. |
| 9 / 2 | ponte-gluteo | 6 poses (0,1,2,3,4,5) | Pés e ombros são apoio; não registrar pelo quadril móvel. |
| 10 / 2 | ponte-unilateral | 6 poses (0,1,2,3,4,5) | Pé apoiado/ombros fixos; perna elevada e quadril movem. |
| 11 / 2 | puxada-prona-solo | 6 poses (0,1,2,3,4,5) | Mãos deslocam em arco; torso/apoiado não deve deslizar. |
| 12 / 2 | avanco-corporal | 6 poses (0,1,2,3,4,5) | Passada muda apoio; não estabilizar todos os pés em uma só coordenada. |
| 13 / 3 | dead-bug | 6 poses (0,1,2,3,4,5) | CRÍTICO: perna estendida cortada na borda; fragmentos de membros vizinhos nas laterais. Regenerar com margem. |
| 14 / 3 | abdominal-infra | 6 poses (0,1,2,3,4,5) | Fragmento isolado de tinta abaixo do quadro0. Corpo inteiro nos outros; registrar ombros/mãos. |
| 15 / 3 | abdominal-supra | 6 poses (0,1,2,3,4,5) | Movimento coerente; pés são apoio e tronco flexiona. |
| 16 / 3 | supino-reto-barra | 6 poses (0,1,2,3,4,5) | Banco/base oscilam levemente; barra/anilhas DEVEM mover, banco não. |
| 17 / 3 | supino-halteres | 6 poses (0,1,2,3,4,5) | Banco/base oscilam levemente; halteres DEVEM mover, banco não. |
| 18 / 3 | supino-maquina | 6 poses (0,1,2,3,4,5) | Torre/assento fixos; alavanca/pilha podem mover. Leve drift do enquadramento. |
| 19 / 4 | flexao-inclinada | 6 poses (0,1,2,3,4,5) | Banco/pés devem ficar fixos; pequeno drift do banco/contorno entre poses. |
| 20 / 4 | flexao-declinada | 6 poses (0,1,2,3,4,5) | Banco/mãos devem ficar fixos; banco varia discretamente em posição/contorno. |
| 21 / 4 | supino-elastico | 6 poses (0,1,2,3,4,5) | Pés fixos; braços/elástico movem. Sem defeito grosseiro adicional. |
| 22 / 4 | desenvolvimento-halteres | 3 poses (0,1,2,2,1,0) | Só3poses únicas selecionadas (0,1,2,2,1,0), com pausas duplicadas. Gerar intermediários reais. |
| 23 / 4 | desenvolvimento-maquina | 6 poses (0,1,2,3,4,5) | Torre/base/assento fixos; top lever moves. Registro precisa excluir alavanca e pilha. |
| 24 / 4 | desenvolvimento-barra | 6 poses (0,1,2,3,4,5) | Barra sobe junto com braços; pés fixos. Sem defeito grosseiro adicional. |
| 25 / 5 | pike-pushup | 6 poses (0,1,2,3,4,5) | Mãos/pés apoiados; pequeno deslocamento de enquadramento. |
| 26 / 5 | desenvolvimento-elastico | 6 poses (0,1,2,3,4,5) | Pés fixos; faixa estica com braços. Sem defeito grosseiro adicional. |
| 27 / 5 | remada-curvada-barra | 6 poses (0,1,2,3,4,5) | Barra deve mover; torso/pés oscilam pouco nos contornos. |
| 28 / 5 | remada-serrote | 6 poses (0,1,2,3,4,5) | Banco fixo, halter móvel. Mão/joelho de apoio devem permanecer no banco. |
| 29 / 5 | remada-maquina | 6 poses (0,1,2,3,4,5) | Base/assento fixos, alavanca/anilhas móveis; estrutura muda discretamente contorno. |
| 30 / 5 | remada-baixa-polia | 6 poses (0,1,2,3,4,5) | Torre/banco fixos; pilha/pegador movem. Leve drift de recorte. |
| 31 / 6 | remada-elastico | 6 poses (0,1,2,3,4,5) | Pés fixos; faixa/braços movem. Sem defeito grosseiro adicional. |
| 32 / 6 | remada-toalha | 3 poses (0,1,2,2,1,0) | Só3poses únicas selecionadas; porta deve permanecer fixa; toalha/corpo movem. |
| 33 / 6 | puxada-polia | 6 poses (0,1,2,3,4,5) | Forte salto vertical0–2→3–5. InkBounds0–2 têm maxY511 contaminante e3–5 maxY472, criando top19→52. Torre precisa registro; fonte principal mantém torre. |
| 34 / 6 | barra-fixa | 6 poses (0,1,2,3,4,5) | Postes/barra fixa oscilam discretamente; corpo deve subir. Não registrar pés. |
| 35 / 6 | puxada-elastico | 6 poses (0,1,2,3,4,5) | Pequenos riscos isolados no chão; faixa/corpo coerentes, ajoelhado fixo. |
| 36 / 6 | agachamento-barra | 6 poses (0,1,2,3,4,5) | Barra acompanha costas; pés fixos. Pequenas variações de contorno. |
| 37 / 7 | agachamento-goblet | 6 poses (0,1,2,3,4,5) | Halter e mãos juntos; pés fixos. Sem defeito grosseiro adicional. |
| 38 / 7 | agachamento-kettlebell | 6 poses (0,1,2,3,4,5) | Kettlebell e mãos juntos; pés fixos. Sem defeito grosseiro adicional. |
| 39 / 7 | agachamento-elastico | 6 poses (0,1,2,3,4,5) | Pés fixos; faixa/corpo descem juntos. Sem defeito grosseiro adicional. |
| 40 / 7 | terra-romeno-barra | 6 poses (0,1,2,3,4,5) | Barra acompanha mãos; pés fixos. Sem defeito grosseiro adicional. |
| 41 / 7 | terra-romeno-halteres | 6 poses (0,1,2,3,4,5) | Halteres acompanham mãos; pés fixos. Sem defeito grosseiro adicional. |
| 42 / 7 | hip-thrust-barra | 6 poses (0,1,2,3,4,5) | Banco fixo, barra/quadril móveis. Banco varia em contorno/perspectiva discretamente. |
| 43 / 8 | swing-kettlebell | 5 poses (0,1,2,2,3,4) | 5poses selecionadas com repetição de2; carga ligada à mão, arco coerente. Precisa intermediários. |
| 44 / 8 | terra-romeno-elastico | 6 poses (0,1,2,3,4,5) | Ciclo de poses coerente; faltam intermediários. Nenhuma anomalia grosseira adicional detectada. |
| 45 / 8 | afundo-halteres | 6 poses (0,1,2,3,4,5) | Passada muda apoio; não travar todos pés. Cargas ligadas às mãos. |
| 46 / 8 | bulgaro | 4 poses (1,2,3,3,4,1) | Banco deriva lateralmente; seleção1,2,3,3,4,1. Pé traseiro apoiado no banco deve ser âncora contextual. |
| 47 / 8 | step-up | 3 poses (0,1,2,2,1,0) | Só3poses únicas0,1,2; banquinho muda contorno/perspectiva; câmera fixa e base fixada necessárias. |
| 48 / 8 | crucifixo-halteres | 6 poses (0,1,2,3,4,5) | CRÍTICO: banco/corpo mudam orientação/perspectiva; já usa source. Quadro3 concentra mudança. Regeneração recomendada. |
| 49 / 9 | crossover-polia | 6 poses (0,1,2,3,4,5) | Forte salto vertical entre linhas fonte. InkBounds0–2 maxY511 (contaminação),3–5 maxY454/455; torre salta≈36px por alinhamento. |
| 50 / 9 | crucifixo-elastico | 6 poses (0,1,2,3,4,5) | Pés fixos; braços/faixa movem. Sem defeito grosseiro adicional. |
| 51 / 9 | elevacao-lateral-halteres | 6 poses (0,1,2,3,4,5) | Halteres acompanham mãos; pés fixos. Sem defeito grosseiro adicional. |
| 52 / 9 | elevacao-lateral-polia | 6 poses (0,1,2,3,4,5) | Torre deve ficar fixa; carga/cabo movem. Drift lateral de recorte. |
| 53 / 9 | elevacao-lateral-elastico | 6 poses (0,1,2,3,4,5) | Pés fixos/faixa estica. Sem defeito grosseiro adicional. |
| 54 / 9 | crucifixo-invertido-halteres | 6 poses (0,1,2,3,4,5) | Pés/torso relativamente fixos; braços/halteres abrem. Sem defeito grosseiro adicional. |
| 55 / 10 | face-pull | 6 poses (0,1,2,3,4,5) | Torre fixa; cabo/pegador/pilha móveis. Drift horizontal do enquadramento. |
| 56 / 10 | band-pull-apart | 6 poses (0,1,2,3,4,5) | Pés fixos; faixa/braços abrem. Sem defeito grosseiro adicional. |
| 57 / 10 | rosca-direta-barra | 6 poses (0,1,2,3,4,5) | Barra/anilhas devem mover; pés fixos. |
| 58 / 10 | rosca-alternada | 6 poses (0,1,2,3,4,5) | Dois braços alternam; ciclo deve fechar sem trocar repentinamente lado da carga. |
| 59 / 10 | rosca-polia | 6 poses (0,1,2,3,4,5) | Torre fixa/cabo móvel; leve drift lateral da torre. |
| 60 / 10 | rosca-elastico | 6 poses (0,1,2,3,4,5) | Faixa/punhos móveis; pés fixos. |
| 61 / 11 | rosca-martelo | 6 poses (0,1,2,3,4,5) | Halteres ligados às mãos; pés fixos. |
| 62 / 11 | triceps-polia | 6 poses (0,1,2,3,4,5) | Torre fixa; cabo/pegador/pilha móveis. Leve drift do enquadramento. |
| 63 / 11 | triceps-frances-halter | 3 poses (0,0,1,1,2,2) | Só3poses únicas0,1,2 com duplicação; retorno precisa sequência completa suave. |
| 64 / 11 | triceps-banco | 6 poses (0,1,2,3,4,5) | Banco fixo e calcanhares apoiados; quadril desce. Leve drift do banco. |
| 65 / 11 | flexao-diamante | 6 poses (0,1,2,3,4,5) | Mãos/ponteiras dos pés são apoios; contorno varia discretamente. |
| 66 / 11 | triceps-elastico | 6 poses (0,1,2,3,4,5) | Âncora superior fora de quadro, faixa/braços móveis; pés fixos. |
| 67 / 12 | mesa-flexora | 6 poses (0,1,2,3,4,5) | Banco/base/torre devem ficar fixos; rolo e pilha movem. Fonte3–5 desloca≈15px; quadro3 muda perspectiva/base. |
| 68 / 12 | flexora-deslizante | 6 poses (0,1,2,3,4,5) | Calcanhares/discos deslizam por definição; ombros são apoio; não estabilizar discos. |
| 69 / 12 | flexora-elastico | 6 poses (0,1,2,3,4,5) | Poste de apoio fixo, perna/faixa móveis; pequeno drift. |
| 70 / 12 | cadeira-extensora | 6 poses (0,1,2,3,4,5) | Assento/torre/base fixos; alavanca/rolo e pilha devem mover. Base/contorno variam discretamente. |
| 71 / 12 | abducao-maquina | 6 poses (0,1,2,3,4,5) | Assento/torre fixos; apoios laterais/pernas/pilha móveis. Contorno/base variam discretamente. |
| 72 / 12 | abducao-elastico | 6 poses (0,1,2,3,4,5) | Base é posição de agachamento; joelhos/pés abrem; não travar cada pé artificialmente. |
| 73 / 13 | coice-polia | 6 poses (0,1,2,3,4,5) | Torre precisa ficar fixa: grande deslocamento lateral de recorte ao abrir a perna. |
| 74 / 13 | panturrilha-halteres | 6 poses (0,1,2,3,4,5) | Degrau fixo; corpo/carga sobem e descem. Não registrar pela sola/calcanhar móvel. |
| 75 / 13 | panturrilha-maquina | 6 poses (0,1,2,3,4,5) | Base/torre fixas, apoio dos ombros/pilha móveis. Leve drift de enquadramento. |
| 76 / 13 | panturrilha-corporal | 6 poses (0,1,2,3,4,5) | Poste/degrau fixos, corpo sobe. Leve drift de recorte. |
| 77 / 13 | pallof-press | 6 poses (0,1,2,3,4,5) | Poste de ancoragem fixo; faixa/mãos movem. Drift lateral de recorte. |
| 78 / 13 | elevacao-pernas-barra | 3 poses (1,1,2,2,3,3) | Só3poses selecionadas1,2,3; barra/postes fixos, corpo/pernas móveis. Pequeno drift da estrutura. |

## Evidências

Pranchas de contato originais: `/private/tmp/sprite-audit-0.jpg` até `sprite-audit-12.jpg`. Pranchas de âncoras com grade de10%: `/private/tmp/anchors-0.png` até `anchors-3.png`. Revisor temporário `public/qa-sprite-review.html`, controlado por cua_repl, sem acesso ao estado do aplicativo. Deve ser removido ao fim da validação.

Piloto novo `/private/tmp/winfit-motion-test/rife-gpu.png` inspecionado: silhueta única e intermediário limpo nesse frame. Isso não aprova todos os novos quadros ou outros movimentos; reteste completo pendente após geração.

## Primeira revisão da interpolação — lote piloto (versão2)

Três artes foram abertas nas páginas reais, com Reprodução/Pausa, além de inspecionar64quadros de cada uma emprancha8×8:

- **Agachamento corporal:** intermediários com silhueta única, sem fantasma grosseiro no contato completo e fases de reprodução observadas. Base para expandir o método, sujeito a reteste da versão final.
- **Puxada-polia: reprovada nesta versão.** A torre perdeu o grande salto vertical anterior, mas os intervalos com mudança de cabeça/torso produzem contornos duplos. Frame32 tem duas cabeças/ombros e cabo duplicado; frame23 braço/barra duplicados. Evidência `/private/tmp/pull-motion-32.png`. Necessária fonte coerente, não aprovar a saída só porque há64quadros.
- **Crossover-polia: ajuste necessário.** Amostras12/16/20/28/32 sem fantasma forte, mas a parte superior das torres muda altura e chega a cortar emy0 nos quadros28/32; margem insuficiente após registro. Evidência `/private/tmp/cross-motion-28.png`.

O log de registro também revelou correspondências ambíguas em hastes lisas (face-pull dy+26/-16; rosca-polia dy17), mesmo com erro numérico baixo. Oito regiões de referência foram refinadas para incluir cantos/junções/olhais/polias de posição fixa. Coordenador avisado para regularizar deslocamentos e impedir cortes, antes do processamento completo. Reteste da versão3 ainda pendente.

## Revisão completa da versão4

Os78 itens foram percorridos novamente em reprodução no navegador, em13lotes, usando o módulo real `EXERCISE_ILLUSTRATIONS` e o gerador real `spriteMotion`. Sequências novas têm64quadros; as4 sustentações continuam estáticas. Foram inspecionadas10amostras por sequência, priorizando os pontos médios entre poses originais e o fechamento do ciclo; artefatos suspeitos foram ampliados na resolução integral do quadro. Este método cobre100% das artes, com amostragem dos novos intermediários, e não significa inspeção manual individual dos4.736quadros novos.

Resultado intermediário: **66 artes sem falha grosseira no escopo inspecionado (62 animadas+4 estáticas);12 aguardam correção/reteste.** Crossover deixou de cortar o topo após ampliar o canvas antes do registro. Não foram detectados novos saltos grandes de bancos/torres nos outros itens liberados. Variações pequenas de contorno do desenho permanecem; alavancas, pilhas, cabos e cargas continuam se movendo por função do exercício.

Novos problemas detectados durante esta revisão, repassados ao implementador:

- Leg-press: normalização quadrada com `cover` cortava as laterais do piloto rectangular.
- Swing: intervalo grande fazia braço/carga desaparecerem; step-up: pé desconectado emframe22.
- Flexora com elástico: dois pés emframe33.
- Rosca martelo: antebraço/halter duplicados emframe33.
- Pallof: mãos/braços em fantasma emframe5.
- Rosca direta com barra: cabeça/torso duplicados no retorno40–43; flag só apareceu na reprodução e inspeção ampliada, não na primeira amostragem.
- Dead-bug: fonte regenerada passou a incluir joelhos intermediários, mas células2e5 cortaram ponta de mão; recomendadas poses0,1,3,4com translações manuais pela pelve e ida/volta.

Evidências: `/private/tmp/final-samples-0.jpg` até `final-samples-12.jpg`; `/private/tmp/suspect-swing-kettlebell.png`, `suspect-step-up.png`, `suspect-flexora-elastico.png`, `suspect-rosca-martelo.png`, `suspect-pallof-press.png`; `/private/tmp/rosca-direta-return.png`. Os arquivos problemáticos estão sendo substituídos e essas evidências representam versões anteriores, não necessariamente o conteúdo publicado final.

### Estado por arte após a passagem completa v4

| Arte | Estado |
|---|---|
| agachamento-corporal | Sem falha grosseira nas amostras e reprodução observadas |
| flexao | Sem falha grosseira nas amostras e reprodução observadas |
| leg-press | Aguarda correção/reteste |
| flexao-joelhos | Sem falha grosseira nas amostras e reprodução observadas |
| prancha | Sustentação estática íntegra |
| prancha-joelhos | Sustentação estática íntegra |
| prancha-lateral | Sustentação estática íntegra |
| prancha-lateral-joelhos | Sustentação estática íntegra |
| ponte-gluteo | Sem falha grosseira nas amostras e reprodução observadas |
| ponte-unilateral | Sem falha grosseira nas amostras e reprodução observadas |
| puxada-prona-solo | Sem falha grosseira nas amostras e reprodução observadas |
| avanco-corporal | Sem falha grosseira nas amostras e reprodução observadas |
| dead-bug | Aguarda correção/reteste |
| abdominal-infra | Aguarda correção/reteste |
| abdominal-supra | Sem falha grosseira nas amostras e reprodução observadas |
| supino-reto-barra | Sem falha grosseira nas amostras e reprodução observadas |
| supino-halteres | Sem falha grosseira nas amostras e reprodução observadas |
| supino-maquina | Sem falha grosseira nas amostras e reprodução observadas |
| flexao-inclinada | Sem falha grosseira nas amostras e reprodução observadas |
| flexao-declinada | Sem falha grosseira nas amostras e reprodução observadas |
| supino-elastico | Sem falha grosseira nas amostras e reprodução observadas |
| desenvolvimento-halteres | Sem falha grosseira nas amostras e reprodução observadas |
| desenvolvimento-maquina | Sem falha grosseira nas amostras e reprodução observadas |
| desenvolvimento-barra | Sem falha grosseira nas amostras e reprodução observadas |
| pike-pushup | Sem falha grosseira nas amostras e reprodução observadas |
| desenvolvimento-elastico | Sem falha grosseira nas amostras e reprodução observadas |
| remada-curvada-barra | Sem falha grosseira nas amostras e reprodução observadas |
| remada-serrote | Sem falha grosseira nas amostras e reprodução observadas |
| remada-maquina | Sem falha grosseira nas amostras e reprodução observadas |
| remada-baixa-polia | Sem falha grosseira nas amostras e reprodução observadas |
| remada-elastico | Sem falha grosseira nas amostras e reprodução observadas |
| remada-toalha | Sem falha grosseira nas amostras e reprodução observadas |
| puxada-polia | Aguarda correção/reteste |
| barra-fixa | Sem falha grosseira nas amostras e reprodução observadas |
| puxada-elastico | Aguarda correção/reteste |
| agachamento-barra | Sem falha grosseira nas amostras e reprodução observadas |
| agachamento-goblet | Sem falha grosseira nas amostras e reprodução observadas |
| agachamento-kettlebell | Sem falha grosseira nas amostras e reprodução observadas |
| agachamento-elastico | Sem falha grosseira nas amostras e reprodução observadas |
| terra-romeno-barra | Sem falha grosseira nas amostras e reprodução observadas |
| terra-romeno-halteres | Sem falha grosseira nas amostras e reprodução observadas |
| hip-thrust-barra | Sem falha grosseira nas amostras e reprodução observadas |
| swing-kettlebell | Aguarda correção/reteste |
| terra-romeno-elastico | Sem falha grosseira nas amostras e reprodução observadas |
| afundo-halteres | Sem falha grosseira nas amostras e reprodução observadas |
| bulgaro | Sem falha grosseira nas amostras e reprodução observadas |
| step-up | Aguarda correção/reteste |
| crucifixo-halteres | Aguarda correção/reteste |
| crossover-polia | Sem falha grosseira nas amostras e reprodução observadas |
| crucifixo-elastico | Sem falha grosseira nas amostras e reprodução observadas |
| elevacao-lateral-halteres | Sem falha grosseira nas amostras e reprodução observadas |
| elevacao-lateral-polia | Sem falha grosseira nas amostras e reprodução observadas |
| elevacao-lateral-elastico | Sem falha grosseira nas amostras e reprodução observadas |
| crucifixo-invertido-halteres | Sem falha grosseira nas amostras e reprodução observadas |
| face-pull | Sem falha grosseira nas amostras e reprodução observadas |
| band-pull-apart | Sem falha grosseira nas amostras e reprodução observadas |
| rosca-direta-barra | Aguarda correção/reteste |
| rosca-alternada | Sem falha grosseira nas amostras e reprodução observadas |
| rosca-polia | Sem falha grosseira nas amostras e reprodução observadas |
| rosca-elastico | Sem falha grosseira nas amostras e reprodução observadas |
| rosca-martelo | Aguarda correção/reteste |
| triceps-polia | Sem falha grosseira nas amostras e reprodução observadas |
| triceps-frances-halter | Sem falha grosseira nas amostras e reprodução observadas |
| triceps-banco | Sem falha grosseira nas amostras e reprodução observadas |
| flexao-diamante | Sem falha grosseira nas amostras e reprodução observadas |
| triceps-elastico | Sem falha grosseira nas amostras e reprodução observadas |
| mesa-flexora | Sem falha grosseira nas amostras e reprodução observadas |
| flexora-deslizante | Sem falha grosseira nas amostras e reprodução observadas |
| flexora-elastico | Aguarda correção/reteste |
| cadeira-extensora | Sem falha grosseira nas amostras e reprodução observadas |
| abducao-maquina | Sem falha grosseira nas amostras e reprodução observadas |
| abducao-elastico | Sem falha grosseira nas amostras e reprodução observadas |
| coice-polia | Sem falha grosseira nas amostras e reprodução observadas |
| panturrilha-halteres | Sem falha grosseira nas amostras e reprodução observadas |
| panturrilha-maquina | Sem falha grosseira nas amostras e reprodução observadas |
| panturrilha-corporal | Sem falha grosseira nas amostras e reprodução observadas |
| pallof-press | Aguarda correção/reteste |
| elevacao-pernas-barra | Sem falha grosseira nas amostras e reprodução observadas |

## Reteste dos11 itens corrigidos

Foram geradas e inspecionadas pranchas com todos64quadros desses11itens e ampliados os quadros que tinham apresentado anomalias. Os11 também foram percorridos no navegador novamente, em2lotes, com o renderer e os dados reais.

**10 liberados:** leg-press, puxada-polia, crucifixo-halteres, abdominal-infra, puxada-elastico, swing-kettlebell, flexora-elastico, rosca-martelo, pallof-press e rosca-direta-barra. Campo de visão do leg-press agora inclui toda a estrutura; fontes novas e ordens de ida/volta eliminaram os grandes fantasmas observados; os fragmentos isolados de chão foram removidos.

**Dead-bug continua reprovado:** emframe5, a perna móvel quase desaparece ao emergir da sobreposição com a outra perna. Evidência `/private/tmp/retest-dead-bug-5.png`. A fonte precisa de uma pose intermediária em que ambas as pernas já possuam contorno separado antes de estender. Step-up também continua pendente, com nova fonte em construção.

Resultado atual: **76/78 artes liberadas**, sendo72sequências e4sustentações;2sequências pendentes. “Liberada” significa ausência das falhas grosseiras de corte, membro/carga ausente ou equipamento deslocando no material efetivamente inspecionado. Pequenas variações de contorno próprias do desenho e da interpolação permanecem; não é declaração de perfeição anatômica/quadro a quadro.

## Reteste específico dos dois últimos — ainda pendentes

A pose inicial adicional do dead-bug resolveu o desaparecimento da perna emframe5. Porém a transição do braço vertical para45° ainda duplica/apaga parte da mão emframe10 (`/private/tmp/last-dead-bug-10.png`). Step-up ganhou poses intermediárias e banco estável, mas emframe15 permanece um pé livre fantasma atrás da perna de apoio, enquanto outro já está à frente (`/private/tmp/last-step-up-15.png`). Ambos permanecem sem aprovação nesta etapa. As poses íntegras de26 no step-up e5 no dead-bug não bastam para aprovar o ciclo inteiro.

## Resultado final —78/78 artes revisadas e liberadas

As duas últimas sequências foram retestadas nos64quadros em pranchas completas, nos quadros antes reprovados ampliados à resolução integral e em reprodução no navegador com capturas de fases distintas.

- **Dead-bug:** poses adicionais do braço20°/35° e da perna separada antes de estender preservaram os contornos. Frames5e10 anteriormente reprovados agora exibem mãos e pernas íntegras; sem desaparecimento grosseiro nas amostras finais.
- **Step-up:** as novas poses mantêm o pé livre atrás/àdireita do apoio durante a subida. Frames15e26 agora têm um único pé livre conectado; banco permanece estável e apoio não troca abruptamente para uma pose de joelho elevado àfrente.

Veredito final: **78/78 artes liberadas** no escopo inspecionado, com74sequências de64quadros e4sustentações estáticas. As falhas grandes observadas e documentadas durante o trabalho foram corrigidas antes desta liberação. Pequenas variações de contorno/hachura próprias do desenho interpolado ainda existem; o resultado não é validação médica/anatômica nem promessa de perfeição de todos os pixels. A cobertura de100% é por arte: playback observado por capturas temporais e inspeção de quadros/amostras, com pranchas completas de64quadros para todos os itens corrigidos, não julgamento humano contínuo de um vídeo de cada pixel.

O ledger `docs/qa/sprite-review-ledger-2026-10-27.json` contém os78hashes SHA-256 e dimensões dos arquivos finais aprovados. Evidência final: `/private/tmp/winfit-sprites-final.png`.

### Acessibilidade e renderer

Revisão do renderer detectou e levou àcorreção da regra global de movimento reduzido que anulava a animação mesmo após clicar emReproduzir. Teste de navegador com componente real e cópia de CSS forçando apenas os mesmos blocos `prefers-reduced-motion:reduce` confirmou: inicialmente `sprite-8-8-64`,5s,paused,800%800%; clique explícito inicia e posição de fundo avança; novo clique pausa e conserva a mesma posição em outra leitura; sustentação conserva `animation-name:none`. A ferramenta IAB não ofereceu emulação dessa preferência, por isso o teste forçou as regras CSS em fixture, sem alterar as preferências do macOS.

`git diff --check` aprovado ao final da revisão. Testes gerais/build finais ficam com o coordenador após remover as fixtures. Todas as páginas/CSS/entrada React temporárias deste auditor foram removidas; navegador de teste liberado.

## Fechamento do coordenador

Após a liberação independente: `npm test` passou nas26suítes; TypeScript/Vite/PWA compilaram sem erros; `git diff --check` passou. Os78hashes do ledger foram conferidos novamente contra os arquivos finais. Nenhuma fixture de QA entrou no build. A página real do agachamento foi aberta no navegador interno com a nova demonstração em reprodução. Dados de treino não foram alterados.
