# Autoridade de autenticação do backend — 26/10/2026

Parte de AURAVIZ-72/98/99. Jornada: uma consulta futura de IA só pode usar a identidade confirmada pelo Supabase; falha de autenticação impede acesso ao fornecedor. Esta entrega prepara o adaptador, sem criar serviço, alterar credenciais ou habilitar IA.

## Comportamento

`server/supabaseAuth.ts` exporta `createSupabaseAuthenticator({url,publicKey,timeoutMs?},fetcher?)`. A factory aceita apenas origem HTTPS sem credenciais, caminho, query ou fragmento. Configuração vem do backend, nunca da requisição. Usar chave pública/publishable do projeto; não precisa de service-role.

Cada chamada faz GET `/auth/v1/user` com bearer e apikey, sem cache e sem redirects. Retorna somente `{id}` UUID confirmado pela autoridade. Não decodifica JWT, não confia em ID enviado pelo cliente, não persiste sessão e não compartilha identidade entre chamadas. Segue a orientação de [getUser do Supabase](https://supabase.com/docs/reference/javascript/auth-getuser): consultar a autoridade para obter identidade utilizável em autorização.

401/403 retornam null; indisponibilidade, limite remoto, resposta inesperada e JSON inválido lançam erro genérico. Os handlers existentes traduzem indisponibilidade em503 e sessão inválida em401. Não há log de tokens, resposta bruta, email ou metadados. Timeout padrão5s (configurável1–30000ms) inclui cabeçalhos e corpo; corpo limitado a64KiB pelos bytes efetivamente recebidos. Cancelamento/overflow/resposta tardia não autoriza a chamada.

Integração futura: passar o retorno da factory como `authenticate` para `createAssistantHandler` e `createMealAnalysisHandler`. Isso não substitui RLS, consentimento, coordenador durável, sanitização de fotos ou configuração do fornecedor. Nenhum destes handlers ganhou rota pública nesta entrega.

## Evidência

- RED: `node scripts/test-supabase-auth.cjs` falhou porque `server/supabaseAuth.ts` ainda não existia. Checkpoint `11f60bc` na branch desta tarefa.
- GREEN: `node --test --experimental-test-coverage scripts/test-supabase-auth.cjs scripts/test-assistant-api.cjs`:2 arquivos passaram; módulos transpilados100% linhas,95,91% branches,84% funções no conjunto. Adaptador100% linhas/98,18% branches; callbacks de cancelamento simulados não representam rede real.
- `npm test`:23/23 suítes passaram, incluindo as56.000 combinações do gerador.
- `npm run build`, typecheck separado do adaptador e `git diff --check`: passaram.
- Revisão independente de segurança/correção: nenhum bloqueio encontrado.
- `npm audit --omit=dev`: mantém2 vulnerabilidades moderadas preexistentes em React Router; dependências não foram alteradas neste lote.

| Garantia | Teste | Tipo |
| --- | --- | --- |
| Duas contas não compartilham identidade; toda chamada consulta autoridade | `scripts/test-supabase-auth.cjs` | Unitário com transporte simulado |
| Entrada/configuração inválida não envia token | mesmo arquivo | Unitário |
| Somente401/403 significam sessão inválida; demais falhas não viram sucesso | mesmo arquivo | Unitário |
| Overflow em múltiplos chunks ignora Content-Length mentiroso e cancela corpo | mesmo arquivo | Unitário |
| Timeout cobre corpo travado e resposta tardia não autentica | mesmo arquivo | Unitário |
| Rejeição/indisponibilidade bloqueiam handler antes do fornecedor | mesmo arquivo | Integração de módulos com autoridade simulada |

Não foi feita consulta a contas reais, teste RLS remoto, migration ou deploy de backend. Nenhuma alteração de interface; validação visual não se aplica a este adaptador.

## Próximos passos operacionais

Conectar este adaptador no runtime escolhido, implementar coordenador transacional e testar duas contas reais isoladas. A ativação continua dependendo de fornecedor/região, custo/limites/retenção e configuração autorizada. Contrações Kegel continuam dependendo de revisão profissional.

## Autoavaliação

Precisão4/5: testes e build comprovados, autoridade real ainda não exercitada. Completude3/5: conclui este adaptador, mas backend operacional e gates externos seguem pendentes. Clareza4/5: contrato/limites explícitos, documentação técnica ainda exige implementação do runtime. Ação4/5: código integrável e testes reproduzíveis, sem ativação remota. Concisão4/5: evidência concentrada neste arquivo. Média3,8/5; prioridade seguinte é integrar runtime e coordenação durável antes de configurar fornecedor.
