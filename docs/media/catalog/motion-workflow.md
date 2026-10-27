# Quadros intermediários e revisão de movimento

As74sequências animadas usam64quadros por repetição completa. Os4exercícios de sustentação continuam estáticos. O clique em Reproduzir continua obrigatório; pausar e a preferência por movimento reduzido são preservados. Os atlas antigos e fontes originais não foram alterados.

## Fontes e montagem

- `motion-sources/`: poses corrigidas com imagegen integrado. Deadbug tem uma pose mínima adicional para revelar a perna antes da extensão; step-up combina poses originais e duas poses geradas individualmente. Não publicar variantes rejeitadas.
- `motion-anchors.json`: regiões fixas auditadas, seleções/ordem de poses, ciclos de ida/volta, limpeza de margens e translações manuais. Registrar banco/torre, nunca carga/alavanca. Referências anatômicas fixas são explícitas. Em `translations`, as coordenadas são pixels da célula fonte512×512 antes de acrescentar margem.
- `scripts/prepare-motion-art.mjs`: normaliza/estabiliza os quadros; remove duplicações selecionadas; gera a repetição completa; interpola com RIFE4.6local; empacota8×8WebP. Não há dissolvência CSS entre desenhos. Margens são acrescentadas antes do recorte do registro. Piloto legpress mantém a proporção original sem recorte quadrado.
- `motion-packing.json`: assinatura das entradas e hash da saída. `src/data/motionIllustrations.json` alimenta o renderer com grade, quantidade e duração explícitas.

Para reconstruir, usar o executável/modelo da distribuição oficial [RIFE NCNN Vulkan](https://github.com/nihui/rife-ncnn-vulkan). Dependência de processamento, não do aplicativo:

```sh
WINFIT_RIFE_BIN=/caminho/rife-ncnn-vulkan \
WINFIT_RIFE_MODEL=/caminho/rife-v4.6 \
node scripts/prepare-motion-art.mjs
```

IDs opcionais após o comando reconstroem apenas os exercícios indicados. A GPU local deve estar acessível. Arquivos intermediários ficam em `/private/tmp/winfit-motion-render`; não são publicados. Sharp usa a mesma biblioteca do empacotador original. A origem imagegen é registrada nos briefings/relatório; as entradas selecionadas ficam no projeto.

## Qualidade

Interpolação não corrige uma fonte sem anatomia/continuidade. Rejeitar membros duplicados ou desaparecendo, carga desconectada, equipamento fixo se deslocando, saltos de câmera ou cortes. Criar poses intermediárias reais nos casos necessários; fechar o retorno pelas poses corretas. Os testes cobrem78arquivos,64quadros×74sequências, hashes, grade, proporção, ciclo e estado inicial pausado. A revisão visual independente e o ledger ficam em `docs/qa/`; testes não substituem essa revisão.
