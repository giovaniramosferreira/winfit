# AURAVIZ-75 — POC local de refeições

**Spec e autorização:** seção “POC aprovada — reconhecimento de refeições por imagem (04/11/2026)” da AURAVIZ-75. Executar neste workspace preservando alterações anteriores; sem commits globais, deploy, envio de imagens ou armazenamento externo.

**Objetivo:** ligar análise local substituível à revisão do diário existente, com catálogo identificado e cálculo determinístico de energia e macronutrientes.

**Arquitetura:** laboratório disponível somente no servidor de desenvolvimento com `VITE_MEAL_VISION_POC=true`. ONNX Runtime Web executa pesos selecionados explicitamente pelo pesquisador; os pesos de pesquisa do plate-vision ficam fora do repositório e do build. O adaptador aceita apenas pixels e retorna candidatos, hipóteses e limitações, nunca nutrientes. A revisão exige correspondência explícita e gramas confirmadas. O diário mantém formato v1 retrocompatível, registro manual, cálculo por rótulo, edição/exclusão e IDs estáveis.

## Tarefas

- [x] 1. Escrever testes do contrato local, revisão/catalogação, macros, validação de importação e totais; executar RED.
- [x] 2. Implementar contrato de visão local (sem percentuais de confiança), catálogo TACO pequeno com fonte/edição/ID, cálculo e proveniência verificáveis. Executar testes de domínio e regressões do diário.
- [x] 3. Implementar adaptador ONNX com verificação de hash, tamanho/entradas/saídas, pré-processamento NHWC uint8, apenas logits. UI de laboratório: seleção explícita de modelo/rótulos/foto, confirmação de imagem autorizada, estados de erro/sem alimento e revisão; resultados não alteram o diário antes da confirmação.
- [x] 4. Integrar revisão no editor atual sem duplicar o diário; conservar pendências, manual/offline, idempotência e dados anteriores. Macronutrientes desconhecidos permanecem pendentes; edição manual remove cálculo derivado antigo.
- [x] 5. Criar avaliação reproduzível e relatório com limites. Separar ensaios de software, imagens reais autorizadas, pesos conhecidos e dispositivo físico. Nenhum resultado ausente será preenchido com simulação.
- [x] 6. Executar `npm test`, `npm run build` e fluxo de navegador local; verificar que o build de produção não contém laboratório, runtime ou pesos. Registrar evidências e bloqueios reais, mantendo a issue aberta até validação em iPhone.

**Validação:** testes de candidatos inválidos/nutrientes injetados, NaN/infinito/zero/gramas, fonte/versionamento, recálculo/edição/remoção/repetição, fuso local, desconhecidos e erros de inferência; ensaio de navegador com runtime real quando artefatos disponíveis. Métricas: tamanho/hash do modelo, inicialização e latência de análise; memória indisponível deve ser `null` e não zero. Avaliação de reconhecimento requer conjunto autorizado e anotações humanas, inclusive pratos brasileiros e não alimentos.

**Decisão já identificada:** pesos plate-vision são somente pesquisa (MODEL_CARD.md), Food-101 não reconhece ingredientes de pratos mistos nem recusa não alimentos com garantia. Não distribuir pesos nem usar regressão nutricional do modelo. A publicação TACO permite reprodução citando NEPA/UNICAMP (2011), páginas ii–iii; usar valores centesimais publicados, sem herdar licença MIT de outra normalização.

## Registro final da execução local

33/33 suítes, build com flag de pesquisa ligada e verificação de exclusão em produção passaram. Ensaio real em Chrome: 24 imagens licenciadas e 17 verificações de fluxo, sem chamadas externas. Dois problemas encontrados pela revisão independente foram reproduzidos e corrigidos. Resultado: no-go para reconhecimento automático brasileiro com Food-101. Evidência e limitações em `docs/testing/meal-vision-poc-report.md`. Aceite final em iPhone e porções com pesos conhecidos continuam pendentes; AURAVIZ-75 não foi marcada concluída.

## Mudança de requisito e aceite da POC

A instrução mais recente de 04/11/2026 dispensou o iPhone e determinou testes pelo agente no navegador com fotos da web. Substitui as referências históricas ao gate físico acima. Nova execução: Chrome/WebKit, 24 imagens públicas, 18 verificações por motor e capturas do fluxo; a imagem de feijoada foi reconferida contra download atual da Wikimedia. POC local concluída com avaliação negativa do Food-101 para automação brasileira, preservando o fluxo manual/revisável e sem produção.
