# Diário alimentar local — E4 / AURAVIZ-100

Página: `src/pages/Nutrition.tsx` (export default), rota definida na integração principal.

- Refeições têm ID estável, data civil local, horário local, tipo e itens. Edição substitui pelo ID; exclusão mantém tombstone restaurável.
- Porção em gramas e kcal da porção são opcionais (`null`). `0 kcal` é informação explícita. Porção, quando informada, deve ser positiva. Total diário soma valores conhecidos e indica pendências/total parcial.
- Meta opcional, sem recomendação ou valor padrão: valor direto ou manutenção informada menos déficit planejado informado. Vigência começa na data escolhida; a meta mais recente até o dia consultado é usada. Uma nova meta para a mesma data substitui a anterior. Não há alegação de déficit real.
- Persistência local separada, chave `winfit-nutrition-v1`, envelope versão 1. A validação rejeita formato desconhecido, campos/números/datas inválidos e IDs duplicados. Dados inválidos não são sobrescritos por gravações ordinárias. Falha de escrita mantém estado anterior e expõe erro na página. Não há sincronização externa.

## API pública

`nutritionStore`: `getState()`, `subscribe(fn)`, `upsertMeal(meal)`, `deleteMeal(id)`, `restoreMeal(id)`, `upsertGoal(goal)`, `deleteGoal(id)`, `exportData()`, `importData(json)`, `reset()`.

Funções de integração equivalentes: `exportNutritionData(): string`, `importNutritionData(json: string): boolean`, `resetNutritionData(): boolean`. Export preserva o conteúdo bruto inválido quando disponível. Reset é a recuperação explícita de armazenamento inválido e substitui somente esta chave. Não remover dados da academia.

Estado: `version`, `meals`, `goals`, `deleted`, `error`, `blocked`. Mutações retornam sucesso booleano; domínio inválido lança erro em upsert. Import inválido retorna false e preserva dados. Import não desbloqueia corrupção existente; exportar e redefinir explicitamente antes de restaurar backup válido.

## Evidência TDD

Jornadas derivadas dos requisitos do Linear transmitidos na delegação: registrar/editar refeições sem duplicar, distinguir pendências de zero, excluir e restaurar, consultar meta por data, recuperar armazenamento com segurança.

`node scripts/test-nutrition.cjs`: RED em 26/10/2026, `Cannot find module ../src/lib/nutrition.ts` (implementação inexistente), checkpoint `ac07353`. Mesmo comando GREEN após implementação: `nutrition: domain, versioned storage, upsert, undo, import and failure tests PASS`.

O teste cobre datas inexistentes, horário inválido, valores negativos/porção zero, distinção null/zero, total parcial, meta calculada/vigência/ausente, déficit inválido, upsert, reload, delete/restore, import inválido, export/reset/import, conteúdo corrompido preservado, falha de gravação sem mutação.

`npx tsc --noEmit`: passou em 26/10/2026. Cobertura percentual e navegador ainda não medidos neste módulo; build e validação integrada ficam com o agente principal. Fotos, banco nutricional e IA não são simulados nesta entrega.

## Cobertura complementar

`node --test --experimental-test-coverage scripts/test-nutrition.cjs` passou (1 arquivo de teste, sem skips). V8 reportou agregados do domínio/persistência transpilados: 91,55% linhas, 97,98% branches e 93,62% funções. UI React não está incluída nessa medição. Adicionadas garantias de substituição de meta por data, remoção de meta, notificação/unsubscribe, ID desconhecido, versão incompatível e IDs duplicados. Linhas reportadas pelo V8 correspondem ao JS transpilado; não usar os números de linha do relatório como anchors TypeScript.
