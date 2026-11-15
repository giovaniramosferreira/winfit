import { useState } from 'react'

const TABS = ['Seu treino', 'Alimentação', 'Rotina'] as const

/** Prévia ilustrativa e interativa: não usa nem representa registros reais da pessoa. */
export default function LandingPreview() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Seu treino')
  return <figure className="welcome-preview" aria-label="Prévia ilustrativa de um treino no WinFit">
    <div className="welcome-preview-orbit" aria-hidden="true" />
    <div className="welcome-preview-note"><span aria-hidden="true">↗</span> Seu tempo.<br /><strong>Seu movimento.</strong></div>
    <div className="welcome-phone">
      <div className="welcome-phone-top"><span className="wordmark">Win<em>Fit</em></span><span className="welcome-demo-label">PRÉVIA DO APP</span></div>
      <div className="welcome-phone-greeting"><span>Um passo de cada vez</span><h2>Hoje é um bom<br />dia para se cuidar.</h2></div>
      <div className="welcome-phone-tabs" role="tablist" aria-label="Prévia das áreas do app">{TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'selected' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === 'Alimentação' && <div className="welcome-exercise welcome-alt" role="tabpanel"><div className="welcome-exercise-head"><span>HOJE</span></div><p className="welcome-alt-big">1.420<small> de 2.000 kcal</small></p><div className="welcome-alt-bar"><span style={{ width: '71%' }} /></div><ul><li>08:10 · Café da manhã<b>380 kcal</b></li><li>12:40 · Almoço<b>720 kcal</b></li><li>16:00 · Lanche<b>320 kcal</b></li></ul></div>}
      {tab === 'Rotina' && <div className="welcome-exercise welcome-alt" role="tabpanel"><div className="welcome-exercise-head"><span>LEMBRETE · 18:00</span></div><div className="welcome-alt-days">{['D','S','T','Q','Q','S','S'].map((d, i) => <span key={i} className={[1,3,5].includes(i) ? 'on' : ''}>{d}</span>)}</div><ul><li>✓ Garrafa de água</li><li>✓ Toalha</li><li>○ Fone</li></ul></div>}
      {tab === 'Seu treino' && <div className="welcome-exercise" role="tabpanel"><div className="welcome-exercise-head"><span>TREINO DE FORÇA</span><span aria-hidden="true">↗</span></div><div className="welcome-exercise-art" role="img" aria-label="Ilustração de agachamento com barra" /><div className="welcome-exercise-info"><div><span>01 / EXERCÍCIO</span><h3>Agachamento com barra</h3></div><span className="welcome-exercise-check" aria-hidden="true">✓</span></div><div className="welcome-exercise-metrics"><div><span>SÉRIES</span><strong>3</strong></div><div><span>REPETIÇÕES</span><strong>10–12</strong></div><div><span>DESCANSO</span><strong>60 s</strong></div></div></div>}
      <div className="welcome-phone-bottom"><span className="welcome-pause-mark" aria-hidden="true">⌁</span><p>Uma pausa também faz parte.<br /><strong>Respire. Depois, continue.</strong></p></div>
    </div>
    <figcaption className="welcome-preview-caption">Uma prévia do seu próximo passo.<span>Dados ilustrativos</span></figcaption>
  </figure>
}
