/** Prévia ilustrativa: não usa nem representa registros reais da pessoa. */
export default function LandingPreview() {
  return <figure className="welcome-preview" aria-label="Prévia ilustrativa de uma sessão de treino no WinFit">
    <div className="welcome-preview-orbit" aria-hidden="true" />
    <div className="welcome-preview-note"><span aria-hidden="true">↗</span> Seu tempo.<br /><strong>Seu movimento.</strong></div>
    <div className="welcome-phone">
      <div className="welcome-phone-top"><span className="wordmark">Win<em>Fit</em></span><span className="welcome-demo-label">PRÉVIA DO APP</span></div>
      <div className="welcome-phone-greeting"><span>Um passo de cada vez</span><h2>Hoje é um bom<br />dia para se cuidar.</h2></div>
      <div className="welcome-phone-tabs" aria-hidden="true"><span className="selected">Seu treino</span><span>Alimentação</span><span>Rotina</span></div>
      <div className="welcome-exercise"><div className="welcome-exercise-head"><span>TREINO DE FORÇA</span><span aria-hidden="true">↗</span></div><div className="welcome-exercise-art" role="img" aria-label="Ilustração de agachamento com barra" /><div className="welcome-exercise-info"><div><span>01 / EXERCÍCIO</span><h3>Agachamento com barra</h3></div><span className="welcome-exercise-check" aria-hidden="true">✓</span></div><div className="welcome-exercise-metrics"><div><span>SÉRIES</span><strong>3</strong></div><div><span>REPETIÇÕES</span><strong>10–12</strong></div><div><span>DESCANSO</span><strong>60 s</strong></div></div></div>
      <div className="welcome-phone-bottom"><span className="welcome-pause-mark" aria-hidden="true">⌁</span><p>Uma pausa também faz parte.<br /><strong>Respire. Depois, continue.</strong></p></div>
    </div>
    <figcaption className="welcome-preview-caption">Uma prévia do seu próximo passo.<span>Dados ilustrativos</span></figcaption>
  </figure>
}
