import { useEffect, useRef } from 'react'
import type { SlotType } from '../types'
import { moveFor, renderFrame } from '../lib/anim'

interface Props {
  exerciseId: string
  slot?: SlotType
  /** proporção do quadro (largura/altura) */
  ratio?: number
  /** para listas: desenha um quadro parado no pico do movimento */
  still?: boolean
  className?: string
}

/**
 * Ilustração animada da execução. Só anima quando está visível na tela e
 * respeita `prefers-reduced-motion` — numa lista de 70 exercícios isso é a
 * diferença entre rolar liso e derreter a bateria.
 */
export default function ExerciseAnim({ exerciseId, slot, ratio = 1.42, still = false, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const box = wrap.current
    if (!canvas || !box) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const move = moveFor(exerciseId, slot)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const frozen = still || reduced

    let dpr = 1
    let raf = 0
    let visible = false
    const start = performance.now()

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const w = box.clientWidth
      const h = Math.round(w / ratio)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      draw(frozen ? 0.45 : (performance.now() - start) / move.cycleMs)
    }

    const draw = (t: number) => {
      renderFrame(ctx, move, t, { w: canvas.width, h: canvas.height, dpr })
    }

    const loop = () => {
      draw((performance.now() - start) / move.cycleMs)
      raf = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting === visible) return
        visible = e.isIntersecting
        cancelAnimationFrame(raf)
        if (visible && !frozen) loop()
      },
      { rootMargin: '80px' },
    )

    const ro = new ResizeObserver(resize)
    resize()
    ro.observe(box)
    io.observe(box)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
    }
  }, [exerciseId, slot, ratio, still])

  return (
    <div ref={wrap} className={`anim-wrap ${className ?? ''}`}>
      <canvas ref={ref} aria-hidden="true" />
    </div>
  )
}
