# WinFit intuitivo — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Todas as entregas exigem revisão do agente usability_critic antes da integração.

**Goal:** Tornar ações frequentes óbvias e curtas, preservando histórico, privacidade e regras de treino.

**Architecture:** Reorganizar apresentações existentes e reutilizar componentes de demonstração e backup. Nenhum serviço de IA novo, alteração de protocolos clínicos ou migração destrutiva. Navegação principal preservada; Perfil passa a oferecer acesso direto a ferramentas retiradas da Home.

**Tech Stack:** React 18, React Router, Zustand, CSS, testes Node/tsx e navegador.

## Contrato de usabilidade

- Uma ação principal por contexto; rótulos de verbo+objeto.
- Ações frequentes visíveis; detalhes secundários em Info ou expansões. Não trocar uma tela longa por sequências intermináveis de diálogos.
- Botões de pelo menos44px para toque; foco visível, estado selecionado e nomes acessíveis.
- Todo painel tem Fechar/Cancelar visível, Escape e foco coerente. Cancelar não grava.
- Respeitar movimento reduzido. Catálogos/históricos podem rolar; telas de execução devem caber sem cortar controles.
- Dados reais do usuário nunca em fixtures, commits, relatórios públicos ou novos serviços.
- Restrições Kegel e consentimentos Watch permanecem explícitos; nenhum texto promete IA indisponível.

## Divisão e ownership

1. **Conta/estrutura:** Profile.tsx, DataControls.tsx, WatchModal.tsx, estilos próprios novos. Sem editar stores salvo defeito demonstrado e coordenado.
2. **Exploração/treino:** Library.tsx, ExerciseDetail.tsx, Progress.tsx, SessionDetail.tsx, Training.tsx, componentes de miniatura reutilizáveis e estilos próprios.
3. **Bem-estar/ferramentas:** Nutrition.tsx, MealPhotoDraft.tsx, Pelvic.tsx, Routine.tsx, Assistant.tsx, estilos próprios.
4. **Crítico:** somente plano e relatório de revisão; não produto. Root integra CSS global/rotas se necessário.

Trabalhar em duas ondas se limite de agentes impedir as três frentes simultâneas. Não editar arquivo de outra frente sem acordo. Cada frente envia diff, testes e contagem de cliques ao crítico.

## Tarefas e critérios de aceite (18 observações)

### Frente1 — conta e estrutura

- [x] Perfil: título curto e grupos Meu plano, Equipamentos, Conta e backup, Integrações. Plano e ações frequentes inicialmente visíveis; detalhes opcionais recolhidos. Incluir acessos Minha rotina e Adaptar treino, evitando ferramentas órfãs.
- [x] Ajustar plano: Fechar/Cancelar explícito; estado inicial corresponde ao perfil atual em cada abertura; resumo das mudanças antes de gerar. Cancelar sem regenerar nem alterar draft.
- [x] Equipamentos: Editar equipamentos direto em Perfil, sem nove perguntas. Preservar limites/perfil; explicar que novo plano será gerado e antigo arquivado. Local academia completa coerente com seleção.
- [x] Watch: etapas Conectar / Adicionar atalho / Testar ou instrução verificável. Consentimento antes de envio, não esconder destino e posse do código. Opções manuais recolhidas; não inventar teste remoto.
- [x] Backup: rótulo Importar dados, contagens e plano reconhecido, escolha clara Manter meu plano / Usar plano importado, estado ativo explicado e recuperação acessível. Preservar caminho treino-only para módulo inválido.

### Frente2 — exploração e treino

- [x] Calistenia: sessão de academia ativa deve aparecer como aviso compacto separado, sem halteres/polia parecerem proposta de Calistenia. Mostrar proposta própria e ação Retomar academia; não permitir duas sessões simultâneas silenciosas.
- [x] Biblioteca: título curto, busca de destaque, miniaturas existentes por exercício, sem números internos/latim na lista. Filtro compacto acessível, resultados e limpeza de busca/filtro óbvios.
- [x] Exercício: demonstração autoplay, instruções práticas primeiro, anatomia secundária expansível; equipamento e unidade claros, sem instruções duplicadas.
- [x] Retorno: Voltar respeita origem Biblioteca/Treino/Progresso. Não rotular Voltar ao treino apenas porque há sessão ativa. Entrada direta deve ter destino seguro.
- [x] Progresso: remover contagem duplicada, período explícito selecionável, frequência/volume/resultados compreensíveis. Nunca chamar somatório de carga de gasto/força. Preservar unidades kg/reps/seg.
- [x] Sessão: resumo curto e miniaturas; detalhes de séries expansíveis; singular/plural correto, status parcial explícito e preservado. Acesso ao exercício em uma ação.

### Frente3 — bem-estar e ferramentas

