/** Lógica pura dos painéis (testável sem navegador). */

export const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])'

/** Próximo índice de foco dentro do painel; Tab no último volta ao primeiro e Shift+Tab no primeiro vai ao último. */
export function nextFocusIndex(current: number, count: number, backwards: boolean): number {
  if (count <= 0) return -1
  if (current < 0) return backwards ? count - 1 : 0
  return backwards ? (current - 1 + count) % count : (current + 1) % count
}

/** Pilha de painéis abertos: só o do topo reage a Esc. */
export function createSheetStack() {
  const stack: symbol[] = []
  return {
    push(id: symbol) { stack.push(id) },
    remove(id: symbol) { const i = stack.indexOf(id); if (i >= 0) stack.splice(i, 1) },
    isTop(id: symbol) { return stack.length > 0 && stack[stack.length - 1] === id },
    get size() { return stack.length },
  }
}
