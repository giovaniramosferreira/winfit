# POC local de reconhecimento de refeições — AURAVIZ-75

Implementação de pesquisa de 04/11/2026. Branch `codex/auraviz-75-local-vision-poc`.

O diário manual existente continua sendo o registro oficial. A POC acrescenta classificação real via ONNX/WASM, seguida de revisão obrigatória e cálculo por uma referência identificada. Não há upload, fornecedor remoto, armazenamento de fotos ou distribuição de pesos no produto.

## Executar

```sh
npm install
node scripts/prepare-meal-vision-poc.mjs --research-only
VITE_MEAL_VISION_POC=true npm run dev -- --host 127.0.0.1 --port 5175
```

O preparador baixa artefatos públicos em `os.tmpdir()/winfit-meal-vision-poc`; `WINFIT_POC_DIR` muda esse diretório. Ele não roda em install/build/dev. Leia as condições de pesquisa abaixo antes de executá-lo. Falhas de download são registradas, não substituídas por imagens simuladas.

Em Alimentação → Adicionar refeição → POC de reconhecimento local, selecione `plate-vision-fp32.onnx` e `food101_labels.json` do diretório preparado. Confirme uso de pesquisa, carregue o modelo e escolha uma imagem autorizada. A análise exige confirmação local separada. Alternativas não geram consumo. Em uma alternativa, abra o catálogo, escolha alimento/preparo, informe os gramas e confirme. Só “Salvar refeição” atualiza o total diário.

Sem correspondência, use o rótulo ou o registro manual com calorias pendentes. O catálogo inicial não representa todas as receitas: contém arroz tipo 1 cozido, feijão carioca cozido, peito de frango grelhado, alface crespa crua e a receita de feijoada TACO. Farofa não é substituída por outro alimento. A receita de feijoada é uma referência, não uma descrição do prato fotografado. A interface pergunta sobre carnes, óleos, molhos, acompanhamentos e consumo real.

## Contratos e cálculo

- `src/lib/mealVision.ts`: interface substituível `LocalVisionAdapter` recebe somente Blob de pixels; retorna alternativas, hipótese opcional de porção e incertezas. Campos nutricionais e percentuais de confiança são rejeitados.
- `localMealVision.ts`: apenas backend WASM, uma thread, recursos servidos pela própria origem. Tensor RGB uint8 `[1,H,W,3]`; redimensionamento/normalização pertencem ao grafo ONNX. Apenas `logits` são consumidos. O ramo de regressão nutricional não é usado como fonte.
- `mealVisionArtifacts.ts`: valida tamanho e SHA-256 de modelo e rótulos antes de abrir uma sessão. Cada foto preparada recebe ID determinístico para que reanálise/revisão da mesma imagem, na mesma refeição, substitua o item. O ID derivado dos pixels permanece no item confirmado; os pixels não são persistidos.
- `foodCatalog.ts`: valores publicados da TACO por 100 g de parte comestível, IDs de alimento e versão `TACO-4-2011-subset-1`. Sem conversões implícitas de colher/concha e sem ingestão de TBCA.
- `mealAnalysis.ts`: `valor_por_100g × gramas_confirmadas / 100`, arredondado a duas casas. A mesma regra vale para kcal, proteína, carboidrato e gordura. kcal são a energia publicada; não são recalculadas a partir de uma fórmula simplificada de macros.
- `nutrition.ts`: valida snapshots de proveniência, quantidade e derivados ao salvar/importar. Uma referência TACO alterada é rejeitada. Alterar gramas recalcula; alterar identidade ou kcal invalida derivados. Campo vazio continua pendente e zero explícito continua zero. A última porção anterior é guardada na revisão quando corrigida.
- O formato v1 do diário continua retrocompatível; itens antigos não ganham macros inventados. Total de macros informa pendências separadamente. Edição/revisão não altera IDs de refeições. Exclusão/restauração seguem a política existente do diário manual.

## Dados e limites operacionais

As fotos são selecionadas explicitamente, limitadas a JPG/PNG/WebP de 5 MiB e 40 MP, depois recriadas em JPEG até 1920 pixels sem copiar EXIF/GPS. Modelo, imagem e alternativas ficam somente na memória. Encerrar o editor libera os recursos. Trocar a refeição descarta a foto anterior; trocar a alternativa revoga a revisão anterior. Fechar a seção com a seta apenas recolhe a seção: para descartar antes de encerrar o editor, use o botão de descarte.

O diário guarda apenas itens revisados e seu identificador, fonte, gramas e observações. O export/sync que já existe pode incluir esses registros quando configurado pelo usuário; nenhuma imagem, arquivo ONNX ou score de classificação entra no backup. Fotos, EXIF e dados alimentares não entram em logs de aplicação. O ensaio autorizado salva resultados descritivos e licenças das fotos públicas em um relatório de pesquisa separado.

Sem rede, uma sessão WASM já carregada continua funcionando; a edição manual e a persistência local seguem disponíveis. Como o laboratório só existe no servidor de desenvolvimento, recarregar o servidor offline não equivale à PWA instalada. Pesos e rascunhos visuais não são persistidos para recarga; álbum/miniaturas e armazenamento privado continuam na AURAVIZ-98.

`import.meta.env.DEV` e `VITE_MEAL_VISION_POC=true` são requisitos simultâneos. O build de produção elimina o import dinâmico do laboratório, o ONNX Runtime e seus WASM; a flag sozinha não o habilita em produção. Não houve deploy.

## Fontes e licenças verificadas

