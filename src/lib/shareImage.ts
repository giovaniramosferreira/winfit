/** Imagem de resumo (1080 × 1350) desenhada no aparelho; nada é enviado sem o gesto da pessoa. */
export interface ShareCard { title: string; subtitle: string; stats: [string, string][] }

export async function renderShareCard(card: ShareCard): Promise<Blob> {
  const W = 1080, H = 1350
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw Error('Canvas indisponível')
  const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#7450bd'); bg.addColorStop(1, '#4f2f8f')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#ffffff14'; ctx.lineWidth = 90; ctx.beginPath(); ctx.arc(W - 120, 160, 260, 0, Math.PI * 2); ctx.stroke()
  const font = (w: number, size: number) => `${w} ${size}px Geist, system-ui, sans-serif`
  ctx.fillStyle = '#fff'; ctx.font = font(650, 56); ctx.fillText('WinFit', 90, 140)
  ctx.font = font(600, 104); wrap(ctx, card.title, 90, 420, W - 180, 116)
  ctx.fillStyle = '#e6dbf8'; ctx.font = font(450, 46); ctx.fillText(card.subtitle, 90, 640)
  card.stats.slice(0, 4).forEach(([value, label], i) => {
    const x = 90 + (i % 2) * 460, y = 760 + Math.floor(i / 2) * 250
    ctx.fillStyle = '#ffffff1f'; roundRect(ctx, x, y, 420, 210, 36); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = font(600, 76); ctx.fillText(value, x + 40, y + 110)
    ctx.fillStyle = '#e6dbf8'; ctx.font = font(450, 36); ctx.fillText(label, x + 40, y + 170)
  })
  return await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(Error('Falha ao gerar imagem')), 'image/png'))
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, line: number) {
  const words = text.split(' '); let row = ''; let yy = y
  for (const word of words) {
    const test = row ? `${row} ${word}` : word
    if (ctx.measureText(test).width > max && row) { ctx.fillText(row, x, yy); row = word; yy += line } else row = test
  }
  ctx.fillText(row, x, yy)
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

/** Compartilha pelo menu do sistema quando possível; senão, baixa o arquivo. */
export async function shareOrDownload(blob: Blob, name: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], name, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: 'Meu treino no WinFit' }); return 'shared' }
    catch (error) { if ((error as Error).name === 'AbortError') return 'cancelled' }
  }
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
