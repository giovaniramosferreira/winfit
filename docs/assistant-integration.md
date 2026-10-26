# Assistente remoto — contrato desativado por padrão

Implementação local preparada, sem fornecedor contratado/configurado, sem chamadas de IA e sem alteração da UI do Assistente.

`src/lib/assistantApi.ts` exporta `assistantApi` com `available: false`, `createAssistantApi(config, fetcher?)`, `validateAssistantPayload`, `validateAssistantAnswer` e `ASSISTANT_CONSENT_VERSION`.

Para habilitar no futuro, passar endpoint relativo exato `/api/assistant` ou HTTPS sem credenciais/query/hash e o destino explícito com fornecedor/região. Esse objeto configura transporte, não comprova que o backend/provider estejam ativos. UI só deve oferecer envio quando a configuração real for aprovada e o serviço validado. Falha503 deve manter as explicações locais acessíveis.

## Dados permitidos

```json
{
  "version": 1,
  "question": "Como organizar meu treino hoje?",
  "context": {
    "mode": "home",
    "availableMinutes": 20,
    "equipment": ["peso_corporal"]
  },
  "consent": {
    "send": true,
    "destination": "FORNECEDOR E REGIÃO CONFIGURADOS",
    "version": "assistant-consent-v1"
  }
}
```

Pergunta não vazia até1000 caracteres; tempo inteiro5–180; equipamento pertence à lista do domínio e não se repete. Chaves extras são rejeitadas em todos os níveis. Não enviar biometria, IDs de conta, logs completos, plano completo, sintomas ou notas clínicas como campos adicionais. Pergunta livre pode conter dados pessoais digitados pelo usuário; a futura UI precisa mostrar o payload e destino antes do consentimento. O contexto textual local `buildAssistantContext` não é enviado automaticamente nem aceito como substituto deste schema.

`ask(payload,accessToken,idempotencyKey,signal?)` valida antes do fetch, usa bearer sem chaves de provider, bloqueia redirects, limita resposta a20 KB e aceita apenas `{answer:string}` até4000 caracteres, sem ações/plano/tools. O resultado deve ser renderizado como texto, nunca HTML. Nenhum módulo importa a store do treino ou aplica adaptações.

## Backend

`server/assistant.ts` exporta `createAssistantHandler(deps)` com dependências injetadas:

- `authenticate(bearer)`: autoridade real que verifica a sessão, retorna `{id}` ou null. Decodificar JWT não basta.
- `destination`: fornecedor/região exatos apresentados no consentimento.
- `provider({question,context,instructions})`: apenas texto e contexto mínimo; não recebe token de usuário, identificador ou plano. Instruções delimitam explicações sem diagnóstico/protocolo clínico/ferramentas. Não há adapter de provider nesta entrega.
- `coordinator.run(userId,key,fingerprint,task)`: reserva atômica durável por usuário/namespace do assistente, quota e resultado idempotente. Sem coordenador,503. Testes usam memória somente como fake; não há proteção distribuída operacional implementada. Definir timeout/lease/custo por conta e política de retenção antes de produção.

Request POST JSON limitado por stream a8 KB; header Idempotency-Key de12–128 caracteres. Hash SHA-256 do payload evita reutilizar chave para pergunta/contexto/destino diferentes. Retorno401 sessão inválida;403 sem consentimento/destino correspondente;400 schema inválido;409 consulta em andamento/conflito;429 quota;503 ausência de provider/coordenador ou autenticação indisponível;502 falha/schema inválido do provider. Não há logs de pergunta, tokens ou payload. Respostas usam Cache-Control:no-store.

## Gates de ativação

1. Selecionar/aprovar fornecedor, região, retenção, limites e custo; configurar somente no backend.
2. Integrar rota autenticada, autoridade verificável e coordenador transacional com testes de duas contas, concorrência, expiração de pending, falha e repetição.
3. Integrar preview de dados mínimos/consentimento granular na UI; nunca reutilizar consentimento local como consentimento de envio. Desativar envia nada e mantém fallback local.
4. Benchmark de explicações em português, abstensão clínica, segurança e dados sensíveis; testar que resposta nunca altera o plano sem proposta/aceitação local.

Nenhuma etapa remota ou contratação foi realizada. O código é preparação revisável para essas integrações.

## Evidência TDD

RED: `node scripts/test-assistant-api.cjs` falhou por módulo `server/assistant.ts` ausente; checkpoint `c47bdce`.

GREEN: `node --test --experimental-test-coverage scripts/test-assistant-api.cjs` passou (1 arquivo, zero falhas/skips). Cobertura V8 dos módulos JS transpilados:100% linhas,91,60% branches,100% funções. Não inclui UI, autoridade real ou fornecedor.

Garantias testadas: autenticação, consentimento/destino, schema mínimo rejeitando dados extras, limites de pergunta/contexto/request/response, provider/coordenador ausentes503, duplicata idempotente e conflito, busy409 e quota429, resposta textual sem ações, transporte desativado, HTTPS/config segura e validação antes de enviar.

`npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck server/assistant.ts` passou. Testes usam somente callbacks/fetch falsos, sem rede paga.
