/** Ícones de traço único, 24 × 24, herdando a cor do texto. */
const PATHS = {
  play: 'M8 5.5v13l10.5-6.5z',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  timer: 'M12 8v5l3 2M9 2h6M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  breath: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
  meal: 'M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 0-3 3-3 6s1 4 3 4v8',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  dumbbell: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  chart: 'M4 4v16h16M7 15l4-5 4 2 5-7',
  book: 'M4 4h6v16H4zM14 4h6v16h-6z',
  user: 'M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 21v-2a8 8 0 0 1 16 0v2',
  close: 'M6 6l12 12M18 6 6 18',
  info: 'M12 11v6M12 7.5v.5M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
} as const
export type IconName = keyof typeof PATHS

export default function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg className={`icon icon-${name}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={name === 'play' ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={PATHS[name]} /></svg>
}
