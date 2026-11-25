# AURAVIZ-75 — resultado da POC local

Execução: 2026-11-05T00:50:36.161Z. Branch: `codex/auraviz-75-local-vision-poc`.

**Decisão: go para o fluxo local de revisão/cálculo; no-go para usar este modelo como reconhecedor automático de refeições brasileiras ou como fonte nutricional.** A POC local foi validada no navegador conforme instrução do usuário em 04/11/2026, que dispensou o iPhone como requisito. A iniciativa de produção permanece separada desta POC. Nenhum deploy, sincronização de imagens ou fornecedor remoto foi ativado.

## Evidências executadas

- `npm test`: 33/33 suítes, incluindo 56.000 combinações do gerador e os novos testes de visão, catálogo, proveniência, quantidades inválidas, revisão, idempotência e virada de dia em São Paulo/UTC.
- `VITE_MEAL_VISION_POC=true npm run build` e `node scripts/test-meal-vision-build.mjs`: passaram; laboratório, modelo ONNX e WASM ficam fora do produto mesmo com a flag habilitada no build de produção.
- Chrome real em desktop, viewport de 390×844 com toque, fuso America/Sao_Paulo. Isso não é Safari nem iPhone físico. Runtime WASM real; nenhuma saída de visão simulada.
- 18 verificações de navegador passaram: Switching meals discards the previous photo draft; Model cannot load without explicit research acknowledgment; Non-food suggestions can be rejected without diary entries; Image cannot be analyzed before local opt-in; Loaded WASM model analyzes locally while offline; Changing candidates resets reference and confirmation; Analysis alone never saves food or nutrients; Repeated review of the same photo consumes once; Reviewed meal and daily total are rendered; Editing grams recalculates energy and macros; Reload preserves one meal and reference provenance; Deletion recalculates the day; Restoration does not duplicate the meal; Diary can hide calorie counting; Unknown catalog entry asks for manual input; Manual offline editing invalidates old calculated nutrients; No external image or analysis requests; No page errors.
- Revisão independente encontrou dois problemas: foto anterior preservada ao trocar refeição e confirmação preservada ao trocar alternativa. Ambos foram reproduzidos em RED no Chrome e corrigidos, com os casos incluídos na suíte final. TypeScript, regressões e build voltaram a passar.

## Medições nesta máquina

| Medida | Resultado |
|---|---|
| Modelo de pesquisa fp32 | 33.995.501 bytes (32.4 MiB) |
| Inicialização, incluindo leitura/verificação de hashes | 217.9 ms |
| Análise, mínimo / mediana / p95 / máximo, 24 imagens | 68.4 / 71.0 / 89.9 / 91.2 ms |
| Heap JS observado no navegador | 18.5–55.6 MiB; não é a memória total de WASM/processo |
| Memória total, energia, temperatura e pressão de memória no iPhone | Não medidos |
| Requisições HTTP a outras origens durante o ensaio | 0; bloqueadas pelo teste |
| Requisições/cobrança de inferência remota | 0 / 0; downloads de preparação e custo do dispositivo não incluídos |

Valores de uma execução, sem generalização para outros aparelhos. As latências incluem a decodificação do JPEG já sanitizado e a inferência local; excluem a seleção e a sanitização inicial da imagem. As métricas do desktop não comprovam desempenho do Safari.

## Resultados por imagem e itens visíveis

As 24 imagens têm licença e origem registradas individualmente no JSON. Anotações feitas pelo agente após inspeção visual da prancha e das legendas; não por um especialista ou pelas pessoas que prepararam os pratos. Ingredientes ocultos, consumo, peso e receitas continuam desconhecidos.