- [plate-vision](https://github.com/simonkundrik/plate-vision), commit `d5690063cc8795497c603aa676f97fd253053bbf`: código MIT. [Model card](https://github.com/simonkundrik/plate-vision/blob/d5690063cc8795497c603aa676f97fd253053bbf/MODEL_CARD.md#licence): pesos Food-101 são somente pesquisa; não presumir permissão comercial a partir da licença do código. O app não baixa nem redistribui pesos.
- Artefato de pesquisa `model-v0.2.0/plate-vision-fp32.onnx`: 33.995.501 bytes, SHA-256 `3f982c4aa8658a032cbc2a656040953a17744a3d35df11b49e722eed07f9f431`. JSON de rótulos do commit acima: SHA-256 `69b2f2163d477822dd3786b9425c6b1348180febfd71d23ec4491badc7c66de4`. Ordem das 101 classes não pode ser ordenada alfabeticamente pelo cliente.
- [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html) 1.24.3, MIT; versão exata no lockfile. Integração própria, sem copiar componentes GPL do OpenNutriTracker.
- [TACO, NEPA/UNICAMP, 4ª edição revisada e ampliada, Campinas, 2011](https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf): páginas ii–iii autorizam reprodução citando a fonte. Valores arredondados da Tabela 1, alimentos 3 (p. 26), 78 (p. 30), 410 (p. 52), 540 (p. 60), 561 (p. 62). Não herdamos a licença MIT de um normalizador nem incorporamos suas medidas caseiras.
- [FoodSeg103](https://github.com/ada-yl325/FoodSeg103): segmentação é relevante para ingredientes, mas código Apache-2.0 não comprova licença de fotos/pesos nem avaliação brasileira. Não incorporado.
- [CalorAI](https://github.com/MiaoE/CalorAI): código MIT; não há evidência obtida nesta execução de uma distribuição browser com pesos/dados brasileiros liberados e desempenho validado. Não incorporado.
- [TACO normalizada](https://github.com/brolesi/taco): referência de organização, não dependência de ingestão. Dados locais foram transcritos da publicação original, preservando sua atribuição.

As imagens de avaliação ficam fora do repositório. O preparador conserva autor, origem e licença por imagem. O manifesto de busca do plate-vision tem rótulos fracos: duas paisagens foram retornadas por “spring rolls”. As anotações em `docs/testing/meal-vision-poc-annotations.json` foram feitas pelo agente por inspeção da prancha e legendas, sem especialista em nutrição, balança ou receita. Não são ground truth clínico nem estatístico.

## Reproduzir os testes

```sh
npm test
npm run build
# Requer Playwright instalado ou WINFIT_PLAYWRIGHT apontando para o pacote disponível no ambiente:
WINFIT_URL=http://127.0.0.1:5175/ node scripts/test-meal-vision-browser.cjs
```

O teste usa Chrome real, WASM real e os arquivos verificados. Bloqueia qualquer requisição HTTP de outra origem; nenhum provedor é simulado. A anotação e os candidatos de cada imagem são preservados no relatório. Pesos/porções inseridos no teste de UI são hipotéticos, somente para verificar aritmética e fluxo; não representam medidas das fotos.

Ver `docs/testing/meal-vision-poc-results.json` e `docs/testing/meal-vision-poc-report.md` para resultados e decisão. Em 04/11/2026, o usuário dispensou o requisito de iPhone e autorizou a validação pelo agente no navegador com fotos de comida da web. O aceite desta POC é local e por navegador; não há publicação em produção nem alegação de teste físico.

## Auditoria adicional — WebKit e falha ao carregar o laboratório

A suíte aceita `WINFIT_BROWSER=webkit` e grava um relatório separado; o padrão continua Chrome. Instale o browser de teste com a CLI do Playwright disponível no ambiente. Para manter os binários fora da instalação do usuário, use `PLAYWRIGHT_BROWSERS_PATH=/tmp/winfit-playwright-browsers` tanto ao instalar quanto ao executar.

```sh
WINFIT_BROWSER=webkit node scripts/test-meal-vision-browser.cjs
WINFIT_BROWSER=webkit node scripts/test-meal-vision-fallback-browser.cjs
node scripts/test-webkit-blob-offline.cjs
```

O WebKit de teste apresentou falha de operações Blob/File quando `setOffline(true)` é usado, inclusive em um reproducer mínimo sem inferência. O controle WebKit completo usa **HTTP bloqueado**, registrado como `offlineMode: http-isolation`; ele não comprova modo avião nem offline de Safari/iPhone físico. O Chrome continua usando a emulação offline e o relatório conserva a distinção. Não se alterou o produto para contornar o comportamento do emulador.

O import dinâmico do laboratório agora trata falha de carregamento e mantém o formulário manual disponível. O teste separado bloqueia o módulo, verifica a mensagem recuperável e exige gravação manual com calorias pendentes.

O roteiro de aceite em [iPhone](./testing/meal-vision-poc-iphone.md) permanece não executado. A consulta USB não identificou aparelho iOS; esta instalação não contém `devicectl`. Uma origem HTTPS de desenvolvimento é necessária para reproduzir o contexto seguro exigido por Web Crypto; não publicar a POC em produção para facilitar esse teste.

## Aceite vigente — validação pelo agente no navegador

A instrução mais recente do usuário substitui o gate físico anterior: testar no navegador usando fotos de comida da web, sem depender de iPhone ou de ações do usuário. A POC foi novamente executada em Chrome e WebKit com as 24 fotos públicas licenciadas e 18 verificações por motor. As capturas do teste e os resultados reais estão no relatório. A decisão continua no-go para usar Food-101 como reconhecedor automático brasileiro, e go para o fluxo local com revisão explícita/cálculo determinístico. Próximas melhorias de modelo/produção não são tratadas como entregues.
