# Reconhecimento de pratos brasileiros — substituição do Food-101

Pedido vigente: substituir o modelo por reconhecimento que funcione nos pratos brasileiros e testar pelo agente no navegador com fotos da web; sem produção. A autonomia para decisões técnicas comuns foi mantida. Branch existente `codex/auraviz-75-local-vision-poc`, com alterações anteriores preservadas.

## Diagnóstico e decisão

O classificador anterior tem 101 nomes fixos, não inclui feijoada/feijão/farofa e não tem rejeição de não comida. Ajustar rótulos não resolve a ausência de capacidade. Avaliar um modelo multimodal de vocabulário aberto em português, com vários itens por foto, antes de integrar.

Candidato inicial: Qwen3-VL-4B-Instruct, Apache-2.0 nos artefatos oficiais, via Ollama local existente no Mac de 16 GiB. A inferência continuará no computador do usuário, sem serviço externo ou API paga. Um adaptador da POC se comunica apenas com uma rota local de desenvolvimento; produção não recebe esse código nem ativa análise. Não expor API Ollama aberta ao navegador. Requisição de análise contém somente foto sanitizada e consentimento explícito, sem perfil/histórico/localização. Revisão de preparo/gramas e cálculo por catálogo continuam obrigatórios, mas não substituem o teste de qualidade do reconhecimento.

## Critério mínimo antes de afirmar reconhecimento funcionando

- Identificar arroz e feijão no prato brasileiro `cc-24`; reconhecer a feijoada/feijão no caso `cc-23`, em vez de donuts/curry.
- Produzir uma lista de alimentos visíveis e explicitar ingredientes/preparo ambíguos; não emitir nutrientes, pesos ou confiança inventados.
- Retornar ausência de comida nas paisagens `cc-21/22`.
- Medir a mesma seleção pública e expandir fotos brasileiras se necessário, registrando erros e tempo real; sem correspondências fabricadas com base no nome do arquivo.
- Demonstrar no navegador upload → análise real → revisão de alimentos → salvar e total; nenhuma saída de visão simulada. Testar erros, consentimento, cancelamento e idempotência.

## Execução

- [ ] Baixar/inspecionar modelo e validar a inferência real nos casos críticos antes de alterar a UI.
- [ ] Escrever testes RED para contrato multimodal, rejeição de nutrientes, consentimento e rota local fechada.
- [ ] Implementar adaptador e servidor de desenvolvimento limitados a mesma origem/loopback, com validação, limite de bytes, timeout e sem logs de fotos.
- [ ] Substituir o modelo padrão da POC e mostrar os alimentos reais, sem exigir arquivos ONNX/labels do classificador reprovado.
- [ ] Executar avaliação real no Chrome/WebKit, testes de regressão e build sem laboratório/runtime em produção.
- [ ] Revisar o diff, registrar resultados/limitações e atualizar Linear; não declarar sucesso por correção manual da resposta do modelo.