| Imagem | Itens visíveis esperados, sujeitos à confirmação | Alternativas do modelo, em ordem | Avaliação descritiva |
|---|---|---|---|
| cc-01 | arroz, legumes, folhas | fried_rice / risotto / tacos | Classe do prato compatível |
| cc-02 | arroz, camarões, molho | dumplings / hot_and_sour_soup / ramen | Classe do prato incompatível |
| cc-03 | arroz, camarões, algas | bibimbap / fried_rice / dumplings | Primeira classe errada; referência entre alternativas |
| cc-04 | ovo, arroz, legumes, acompanhamentos | bibimbap / fried_rice / huevos_rancheros | Classe do prato compatível |
| cc-05 | ovo, legumes, carne, arroz | bibimbap / spaghetti_bolognese / ramen | Classe do prato compatível |
| cc-06 | arroz, legumes, folhas, carne | bibimbap / seaweed_salad / ramen | Classe do prato compatível |
| cc-07 | carne, purê ou acompanhamento claro | chocolate_cake / prime_rib / steak | Primeira classe errada; referência entre alternativas |
| cc-08 | carne, milho, batatas, acompanhamento | steak / baby_back_ribs / beef_tartare | Classe do prato compatível |
| cc-09 | carne, batatas fritas, cogumelos, tomate | steak / filet_mignon / hamburger | Classe do prato compatível |
| cc-10 | folhas, beterraba, legumes, frutas | beet_salad / greek_salad / tuna_tartare | Classe do prato compatível |
| cc-11 | folhas, tomate, beterraba, queijo | caprese_salad / beef_carpaccio / greek_salad | Classe do prato incompatível |
| cc-12 | beterraba, folhas, cítrico, queijo | beet_salad / foie_gras / caprese_salad | Classe do prato compatível |
| cc-13 | carne empanada, folhas ou repolho | takoyaki / bread_pudding / waffles | Classe do prato incompatível |
| cc-14 | arroz, carne, ovo, folhas, acompanhamentos | filet_mignon / peking_duck / bibimbap | Classe do prato incompatível |
| cc-15 | carne na grelha | pork_chop / foie_gras / steak | Classe do prato compatível |
| cc-16 | folhas, frango, molho | caesar_salad / greek_salad / beet_salad | Classe do prato compatível |
| cc-17 | frango, folhas, molho | caesar_salad / greek_salad / chicken_quesadilla | Classe do prato compatível |
| cc-18 | camarões, folhas, queijo, molho | caesar_salad / beet_salad / greek_salad | Classe do prato compatível |
| cc-19 | rolinhos fritos, recheio | spring_rolls / lobster_roll_sandwich / bruschetta | Classe do prato compatível |
| cc-20 | rolinhos, legumes, grãos, acompanhamentos | frozen_yogurt / ice_cream / hot_dog | Classe do prato incompatível |
| cc-21 | Sem alimento | chocolate_cake / macarons / ice_cream | Erro: comida sugerida para paisagem |
| cc-22 | Sem alimento | chocolate_cake / chocolate_mousse / carrot_cake | Erro: comida sugerida para paisagem |
| cc-23 | feijão ou feijoada, arroz, carne, acompanhamentos | donuts / beignets / oysters | Erro/fora de catálogo: não identifica o prato brasileiro |
| cc-24 | arroz, feijão, farofa | chicken_curry / spaghetti_bolognese / frozen_yogurt | Erro/fora de catálogo: não identifica o prato brasileiro |

Nas 20 fotos cuja classe esperada existe em Food-101, houve correspondência literal da primeira alternativa em 13 e presença da classe entre três alternativas em 15. Isso é uma contagem descritiva desta seleção pequena, com rótulos parcialmente apoiados em legendas; não é precisão estatística, nem validação nutricional. As alternativas são hipóteses concorrentes para o prato inteiro e não devem ser somadas como ingredientes identificados.

O modelo não tem saída de segmentação ou inventário de ingredientes. Portanto, arroz, feijão, farofa, carnes e acompanhamentos da mesma foto não recebem acerto por item com base no nome genérico do prato: a cobertura por ingrediente é **não suportada**. A feijoada e o prato com arroz/feijão/farofa não têm classe adequada e foram classificados incorretamente. Ambas as paisagens receberam classes de comida. O laboratório permite recusar tudo e continuar manualmente.

Os hashes/attribution/links de licença estão em [meal-vision-poc-results.json](./meal-vision-poc-results.json). Duas fotos suplementares não foram baixadas devido a HTTP 429 e não entram na contagem; o relatório conserva as falhas, sem tentar burlar o limite.

