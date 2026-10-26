# Fotos e análise alimentar — preparação E5/E6

## Entrega local

`MealPhotoDraft` integra a página Alimentação: captura/seleção explícita JPG/PNG/WebP até 5 MB, assinatura básica do formato, decode e nova codificação canvas JPEG (cópia de pixels, sem EXIF/GPS original), limite 40 MP e redução para 1920 px. Rascunho somente em memória; sair/recarregar o descarta. Salvar uma cópia exige checkbox específico e dispara download no aparelho. O arquivo não integra o diário nem será removido ao limpar os dados do app. Nenhum upload ocorre e nenhum botão falso de análise é exibido.

`NutritionLabelCalculator`: usuário informa valor energético por 100 g do próprio rótulo, quantidade em gramas e confirma alimento/valores. Cálculo determinístico `kcalPor100g * gramas / 100`, arredondado a duas casas. Proveniência inclui fonte, ID, descrição, versão/data, licença declarada, energia por 100 g e confirmação temporal. Edição manual de campos remove a proveniência anterior. Import valida consistência entre porção, energia e proveniência.

## Contrato backend preparado

`server/meal-analysis.ts` exporta `createMealAnalysisHandler(deps)`: POST JSON até 4 KB, bearer validado por callback de autenticação real, caminho dentro da pasta do usuário autenticado, consentimento explícito de análise com destino exato configurado, foto recuperada pelo adapter de propriedade, máximo 5 MB, tipo/assinatura. O callback de autenticação deve consultar/verificar a autoridade; decodificar JWT não é validação.

Ausência de provider ou coordenador retorna 503. Provider recebe apenas bytes/tipo. Retorno validado estritamente: `{candidates:[{name,confidence}]}`; campos extras, inclusive calorias, são rejeitados. Nenhum resultado insere alimentos automaticamente. Falhas retornam mensagens genéricas sem log de foto/token/payload.

Coordenação é uma interface obrigatória `AnalysisCoordinator.run(user,key,fingerprint,task)`, com chave por usuário, fingerprint de caminho/tipo/hash SHA-256/destino e resultados done/conflict/busy/rate-limited. Testes usam um adapter em memória; **não existe coordenador de produção**, portanto não há promessa de idempotência/rate-limit distribuídos operacionais. Integração real precisa reserva transacional durável, cache de resultado, recuperação de pending com lease, quotas de custo e timeout do provider. Não usar Map por instância em produção.

`signOwnedMealPhoto` restringe caminho à identidade autenticada e solicita assinatura do bucket privado com expiração fixa de 60 segundos. ID deve vir do contexto validado; não aceitar ID do corpo. O adapter de assinatura também precisa verificar existência/posse. Não persistir URL assinada no diário; URL é uma credencial temporária.

SQL `supabase/meal-schema.sql` preparado, **não aplicado**: refeições/itens/fotos com RLS por dono e FK composta impedindo vínculo a refeição alheia, bucket privado 5 MB, MIME allowlist, paths próprios e imutáveis (sem policy UPDATE). URLs assinadas não expiram por RLS; helper solicita TTL 60. Remoção de conta exige limpeza explícita de objetos no Storage; cascade de metadados não remove arquivos. Validar duas identidades reais antes de habilitar. Rever policies já existentes no bucket, pois policies permissivas se combinam por OR.

## Fontes primárias consultadas em 26/10/2026

- [TBCA, versão 7.3, seções Como Citar e Registro da Obra](https://www.tbca.net.br/): o site exige contato com coordenadores para finalidade comercial e restringe reprodução/comercialização do material. Dados por 100 g não tornam a base livre. **Nenhuma ingestão/scraping/cache TBCA foi feita**. Gate: obter licença escrita que cubra redistribuição no app e documentar atribuição/versão antes da ingestão.
- [USDA FoodData Central API Guide — Licensing](https://fdc.nal.usda.gov/api-guide/): dados em domínio público/CC0 1.0; fonte pede atribuição. API exige chave data.gov, que deve ficar no backend. USDA é alternativa candidata; não há credencial, ingestão ou catálogo em execução nesta entrega. Gate: definir dataset/versionamento, mapeamento português/alimento/preparo/unidade e medir cobertura brasileira.
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control): acesso protegido por RLS em storage.objects. SQL é preparação local; não valida o isolamento remoto por si só.

## Gates antes de habilitar nuvem/IA

1. Escolher e aprovar fornecedor, região exata, preço/teto e retenção; configurar backend autenticado, adapters de leitura/assinatura e coordenador durável. Não há contratação/chamada paga neste lote.
2. Consentimentos separados e revogáveis: guardar foto em bucket privado com destino/retensão e enviar bytes ao fornecedor/região nomeados. Nenhum envio enquanto destino não estiver configurado; fallback manual sempre disponível.
3. Aprovar fonte/licença e pipeline versionado; persistir proveniência. Imagem identifica candidatos, nunca fornece kcal ou quantidades confiáveis. Usuário confirma alimento/preparo/quantidade antes do cálculo.
4. Benchmark com fotos consentidas de pratos brasileiros (incluindo misturas/oclusão): medir candidatos top-k, abstensão, falhas, latência/custo, diferenças por iluminação; definir limiares antes de release. Nenhum benchmark de IA foi executado.
5. Testar duas contas isoladas, tentativas de path alheio, expiração/revogação de URL, quota, reenvio concorrente/timeout, exclusão de bytes e portabilidade. Validar câmera/EXIF no iPhone físico.

## Evidência TDD e verificação

RED: `node scripts/test-meal-analysis.cjs` falhou por módulo `mealPhoto.ts` inexistente; checkpoint `8d72417`.

GREEN: `node --test --experimental-test-coverage scripts/test-meal-analysis.cjs scripts/test-nutrition.cjs`: 2 arquivos passaram, zero falhas/skips. Garantias: autenticação/indisponibilidade da autoridade, isolamento de path, consentimento/destino, provider ausente503, schema sem kcal, cálculo confirmado, duplicata idempotente e conflito, rate-limit429, formato/tamanho e pipeline canvas por adapter simulado, assinatura privada limitada a60s, proveniência e import sem mutação.

Cobertura V8 dos módulos transpilados: 92,78% linhas / 92,73% branches / 94,20% funções. Canvas real/React/SQL não entram nessa cobertura; teste de canvas usa mocks, não prova remoção EXIF em navegador real. Linhas de coverage referem-se ao JS transpilado.

`npx tsc --noEmit` e `npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck server/meal-analysis.ts` passaram. Nenhum deploy, migration remoto ou chamada de IA realizado.
