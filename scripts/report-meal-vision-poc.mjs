import {readFile,writeFile} from 'node:fs/promises'
const report=JSON.parse(await readFile('docs/testing/meal-vision-poc-results.json','utf8'))
const f=n=>Number(n).toFixed(1)
const within=report.images.filter(i=>i.annotation?.food101Label)
const hits=within.filter(i=>i.result.candidates[0]?.name===i.annotation.food101Label).length
const top3=within.filter(i=>i.result.candidates.some(c=>c.name===i.annotation.food101Label)).length
const heap=report.images.map(i=>i.metrics.jsHeapBytes).filter(n=>typeof n==='number')
const rows=report.images.map(i=>{
 const a=i.annotation,c=i.result.candidates.map(c=>c.name)
 const assessment=!a?'Sem anotação':!a.containsFood?'Erro: comida sugerida para paisagem':!a.food101Label?'Erro/fora de catálogo: não identifica o prato brasileiro':c[0]===a.food101Label?'Classe do prato compatível':c.includes(a.food101Label)?'Primeira classe errada; referência entre alternativas':'Classe do prato incompatível'
 return `| ${i.id} | ${(a?.visibleItems??[]).join(', ')||'Sem alimento'} | ${c.join(' / ')} | ${assessment} |`
}).join('\n')
let webkit,blobOffline
try{webkit=JSON.parse(await readFile('docs/testing/meal-vision-poc-webkit-results.json','utf8'))}catch{}
try{blobOffline=JSON.parse(await readFile('docs/testing/meal-vision-poc-webkit-blob.json','utf8'))}catch{}
const webkitSection=webkit?`
## Auditoria adicional de compatibilidade e falha de rede

WebKit de desktop: ${webkit.platform}. ${webkit.images.length} imagens, ${webkit.checks.length} verificações de fluxo, ${webkit.externalRequests.length} requisições externas e ${webkit.pageErrors.length} erros de página. Mediana ${f(webkit.latencyMs.median)} ms; p95 ${f(webkit.latencyMs.p95)} ms. Isso não mede Safari em iPhone.

O modo deste ensaio é explicitamente \`${webkit.offlineMode}\`: HTTP bloqueado após carregar o laboratório. Não equivale a modo avião nem a offline físico. Um reproducer mínimo separado mostrou que \`setOffline(true)\` neste WebKit quebra até \`Blob.arrayBuffer()\`, \`File.arrayBuffer()\`, FileReader e createImageBitmap em memória, enquanto imagem data: continua funcionando. A troca experimental de decodificador foi desfeita por não resolver a causa. Veja [operações Blob online/offline](./meal-vision-poc-webkit-blob.json); evidência do reproducer ${blobOffline?'registrada':'ainda pendente'}.

Uma falha real de proteção foi corrigida: rejeição do import dinâmico do laboratório podia desmontar o editor. O teste \`scripts/test-meal-vision-fallback-browser.cjs\` bloqueia esse módulo e exige que o formulário manual continue visível e salve um item com kcal pendentes. Foi reproduzido antes e validado após a correção em Chrome e WebKit.

O Ollama disponível neste notebook tem somente um modelo de texto, sem capacidade de visão, portanto não foi tratado como alternativa capaz de analisar imagens. Não houve envio de foto ao Ollama nem download de novos pesos de visão. O teste físico não foi realizado e deixou de ser requisito por instrução do usuário em 04/11/2026; o [roteiro de iPhone](./meal-vision-poc-iphone.md) é apenas opcional.
`:''
const text=`# AURAVIZ-75 — resultado da POC local

Execução: ${report.executedAt}. Branch: \`codex/auraviz-75-local-vision-poc\`.

**Decisão: go para o fluxo local de revisão/cálculo; no-go para usar este modelo como reconhecedor automático de refeições brasileiras ou como fonte nutricional.** A POC local foi validada no navegador conforme instrução do usuário em 04/11/2026, que dispensou o iPhone como requisito. A iniciativa de produção permanece separada desta POC. Nenhum deploy, sincronização de imagens ou fornecedor remoto foi ativado.

## Evidências executadas

- \`npm test\`: 33/33 suítes, incluindo 56.000 combinações do gerador e os novos testes de visão, catálogo, proveniência, quantidades inválidas, revisão, idempotência e virada de dia em São Paulo/UTC.
- \`VITE_MEAL_VISION_POC=true npm run build\` e \`node scripts/test-meal-vision-build.mjs\`: passaram; laboratório, modelo ONNX e WASM ficam fora do produto mesmo com a flag habilitada no build de produção.
- Chrome real em desktop, viewport de 390×844 com toque, fuso America/Sao_Paulo. Isso não é Safari nem iPhone físico. Runtime WASM real; nenhuma saída de visão simulada.
- ${report.checks.length} verificações de navegador passaram: ${report.checks.join('; ')}.
- Revisão independente encontrou dois problemas: foto anterior preservada ao trocar refeição e confirmação preservada ao trocar alternativa. Ambos foram reproduzidos em RED no Chrome e corrigidos, com os casos incluídos na suíte final. TypeScript, regressões e build voltaram a passar.

## Medições nesta máquina

| Medida | Resultado |
|---|---|
| Modelo de pesquisa fp32 | ${report.initialization.modelBytes.toLocaleString('pt-BR')} bytes (${f(report.initialization.modelBytes/1024/1024)} MiB) |
| Inicialização, incluindo leitura/verificação de hashes | ${f(report.initialization.initializationMs)} ms |
| Análise, mínimo / mediana / p95 / máximo, ${report.images.length} imagens | ${f(report.latencyMs.min)} / ${f(report.latencyMs.median)} / ${f(report.latencyMs.p95)} / ${f(report.latencyMs.max)} ms |
| Heap JS observado no navegador | ${heap.length?`${f(Math.min(...heap)/1024/1024)}–${f(Math.max(...heap)/1024/1024)} MiB; não é a memória total de WASM/processo`:'API indisponível'} |
| Memória total, energia, temperatura e pressão de memória no iPhone | Não medidos |
| Requisições HTTP a outras origens durante o ensaio | ${report.externalRequests.length}; bloqueadas pelo teste |
| Requisições/cobrança de inferência remota | 0 / 0; downloads de preparação e custo do dispositivo não incluídos |

Valores de uma execução, sem generalização para outros aparelhos. As latências incluem a decodificação do JPEG já sanitizado e a inferência local; excluem a seleção e a sanitização inicial da imagem. As métricas do desktop não comprovam desempenho do Safari.

## Resultados por imagem e itens visíveis

As ${report.images.length} imagens têm licença e origem registradas individualmente no JSON. Anotações feitas pelo agente após inspeção visual da prancha e das legendas; não por um especialista ou pelas pessoas que prepararam os pratos. Ingredientes ocultos, consumo, peso e receitas continuam desconhecidos.

| Imagem | Itens visíveis esperados, sujeitos à confirmação | Alternativas do modelo, em ordem | Avaliação descritiva |
|---|---|---|---|
${rows}

Nas ${within.length} fotos cuja classe esperada existe em Food-101, houve correspondência literal da primeira alternativa em ${hits} e presença da classe entre três alternativas em ${top3}. Isso é uma contagem descritiva desta seleção pequena, com rótulos parcialmente apoiados em legendas; não é precisão estatística, nem validação nutricional. As alternativas são hipóteses concorrentes para o prato inteiro e não devem ser somadas como ingredientes identificados.

O modelo não tem saída de segmentação ou inventário de ingredientes. Portanto, arroz, feijão, farofa, carnes e acompanhamentos da mesma foto não recebem acerto por item com base no nome genérico do prato: a cobertura por ingrediente é **não suportada**. A feijoada e o prato com arroz/feijão/farofa não têm classe adequada e foram classificados incorretamente. Ambas as paisagens receberam classes de comida. O laboratório permite recusar tudo e continuar manualmente.

Os hashes/attribution/links de licença estão em [meal-vision-poc-results.json](./meal-vision-poc-results.json). Duas fotos suplementares não foram baixadas devido a HTTP 429 e não entram na contagem; o relatório conserva as falhas, sem tentar burlar o limite.

## Evidência visual do fluxo

[Análise real da foto pública](./artifacts/meal-vision-chromium-analysis.png) · [Refeição revisada salva e total diário](./artifacts/meal-vision-chromium-saved.png). A captura mostra quantidade hipotética de teste, não peso inferido da imagem.

## Porções e cálculo

O adaptador deste modelo retorna \`portionHypothesis: null\`. Uma única foto não fornece escala/peso suficiente e o ramo de regressão do modelo foi deliberadamente descartado. Nenhuma foto da amostra possui peso medido: erro absoluto/percentual da porção são \`null\`, não zero. As porções de 150 g e 200 g do teste de interface são entradas hipotéticas para validar revisão e recálculo, não ground truth das fotos.

Exemplo aritmético testado: referência TACO-540, feijoada padronizada, 117 kcal por 100 g → 150 g = 175,5 kcal; correção para 200 g = 234 kcal. Proteína, carboidrato e gordura seguem a referência centesimal com gramas confirmadas. A mesma foto revisada duas vezes não duplica o item, e excluir/restaurar atualiza o total diário. Mudança manual de identidade invalida a estimativa derivada; itens sem valores continuam pendentes.

${webkitSection}
## Limites e próximos passos fora do aceite desta POC

1. Teste físico/iPhone não executado e dispensado como gate por instrução do usuário. Os relatórios descrevem somente os navegadores e controles efetivamente usados; não reivindicam resultados em aparelho.
2. Modelo com licença apropriada e capacidade para ingredientes brasileiros e pratos mistos, incluindo rejeição de fotos sem alimento. Food-101 é um baseline de pesquisa inadequado para este aceite. Não distribuir os pesos atuais.
3. Amostra autorizada com pesos e receitas conhecidos para medir erro de porção. O classificador atual não estima porções; não apresentar métricas de porção inventadas.
4. Álbum/histórico de miniaturas, persistência de rascunhos visuais, retenção/exclusão e eventual análise remota autenticada dependem de AURAVIZ-76/98/63. Os registros manuais continuam locais/offline; fotos da POC são temporárias.

Fontes, licenças e reprodução: [guia da POC](../meal-vision-poc.md). O workspace já continha mudanças em outras telas e no próprio editor; foram preservadas. Não houve commit global dessas mudanças, merge, push, remoção de dados ou publicação.
`
await writeFile('docs/testing/meal-vision-poc-report.md',text)
console.log('Wrote descriptive evaluation:',report.images.length,'images;',report.checks.length,'browser checks; top1',hits,'top3',top3,'of',within.length,'eligible images')
