type ModuleId = 'gym' | 'home' | 'pelvic' | 'nutrition'

/** Decorative illustrations: the adjacent link text supplies the accessible name. */
export default function HomeArtwork({ module }: { module: ModuleId }) {
  if (module === 'gym' || module === 'home') {
    return <div className={`home-module-art home-module-art-${module}`} aria-hidden="true">
      <span className="home-art-orbit" />
      <svg viewBox={module === 'gym' ? '0 480 480 480' : '480 0 480 316'}>
        <defs><clipPath id={`home-art-${module}`}><rect x={module === 'gym' ? 0 : 480} y={module === 'gym' ? 480 : 0} width="480" height={module === 'gym' ? 480 : 316} /></clipPath></defs>
        <image clipPath={`url(#home-art-${module})`} href={module === 'gym' ? '/media/catalog/agachamento-barra.webp' : '/media/catalog/flexao-joelhos.webp'} width="1440" height={module === 'gym' ? '960' : '632'} />
      </svg>
    </div>
  }
  return <div className={`home-module-art home-module-art-${module}`} aria-hidden="true">
    <svg viewBox="0 0 200 160" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {module === 'nutrition' ? <>
        <ellipse cx="103" cy="137" rx="63" ry="5" fill="currentColor" opacity=".06" stroke="none" />
        <circle cx="104" cy="78" r="58" fill="#eee5d9" stroke="#aa96b7" />
        <circle cx="104" cy="78" r="47" fill="#faf6ef" stroke="#c6b6ca" />
        <path d="M65 78c-5-14 1-29 15-31 6 4 10 12 6 23-7 2-14 5-21 8Z" fill="#b6adc5" />
        <path d="M70 71 80 53m-6 11-5-3m8-3 5 2M91 44c12-7 28-5 32 7-3 11-17 14-29 10" fill="#d6c5df" />
        <path d="M98 49c6-1 11 0 15 4M95 55l10 3M109 86c6-11 23-18 31-7 4 9-4 20-16 24-10-1-17-7-15-17Z" fill="#d4b99f" />
        <path d="m119 83 5 4m2-9 5 4m-14 9 5 4m4-7 5 4" />
        <path d="M77 91c7-4 14-1 14 6s-5 12-11 9-10-11-3-15Z" fill="#beabc7" />
        <path d="m98 105 2-6m-7 9 1-5m12 7 2-6m-9 12 1-5" />
        <path d="M24 32v26c0 7 13 7 13 0V32m-6 0v98M175 31c-8 8-12 24-12 39h12m0-39v99" />
        <path d="m139 20 4-8m4 12 8-3M54 125l-5 7" stroke="#a086b5" />
      </> : <>
        <circle cx="100" cy="76" r="62" stroke="#cbbdd6" strokeDasharray="3 6" />
        <circle cx="100" cy="76" r="46" stroke="#d9cfdf" />
        <ellipse cx="100" cy="142" rx="62" ry="5" fill="currentColor" opacity=".07" stroke="none" />
        <path d="M91 29c-9 3-12 13-8 23 3 8 13 12 20 5 7-8 9-22-1-27-3-2-7-2-11-1Z" fill="#f6eee4" />
        <path d="M83 42c-3-12 8-19 17-13 5 2 8 8 7 13-4-1-7-4-9-8-2 5-8 8-15 8Z" fill="#7a648f" />
        <path d="M84 62c-9 2-12 9-16 20l-9 18m44-39c10 1 15 8 20 19l10 20" />
        <path d="M85 61c-3 14-7 30-4 43h33c3-14-2-29-9-43" fill="#c2afd4" />
        <path d="m86 106-29 14c-15 10-9 21 9 19l32-11 32 11c18 2 25-9 10-19l-28-14" fill="#e1d4e9" />
        <path d="m78 117 22 10 22-10M58 100l-8 5m83-5 8 5M81 45l4 1m14 0 4-1m-13 7c2 2 4 2 6 0" />
        <path d="M30 74c-4-7-3-14 3-20M165 56c5 5 7 11 5 18" stroke="#a58bbd" />
        <path d="m26 59 7-5 1 8m131 4 5 8 5-6" stroke="#a58bbd" />
      </>}
    </svg>
  </div>
}
