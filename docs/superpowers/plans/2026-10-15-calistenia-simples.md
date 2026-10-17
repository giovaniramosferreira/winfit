# Calistenia simples — implementação

**Objetivo aprovado:** melhorar o bloco de calistenia aproveitando o player, com mídia original, alternativas sem apoios improvisados e progresso por repetições e tempo.

**Arquitetura:** manter sessões, persistência, descanso e histórico existentes. Compartilhar regras de equipamento e unidade entre gerador, player e resumo. Usar demonstrações SVG originais locais, sem bibliotecas ou serviços de mídia.

## Etapas

- [x] Escrever e executar regressões para planos sem equipamentos, alternativas da flexão, troca entre repetições e segundos, preservação de séries e métricas sem carga.
- [x] Centralizar filtro sem apoios e unidade temporal; adicionar flexão com joelhos e pranchas com joelhos; oferecer alternativas com dificuldade identificada e limites do perfil.
- [x] Criar demonstrações ilustradas locais para os movimentos do ciclo e suas alternativas, com reprodução controlada, explicação e origem documentada.
- [x] Integrar ao player e às fichas sem duplicar a navegação. Remover a coluna de carga para peso corporal. Mostrar séries, repetições e segundos nos resumos e progresso, mantendo métricas de carga para musculação.
- [x] Executar build, regressões de calistenia, gerador e Watch. Testar no navegador: demonstração, alternativa, registro, descanso, reload, conclusão, histórico e tela estreita.
- [x] Revisar a mudança e registrar as verificações.

## Critérios

Nenhuma mídia do BetterMe. Nenhum download de mídia remota. Nenhuma dependência nova. Não perder registros ao trocar variações; impedir troca após iniciar séries desse exercício, explicando o motivo. Mudança entre exercício temporal e de repetições recalibra a faixa. Não somar segundos como repetições. Arquivos do usuário e planos de academia preservados.

## Verificação e revisão

- Regressões demonstradas antes da correção; suíte final de 12 testes de calistenia passou.
- Suíte existente de casa e integração Watch passaram; gerador: 56.000 combinações, zero falhas.
- Build de produção passou. Nenhuma dependência adicionada.
- Revisão independente identificou três casos, todos reproduzidos e corrigidos com regressão: contexto de sessões comuns/legadas sem equipamento, semana de calistenia com musculação antiga e unidade nas mensagens Watch. O teste visual revelou ainda um rótulo acessível de gráfico em kg, coberto por regressão e corrigido.
- Navegador: sessão completa de dez séries, troca da flexão e do core, reload, descanso, histórico, gráfico e largura 390 × 844. Console sem erros/avisos na verificação final. Sessões de teste são fictícias.
- Mídia: 16 demonstrações vetoriais originais locais, documentadas em `docs/media-licenses.md`. As isometrias mostram uma posição sustentada, sem simular repetições.
