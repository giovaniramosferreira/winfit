# Artes do circuito cardio e core

O app já mostra um boneco vetorial animado em cada estação (`src/data/circuitDemos.ts`). Esta pasta prepara a troca dele pelas ilustrações em tinta no padrão do catálogo. A troca é automática: quando uma arte empacotada aparece em `src/data/circuitIllustrations.json`, `CircuitDemo` passa a usá-la. Estações sem arte continuam com o boneco.

## Briefings

`jobs.json` tem 18 itens: as 9 estações e as 9 versões modificadas (sufixo `-mod`). Cada um traz `directions` (as seis poses de uma repetição completa) e `prompt` (o mesmo prefixo de personagem e formato de `docs/media/catalog/`, com folha 3 × 2 em 1536 × 1024). Todos usam `cycle: "loop"`, porque as seis poses já fecham a repetição, inclusive nos movimentos alternados.

## Como gerar e publicar

1. Gere cada folha com a ferramenta de imagem usada no catálogo, anexando a mesma referência aprovada do personagem. Sem a referência, o personagem não sai igual.
2. Salve o PNG em `docs/media/circuit/sources/<id>.png`.
3. Crie `docs/media/circuit/generated/<id>.json` no formato do catálogo: `id`, `name`, `hold: false`, `cycle: "loop"`, `status: "generated"`, `sourcePath` absoluto, `prompt` e, se preciso, `selectedFrames` e `alignment`.
4. Revise as folhas com os critérios de `docs/media/catalog/motion-workflow.md`: membros completos, apoios fixos, mesmo personagem e poses na ordem.
5. Empacote: `node scripts/prepare-catalog-art.mjs --set=circuit --partial`. Isso grava `public/media/circuit/<id>.webp` e atualiza `src/data/circuitIllustrations.json`. Sem `--partial`, o comando falha enquanto faltar alguma arte.
6. Registre a origem em `docs/media-licenses.md`.

A interpolação com RIFE (`prepare-motion-art.mjs`) ainda não cobre este conjunto. As artes do circuito trocam os seis quadros, como os pilotos.
