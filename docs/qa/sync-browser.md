# QA browser de sincronização

2026-10-26T19:09:00.652Z · Chrome headless · http://127.0.0.1:5174/

Configuração sintética: host winfit-test.invalid, chave pública fictícia. Todo HTTP externo interceptado; nenhuma chamada real ao Supabase ou relay. Dados e credenciais de teste sem identidade real.

- PASS: Sem dados locais restaura plano remoto sem onboarding e sem envio automático
- PASS: Local ativo é preservado ao entrar sem backup remoto; envio privado desligado por padrão
- PASS: Revisão remota oferece download; merge preserva ativos distintos sem enviar módulos privados
- PASS: Opt-in explícito envia três módulos privados
- PASS: CAS PATCH sem linhas retorna falha e nunca confirmação
- PASS: Logout interrompe novos envios e remove sessão local
- PASS: Troca accountA→accountB exige confirmação; dismiss não envia POST
- PASS: Logout durante restore lento não ressuscita sessão ou grava credenciais
- PASS: Excluir remoto usa DELETE CAS e mantém dados locais
- PASS: Exportar arquivo completo e importar preserva módulos e sessão ativa



Pageerrors: 0. Sem validação de RLS real ou backend hospedado; estes testes verificam contrato cliente com respostas simuladas.
