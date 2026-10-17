# Player com espaço de iPhone

Objetivo: manter registro de séries, descanso e navegação acessíveis em390×844, preservando desenho completo, tema roxo e funções. A ficha detalhada pode rolar; o player prioriza a execução.

- [x] Reproduzir em produção e medir: viewport390×844, documento1033px, segunda série termina em872px e navegação em1017px.
- [x] Limitar `.player` a 100dvh, manter cabeçalho/rodapé e permitir rolagem central quando necessária.
- [x] Compactar apenas a demonstração do player: preservar proporção via variável CSS da arte, limitar altura, colocar reprodução no cabeçalho e manter instruções completas em Como fazer e descrição acessível.
- [x] Reduzir a arte durante descanso e manter controles de pelo menos 44px. Descanso movido para o rodapé, sempre acessível junto à navegação.
- [x] Conferir no navegador em 390×844, 390×700 e 375×667: primeira série, editor, descanso, próxima série e troca de exercício. Medir posições e testar ausência de corte/distorção.
- [x] Executar build e regressões de ilustrações/calistenia: build aprovado, 28 testes de funcionalidades/ilustrações e 4 do empacotador aprovados.
- [ ] Publicar a versão conferida no serviço Winfit já autorizado e verificar no endereço público.

Arquivos: `src/styles.css` (layout e regras do player), `src/components/IllustratedExerciseDemo.tsx` (proporçãoCSS e estado de erro), `src/pages/Player.tsx` (estado visual do descanso). Não alterar regras de treino, dados ou artes.

## Resultado da conferência local

- Antes: documento de 1033px em viewport 390×844; segunda série e navegação abaixo da tela.
- Depois em 390×844: documento de 844px, sem excesso horizontal; duas séries, ações e navegação visíveis. Desenho horizontal medido em 289,36×168,78px, preservando proporção 12:7.
- Em alturas de 700 e 667px: documento limitado à tela; rolagem central permanece disponível para textos adicionais. Séries, descanso e navegação acessíveis, sem comprimir alvos de toque.
- Editor em 375×667: botão Registrar série entre y597–647, inteiramente visível.
- Jornada local com perfil fictício isolado em localhost: Corpo inteiro B, quatro exercícios, oito séries, 120 repetições; resumo confirmou treino completo. Animação reproduz/pausa; Como fazer permite voltar ao treino preservando registros.
- Limite: simulação de viewport no navegador, sem teste em aparelho físico ou Safari iOS. Safe areas continuam usando as variáveis existentes.