## Evidência visual do fluxo

[Análise real da foto pública](./artifacts/meal-vision-chromium-analysis.png) · [Refeição revisada salva e total diário](./artifacts/meal-vision-chromium-saved.png). A captura mostra quantidade hipotética de teste, não peso inferido da imagem.

## Porções e cálculo

O adaptador deste modelo retorna `portionHypothesis: null`. Uma única foto não fornece escala/peso suficiente e o ramo de regressão do modelo foi deliberadamente descartado. Nenhuma foto da amostra possui peso medido: erro absoluto/percentual da porção são `null`, não zero. As porções de 150 g e 200 g do teste de interface são entradas hipotéticas para validar revisão e recálculo, não ground truth das fotos.

Exemplo aritmético testado: referência TACO-540, feijoada padronizada, 117 kcal por 100 g → 150 g = 175,5 kcal; correção para 200 g = 234 kcal. Proteína, carboidrato e gordura seguem a referência centesimal com gramas confirmadas. A mesma foto revisada duas vezes não duplica o item, e excluir/restaurar atualiza o total diário. Mudança manual de identidade invalida a estimativa derivada; itens sem valores continuam pendentes.


## Auditoria adicional de compatibilidade e falha de rede

WebKit de desktop: Playwright WebKit desktop 26.5, 390x844 touch emulation; NOT physical iPhone. 24 imagens, 18 verificações de fluxo, 0 requisições externas e 0 erros de página. Mediana 72.0 ms; p95 79.0 ms. Isso não mede Safari em iPhone.

O modo deste ensaio é explicitamente `http-isolation`: HTTP bloqueado após carregar o laboratório. Não equivale a modo avião nem a offline físico. Um reproducer mínimo separado mostrou que `setOffline(true)` neste WebKit quebra até `Blob.arrayBuffer()`, `File.arrayBuffer()`, FileReader e createImageBitmap em memória, enquanto imagem data: continua funcionando. A troca experimental de decodificador foi desfeita por não resolver a causa. Veja [operações Blob online/offline](./meal-vision-poc-webkit-blob.json); evidência do reproducer registrada.

Uma falha real de proteção foi corrigida: rejeição do import dinâmico do laboratório podia desmontar o editor. O teste `scripts/test-meal-vision-fallback-browser.cjs` bloqueia esse módulo e exige que o formulário manual continue visível e salve um item com kcal pendentes. Foi reproduzido antes e validado após a correção em Chrome e WebKit.

O Ollama disponível neste notebook tem somente um modelo de texto, sem capacidade de visão, portanto não foi tratado como alternativa capaz de analisar imagens. Não houve envio de foto ao Ollama nem download de novos pesos de visão. O teste físico não foi realizado e deixou de ser requisito por instrução do usuário em 04/11/2026; o [roteiro de iPhone](./meal-vision-poc-iphone.md) é apenas opcional.

## Limites e próximos passos fora do aceite desta POC

1. Teste físico/iPhone não executado e dispensado como gate por instrução do usuário. Os relatórios descrevem somente os navegadores e controles efetivamente usados; não reivindicam resultados em aparelho.
2. Modelo com licença apropriada e capacidade para ingredientes brasileiros e pratos mistos, incluindo rejeição de fotos sem alimento. Food-101 é um baseline de pesquisa inadequado para este aceite. Não distribuir os pesos atuais.
3. Amostra autorizada com pesos e receitas conhecidos para medir erro de porção. O classificador atual não estima porções; não apresentar métricas de porção inventadas.
4. Álbum/histórico de miniaturas, persistência de rascunhos visuais, retenção/exclusão e eventual análise remota autenticada dependem de AURAVIZ-76/98/63. Os registros manuais continuam locais/offline; fotos da POC são temporárias.

Fontes, licenças e reprodução: [guia da POC](../meal-vision-poc.md). O workspace já continha mudanças em outras telas e no próprio editor; foram preservadas. Não houve commit global dessas mudanças, merge, push, remoção de dados ou publicação.