- [x] Saúde pélvica: uma frase honesta sobre respiração disponível/Kegel indisponível; reduzir cabeçalho e metadados técnicos; instruções essenciais preservadas antes início. Não liberar protocolo pendente nem gerar alegações clínicas.
- [x] Alimentação: data, consumo/meta e Adicionar refeição visíveis primeiro. Informação de dados incompletos correta; ausência de refeição não diz todos itens completos. Detalhes técnicos recolhidos.
- [x] Foto: integrar ao formulário/refeição ou reduzir para referência opcional recolhida; deixar descarte transparente antes seleção. Não prometer persistência inexistente nem enviar imagem.
- [x] Rotina: Agenda/Checklist/Check-in como abas reais, somente painel ativo visível; manter avisos devido e estado salvo, não gravar por trocar aba.
- [x] Fuso: detecção automática já disponível como padrão, seletor amigável cidades com opção avançada para demais fusos. Sem gravar nova preferência até confirmação explícita.
- [x] Assistente: chamar Adaptar treino, ação principal formulário imediato; contexto técnico secundário e opt-in intacto. Não fingir chat IA.
- [x] Prévia adaptação: antes/depois, duração e alterações reais, miniaturas; Aplicar/Cancelar inequívocos, aplicar apenas após confirmação, baseline guard preservado.

## Jornadas e orçamento de ações

Contar toque/clique discreto, sem contar digitação. Medir antes/depois no fluxo real; números abaixo são metas, não medições.

| Jornada | Antes observado | Meta |
|---|---|---|
| Equipamentos desde Perfil | Refazer perguntas + até9 etapas | Editar + selecionar + confirmar, sem perguntas alheias |
| Abrir execução desde Biblioteca | Abrir exercício + Reproduzir | Abrir exercício, animação automática |
| Entender exercício | navegar extensa anatomia | instruções na abertura; anatomia1 expansão |
| Trocar seção Rotina | clique + rolagem sobre outras seções |1 clique em aba |
| Adaptar treino | chamada inicial + rolar ao formulário + prévia | formulário inicial + Ver proposta + Aplicar |
| Cancelar ajuste | clicar fora sem indicação |1 clique em Cancelar/Fechar |
| Importar backup | escolher arquivo + interpretar checkboxes ambíguas | escolher arquivo + escolha plano explícita + confirmar |
| Consultar séries históricas | rolar todas séries | resumo inicial +1 expansão do exercício desejado |

## Validação por tarefa

- [ ] Adicionar/ajustar testes de comportamento onde houver lógica nova: retorno, seleção de período, abas, edição equipamentos, preservação de importação, proposta antes/depois.
- [ ] Testes de cancelamento provam ausência de mutação; dados de teste sintéticos.
- [ ] Rodar testes relevantes e npm run build; rever diff para alterações não solicitadas.
- [ ] Enviar ao crítico: arquivos, decisão UX, cliques medidos, testes e limitações; resolver todas críticas materiais.
- [ ] Root revisa navegador em largura móvel (~390px) e desktop; verificar overlays/teclado/foco e nenhuma ação coberta pela navegação/mini-player.
- [ ] Rodar npm test completo e build integrado após todas frentes aprovadas.
- [ ] Não publicar automaticamente; esta rodada é local até revisão final do usuário.

## Gate do crítico

PASS exige: fluxo principal encontrável sem instrução externa, ação com rótulo coerente, saída explícita, dados preservados, controles móveis usáveis, nenhuma promessa de backend inexistente. Reportar observação com cenário e efeito, não preferência estética isolada. Uma entrega com aumento de cliques pode passar apenas quando remove ambiguidade material ou evita alteração involuntária e justifica o custo.

### Evidência Frente1

Crítico aprovou revisão de código em 29/10/2026. Build integrado passou; testes application-backup, watch-sync e profile-preferences passaram. O teste de preferências comprova draft imutável e preservação de limites/objetivo; não simula cancelamento na interface. Inspeção do fluxo de código: editar equipamentos agora abre um painel e exige confirmação explícita, em vez de refazer até nove perguntas; seleção depende dos equipamentos escolhidos. Não houve contagem visual de cliques nem teste móvel nesta frente; revisão de foco/overlay no navegador fica com root.

## Revisão do crítico — 29/10/2026

**PASS de código e testes das três frentes.** Root mantém responsabilidade pela validação visual integrada e testes completos antes da conclusão.

Correções exigidas e atendidas: indicadores semanais independentes de filtro do histórico; fallback de retorno interno; status pulado/substituído no resumo; foco Watch estável e inclusivo; áreas de toque44px; plano importado ausente desabilitado; descarte de foto ao salvar/cancelar explícito antes seleção.

Evidência executada pelo crítico: `node --import tsx scripts/test-wellness-usability.tsx` e `node --import tsx scripts/test-profile-preferences.ts` passaram. Root reportou teste cross-mode, suíte completa anterior29/29 e build; rerun final integrado pendente.

Reduções comprováveis pelo fluxo de código: abrir exercício remove clique Reproduzir; acessar equipamentos deixa de exigir perguntas alheias; adaptar abre formulário sem botão intermediário; Rotina troca painel com1clique sem rolar outras seções. Nenhuma contagem apresentada como medição visual quantitativa.

Não incluído por limite explícito: backend IA, liberação clínica Kegel, persistência de foto, sincronização de dados privados entre aparelhos. Interfaces deixam essas disponibilidades claras. Não houve publicação nesta rodada.

## Verificação integrada final

31/31 suítes e build passaram. Root conferiu em390px Perfil/modal equipamentos/cancelamento, Biblioteca/miniaturas/detalhe, filtro Progresso, Rotina/Checklist, Adaptar treino e Saúde pélvica. Sem gravação de dados de teste. Alimentação e saúde pélvica locais têm dados preexistentes ilegíveis preservados; fluxos saudáveis cobertos por testes sintéticos. CSS integrado em main.tsx para testes SSR. Produção não publicada nesta rodada.
