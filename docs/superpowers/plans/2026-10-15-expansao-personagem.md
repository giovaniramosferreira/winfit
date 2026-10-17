# Expansão do personagem para o catálogo

Escopo autorizado: manter exatamente os três pilotos aprovados e integrar os outros 75 exercícios com o mesmo personagem, preservando o tema roxo e o player. As quatro pranchas usam uma imagem estática. As instruções dos novos desenhos vêm do catálogo.

## Entregas

1. Gerar e revisar as 75 fontes originais, guardando PNGs em `docs/media/catalog/sources/` e metadados individuais em `docs/media/catalog/generated/`.
2. Empacotar as fontes em WebP local com uma escala por exercício, apoio vertical comum e centro horizontal alinhado. Nenhum PNG original é alterado.
3. Integrar os arquivos concluídos pelo manifesto `src/data/catalogIllustrations.json`; manter o renderer atual como fallback durante a geração.
4. Exigir cobertura final dos 78 exercícios, as quatro sustentações estáticas e os hashes originais dos três pilotos.

## Interface do empacotador

`node scripts/prepare-catalog-art.mjs --partial` processa fontes disponíveis e lista os ids faltantes. Sem `--partial`, fontes faltantes tornam a execução um erro depois de salvar o progresso. JSON inválido, atlas indivisível ou sem tinta, seleção inválida e demais erros nunca são ignorados.

Cada metadata contém `{id, hold, sourcePath, status: 'generated'}`; `sourcePath` é absoluto. Opcionalmente aceita `cycle: 'return' | 'loop'` e `selectedFrames: [0,1,2,3,4,5]` (seis índices de 0 a 5, repetição permitida). O padrão usa ida e volta. Uma arte que já mostra o ciclo completo deve usar `loop`. Pranchas são uma fonte única, sem grid. `alignment: 'source'` mantém o mesmo recorte global, escala e translação nos seis quadros para preservar apoios fixos; sem a opção, cada silhueta fica centrada sobre o piso comum. A opção foi aplicada inicialmente apenas ao crucifixo com halteres.

`docs/media/catalog/packing.json` guarda hashes da fonte e metadados, seleção, dimensões e alinhamento. A execução seguinte reutiliza um atlas existente se os hashes e a versão do empacotador continuam iguais. Os três ids dos pilotos são reservados e não podem entrar no pipeline.

## Verificação

- `node --test scripts/test-catalog-art.mjs` verifica recorte, dimensões, seleção, escala comum, cache, mudança de ciclo, sustentação estática e falha por fonte faltante ou divisão inexata usando arquivos temporários.
- `scripts/test-illustration-pilots.ts` verifica cobertura estrita de 78, presença dos WebPs, cues do catálogo, os hashes dos pilotos, sustentação e precache.
- `scripts/test-illustrations.ts` mantém testes de anatomia e poses, e exige o personagem novo em todo o catálogo.
- `npm run build` verifica compilação e empacotamento de produção.

Os testes TypeScript podem ser executados pelo executor TS já usado no projeto ou compilados temporariamente com esbuild (JSX automático). Durante a geração, a cobertura estrita deve falhar: nenhuma entrada fictícia substitui as fontes faltantes.

## Resultado em 15/10/2026

- [x] 75 fontes geradas e revisadas individualmente; correções de pose regeneradas e quadros inválidos excluídos das sequências publicadas.
- [x] Cobertura total de 78 exercícios; três pilotos aprovados preservados por hash.
- [x] Figuras anterior/posterior refeitas com destaque dos dez grupos musculares.
- [x] Altura proporcional para desenhos horizontais; alinhamento de apoio preservado no crucifixo.
- [x] Testes de mídia, anatomia, calistenia, treino em casa e Watch, além de build de produção.
- [x] Conferência no navegador: detalhe, reprodução/pausa, sustentação, mapas musculares e troca de variação no player sem registrar séries.

A API de redimensionamento não alterou o tamanho real observado da janela; a conferência visual desta etapa foi feita no viewport de desktop. O build inclui95entradas de precache, aproximadamente7,17MiB; inclusão no service worker foi conferida, sem simular perda de rede no navegador.
