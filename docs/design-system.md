# Design system do WinFit

Issue: AURAVIZ-144 (Linear, projeto Winfit). Vitrine viva: `/#/design` (somente em `npm run dev`).

## Princípios
1. **Uma ação principal por tela.** O resto é secundário ou discreto.
2. **Menos texto.** Rótulo curto, apoio em uma linha, detalhe recolhido.
3. **Cor nunca sozinha.** Estado sempre com ícone ou palavra (sucesso, aviso, erro).
4. **Toque confortável.** Alvo mínimo de 44 px; foco visível em todo controle.
5. **Claro e escuro de verdade.** Cada token tem valor nos dois temas; nada de inverter a tela por filtro.

## Fonte única de tokens
`src/design/tokens.css`, prefixo `--ds-*`.

| Grupo | Tokens |
|---|---|
| Superfícies | `bg`, `surface`, `surface-2`, `line`, `line-strong` |
| Texto | `text`, `text-dim`, `text-faint` (todos com contraste mínimo de 4,5:1) |
| Marca | `brand`, `brand-deep`, `brand-ink`, `brand-soft`, `on-brand` |
| Estados | `success`, `warning`, `danger` e a versão `-soft` de cada um |
| Tipografia | `text-xs` 12, `sm` 14, `md` 16, `lg` 20, `xl` 26, `2xl` 34; fontes Geist e Geist Mono |
| Espaço | `space-1…7` = 4, 8, 12, 16, 24, 32, 48 px |
| Raios | `radius-sm` 8, `md` 12, `lg` 16, `xl` 24, `pill` |
| Sombras | `shadow-sm`, `md`, `lg` |
| Movimento | `duration-fast` 120 ms, `base` 200 ms, `ease`; zerados com `prefers-reduced-motion` |
| Camadas | `z-sticky`, `z-tabbar`, `z-modal`, `z-toast` |

Tema: `:root` é claro; `[data-theme="dark"]` força o escuro; sem atributo, segue o sistema.
`scripts/test-design-tokens.ts` garante que o escuro espelha o claro e que os pares de texto passam em 4,5:1.

## Componentes
Em `src/components/ui` (import: `import { Button, Card, Badge, Alert, Field } from '../components/ui'`). Todos aparecem na vitrine `/#/design`.

| Componente | Uso | Observações |
|---|---|---|
| `Button` | `variant`: `primary` (padrão), `secondary`, `quiet`, `danger`; `small`; `icon` | `type="button"` por padrão; passe `type="submit"` em formulários |
| `Card` | `as`: `div`, `section`, `article`, `li` | superfície padrão (`.card`) |
| `Badge` | `tone`: `neutral`, `brand`, `success`, `warning`, `danger` | sempre com texto |
| `Alert` | `tone`: `info`, `warning`, `danger` | `danger` anuncia como `role="alert"` |
| `Field` | `label`, `hint`, `error` + atributos de `input` | rótulo, dica e erro ligados por `aria-*` |
| `Sheet` | `onClose`, `label` ou `labelledBy`, `dismissible`, `className` | painel inferior: fundo inerte, foco preso, Esc e toque fora fecham, foco volta a quem abriu; `data-autofocus` escolhe o foco inicial |
| `confirmDialog` | `title`, `message`, `confirmLabel`, `destructive` | substitui `window.confirm`; devolve `Promise<boolean>`; ação destrutiva em vermelho e foco em Cancelar |

Os componentes reaproveitam as classes existentes (`.btn`, `.card`, `.pill`, `label.field`, `.input`) e acrescentam `alert` e tons de selo em `src/design/components.css`. Por isso adotá-los numa tela não muda a aparência.
`PageTop`, `EmptyState`, `Switch`, `Icon` e `TabBar` seguem como estão.
`scripts/test-ui-components.tsx` cobre variantes, estados e a ligação por aria.

## Estado da migração
| Fase | O quê | Situação |
|---|---|---|
| 1 | Tokens `--ds-*`, vitrine `/design`, guia e teste de contraste | feita |
| 2 | ~330 cores fixas em hex trocadas por tokens; filtro `invert` do modo escuro removido; variáveis antigas (`--bg`, `--accent`…) agora apontam para os tokens | feita (em revisão) |
| 3 | Componentes React (`Button`, `Card`, `Field`, `Badge`, `Alert`) criados e adotados na Alimentação e no PoC de refeições; demais telas ainda usam as classes soltas | feita em parte |
| 4 | Revisão em 320/390 px, claro e escuro, em todas as telas | pendente |

## Auditoria (24/11/2026)
- ~370 cores em hex nos 6 CSS; dezenas de roxos quase iguais (`#7450bd`, `#7952bc`, `#7657e8`…).
- Modo escuro automático feito por `filter: invert` sobre o tema claro (removido na fase 2).
- Mais de 10 raios de borda diferentes (14, 16, 18, 20, 24 px e variáveis).
- Tamanhos de fonte soltos por tela.

## Cores em CSS
- `scripts/test-no-raw-colors.ts` falha se houver hex opaco fora de `src/design/tokens.css`.
- Exceções: ilustrações em tinta (`fill`, `stroke`, `mask`) e cores com transparência (`#rrggbbaa`).
- As variáveis antigas continuam existindo em `styles.css` (`:root`), mas só como apelidos dos tokens. Em código novo, use `--ds-*`.
- Ilustrações em tinta ficam sobre `--ds-paper` (claro nos dois temas).

## Painéis e confirmações
- Use `Sheet` para qualquer painel inferior; não monte `.modal-back` na mão.
- Use `await confirmDialog({...})`; `confirm()`, `alert()` e `prompt()` são barrados por `scripts/test-sheet.tsx`.
- `WatchModal` ainda tem foco e Esc próprios; migrar para `Sheet` fica para a fase 3b.

## Não fazer
- Cor nova em hex dentro de um componente: crie ou reutilize um token.
- Raio ou espaço fora da escala.
- Estado só por cor.
- Segunda ação primária na mesma tela.
