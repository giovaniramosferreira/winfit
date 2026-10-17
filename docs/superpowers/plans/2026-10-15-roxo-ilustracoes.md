# Tema roxo e ilustrações em tinta

**Pedido:** restaurar a identidade roxa anterior mantendo funcionalidades e aplicar a referência de desenho humano em tinta/hachura às ilustrações.

**Direção:** recuperar a paleta do commit `8ea08d8`, fontes sem serifa, cartões e controles arredondados. Manter rotas, sessões, dados, calistenia e integração Watch. Trocar metáforas editoriais por linguagem direta. Ilustrações originais em fundo claro, contorno corporal e hachuras; usar SVG animado controlável em vez de GIF para manter pausa, nitidez e baixo tamanho.

- [x] Desenhar um personagem vetorial articulado com contornos, shorts hachurados e detalhes de mãos/pés para todas as demonstrações existentes.
- [x] Uniformizar as pranchas anatômicas com tinta/hachura em fundo claro, preservando a identificação muscular.
- [x] Recuperar tema roxo, navegação e linguagem direta; atualizar cores de instalação e ícones.
- [x] Verificar transições das poses, controles e cobertura de movimentos, regressões de calistenia, build e fluxo visual no navegador em celular e desktop.

Não reproduzir o desenho de referência nem sua marca-d'água. Não importar mídia sem licença. Não remover funcionalidades nem apagar dados locais. Novas artes são vetoriais originais geradas no projeto.

## Verificação em 15/10/2026

- `npm run build`: TypeScript, bundle e PWA concluídos.
- `scripts/test-illustrations.ts`: 4 testes passaram, cobrindo 78 IDs, topologia das poses, ausência de mídia externa, mapa muscular, apoios e âncoras específicas.
- `scripts/test-calisthenics.ts`: 12 testes passaram. Suítes de treino em casa e integração Watch também passaram.
- Navegador local: Home roxa em desktop e celular (390×844); biblioteca com 78 exercícios; reprodução com mudança de pose e pausa; player existente; alternativas mais fácil/difícil; troca para flexão com joelhos e preservação após recarregar; progresso com repetições/segundos. Sessão vazia de conferência descartada, sem novas séries no histórico.
- Revisão independente identificou incoerências de âncoras, flexora, abdução, pull-apart e panturrilhas. Corrigidas com poses e equipamentos específicos; bancos, pranchas e halteres também ajustados.
- Limite da evidência: cobertura técnica e inspeção visual não equivalem a validação biomecânica profissional dos 78 desenhos. Aparelhos e figuras são esquemáticos.
