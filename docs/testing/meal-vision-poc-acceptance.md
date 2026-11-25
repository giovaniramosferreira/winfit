# Auditoria de aceite — AURAVIZ-75

Escopo original (com gate de iPhone substituído pela instrução mais recente do usuário): seção “POC aprovada — reconhecimento de refeições por imagem (04/11/2026)” do Linear, reconferida na continuação. O pedido de execução autônoma não autoriza produção, contratação de fornecedor ou omissão de testes pendentes.

| Requisito | Evidência autoritativa | Estado e limite |
|---|---|---|
| Inspecionar diário e preservar fluxos | Código atual Nutrition/nutrition/nutritionStore; testes de domínio, backup e UI | Verificado no workspace; alterações anteriores preservadas |
| Adaptador substituível, candidatos tipados, hipótese/incerteza, sem nutrientes do modelo | mealVision.ts, localMealVision.ts, artefatos por hash; WASM real com 24 imagens | Implementado; Food-101 retorna alternativas de prato, não inventário de ingredientes; hipótese de porção nula |
| Foto → análise → revisão → catálogo → kcal/P/C/G → diário | test-meal-vision-browser.cjs e relatórios Chrome/WebKit | Verificado para os cinco registros TACO; sem correspondência segue manual/pendente |
| Porção revisável, edição/exclusão/idempotência | test-meal-vision-poc.ts e fluxo real com 150/200 g hipotéticos | Verificado para entradas confirmadas; isso não mede peso das fotos |
| Manual, sem kcal, zero explícito, persistência e fuso | Suítes do diário/backup; testes São Paulo/UTC; navegador | Verificado localmente; rascunhos visuais continuam temporários |
| Offline e falha recuperável | Chrome com setOffline; WebKit com HTTP bloqueado; teste separado de import com falha | Chrome verificado; WebKit tem limitação de emulação Blob documentada; offline físico ainda não testado |
| Pelo menos 20 fotos variadas/autorizadas, erros/ambiguidades | 24 imagens e anotações/links/licenças nos relatórios; feijoada, arroz/feijão/farofa, carnes, saladas e paisagens | Executado. Anotações do agente por inspeção/legenda, sem especialista ou receita. Modelo não atende reconhecimento de ingredientes brasileiros: decisão no-go |
| Comparar porções a pesos conhecidos quando disponíveis | Campos knownGrams/portionError nulos; relatório explicita ausência de balança/receita | Indisponível na amostra; não fabricar métrica ou substituir gramas hipotéticos por ground truth |
| Latência, tamanho, memória e custo | Relatórios dos dois motores; 33.995.501 bytes; heap JS e latências medidas; zero chamadas remotas | Medições de desktop. Memória total/energia/iPhone não comprovados |
| Sem envio/armazenamento de fotos pessoais e sem ativar produção | Fluxo local em memória, runtime de mesma origem; bloqueio de requisições externas; test-meal-vision-build.mjs | Verificado no escopo do ensaio público; nenhuma validação de armazenamento remoto foi reivindicada |
| Documentar fontes/licenças/reprodução/go-no-go | docs/meal-vision-poc.md; relatório, JSONs, preparador e scripts | Feito. Pesos somente pesquisa permanecem fora do produto |
| Aceite em navegador com fotos de comida da web — instrução vigente do usuário | Chrome e WebKit reais, 24 fotos públicas e 18 verificações por motor; capturas da análise e do diário | **Verificado. iPhone foi dispensado como requisito pelo usuário em 04/11/2026. Não houve teste físico nem publicação.** |

A alternativa local já instalada também foi conferida: Ollama lista apenas hermes3:8b, capacidades completion/tools, sem vision; não foram enviadas imagens nem alegada análise multimodal por esse modelo. A POC não foi publicada para contornar falta de aparelho. O teste físico requer origem HTTPS de desenvolvimento e os artefatos de pesquisa, conforme o roteiro de iPhone.

## Histórico: bloqueio anterior, superado pela mudança de requisito

A branch e os artefatos atuais foram conferidos novamente. Os dois relatórios conservam 24 imagens, 17 verificações, zero chamadas externas/erros de página e `physicalIPhoneTest: null`; a exclusão do laboratório no build continua passando. O Linear ainda exige explicitamente evidência e teste em iPhone antes de concluir. Nova consulta USB não identificou dispositivo iOS. As alternativas seguras de navegador já foram executadas e têm seus limites documentados; repetir esses ensaios não produziria evidência física.

O bloqueio de acesso a iPhone permaneceu no turno original e nas duas continuações. A execução autônoma fica bloqueada, sem marcar a issue como concluída. Para retomar o aceite, é necessário acesso a aparelho físico/origem HTTPS de desenvolvimento ou resultados reais do roteiro registrado em `meal-vision-poc-iphone.md`. Não houve publicação, push, merge ou remoção de dados nesta auditoria.

## Resultado atual após a instrução do usuário

O usuário revogou a exigência de iPhone e pediu teste pelo agente no navegador com foto de comida da web. Essa instrução substitui o bloqueio histórico acima. A foto pública de feijoada foi baixada novamente da Wikimedia e seu SHA-256 coincide com a imagem do conjunto; outros pratos e paisagens seguem com origem/licença preservadas. Chrome e WebKit passaram em 18 verificações cada, inclusive o total realmente exibido no diário após a revisão, e as capturas estão em `docs/testing/artifacts/meal-vision-*-*.png`. Não há pendência de ação do usuário para o aceite desta POC local.

A POC conclui a avaliação do modelo com decisão no-go para reconhecimento automático brasileiro: não confundir conclusão da prova/decisão com aprovação do modelo para produção. O fluxo revisável, o catálogo identificado, o cálculo e a persistência local foram verificados. A implementação privada/remota, álbum e modelo apto a produção permanecem evolução futura, sem publicação autorizada.
