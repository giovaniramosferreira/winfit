import { useMemo, useState, useSyncExternalStore } from 'react'
import { useStore } from '../lib/store'
import { bodyStore, useBody } from '../lib/bodyMetricsStore'
import { nutritionStore } from '../lib/nutritionStore'
import { calculateGoals, type ActivityLevel, type GoalKind, type Sex } from '../lib/goals'
import { dayNumber, intakeByDay, observedWeeklyChange, suggestAdaptiveGoal } from '../lib/adaptiveGoal'
import { forecastWeight } from '../lib/weightForecast'
import { goalForDate, localDate } from '../lib/nutrition'
import { Button } from './ui'

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: 'Sedentário (pouco ou nenhum exercício)', light: 'Leve (1–3 treinos por semana)', moderate: 'Moderado (3–5 treinos por semana)',
  active: 'Ativo (6–7 treinos por semana)', very_active: 'Muito ativo (treino intenso diário ou trabalho físico)', extra_active: 'Extra ativo (trabalho muito pesado e treino)',
}
const KIND_LABEL: Record<GoalKind, string> = { lose: 'Perder peso', maintain: 'Manter peso', gain: 'Ganhar peso' }
const field = { width: '100%', minHeight: 44, marginTop: 4 }
const fmt = (n: number | null | undefined, unit = '') => (n === null || n === undefined ? '—' : `${n.toLocaleString('pt-BR')}${unit}`)

/** Campo numérico que só grava ao sair (evita validar a cada tecla). */
function NumField({ label, value, onCommit, step = 1, min }: { label: string; value: number | null; onCommit: (v: number | null) => void; step?: number; min?: number }) {
  const [text, setText] = useState<string | null>(null)
  return <label>{label}<input type="number" inputMode="decimal" min={min} step={step} style={field} value={text ?? (value ?? '')}
    onChange={(e) => setText(e.target.value)} onBlur={() => { if (text !== null) { onCommit(text.trim() === '' ? null : Number(text)); setText(null) } }} /></label>
}

export default function NutritionInsights() {
  const body = useBody()
  const nutrition = useSyncExternalStore(nutritionStore.subscribe, nutritionStore.getState, nutritionStore.getState)
  const bio = useStore((s) => s.profile?.biometrics)
  const [msg, setMsg] = useState('')
  const [wDate, setWDate] = useState(localDate())
  const [wKg, setWKg] = useState('')
  const today = localDate()
  const s = body.settings
  const sex: Sex | null = s.sex ?? bio?.sex ?? null
  const age = s.age ?? bio?.age ?? null
  const heightCm = s.heightCm ?? bio?.heightCm ?? null
  const weightKg = body.weights.at(-1)?.kg ?? bio?.weightKg ?? null
  const missing = sex === null || age === null || heightCm === null || weightKg === null

  const calc = useMemo(() => {
    if (missing) return null
    try { return { goals: calculateGoals({ sex: sex!, age: age!, weightKg: weightKg!, heightCm: heightCm!, activity: s.activity, bodyFatPct: s.bodyFatPct }, { kind: s.kind, weeklyChangeKg: s.weeklyChangeKg }, s.pinned), error: null } }
    catch (e) { return { goals: null, error: (e as Error).message } }
  }, [missing, sex, age, heightCm, weightKg, s.activity, s.bodyFatPct, s.kind, s.weeklyChangeKg, s.pinned])

  const target = goalForDate(nutrition.goals, today)
  const insights = useMemo(() => {
    if (!calc?.goals) return null
    const g = calc.goals
    const current = target ?? g.calories
    const recentWeights = body.weights.filter((w) => dayNumber(today) - dayNumber(w.date) <= 28)
    const intake14 = intakeByDay(nutrition.meals, today, 14, current)
    const intake28 = intakeByDay(nutrition.meals, today, 28, current)
    const suggestion = suggestAdaptiveGoal({
      currentKcal: current, bmr: g.bmr, tdee: g.tdee, targetWeeklyChangeKg: g.weeklyChangeKg, observedWeeklyChangeKg: observedWeeklyChange(recentWeights),
      completeFoodDays: intake14.filter((d) => d.completeness === 'likely_complete').length, weightEntries: recentWeights.length,
    })
    return { suggestion, forecast: forecastWeight({ weights: body.weights, intake: intake28, tdee: g.tdee, bmr: g.bmr }) }
  }, [calc, target, body.weights, nutrition.meals, today])

  const useAsGoal = (kcal: number, note: string) => {
    if (nutritionStore.upsertGoal({ id: crypto.randomUUID(), date: today, mode: 'direct', kcal })) setMsg(note)
  }
  const addWeight = () => {
    if (bodyStore.upsertWeight(wDate, Number(wKg.replace(',', '.')))) { setWKg(''); setMsg('Peso registrado neste aparelho.') }
  }
  const g = calc?.goals

  return <section className="card nutrition-insights" style={{ marginTop: 12 }} aria-labelledby="ni-title">
    <h2 id="ni-title">Metas e previsão <span className="pill">estimativa</span></h2>
    <p className="small muted">Calculado com fórmulas públicas a partir das suas medidas. Não é recomendação médica; converse com um profissional de saúde antes de mudar sua alimentação.</p>
    {body.error && <p role="alert" className="small">{body.error}</p>}
    {msg && <p role="status" className="small">{msg}</p>}

    <details className="more" open={missing}><summary>Suas medidas e objetivo</summary>
      <label>Sexo<select style={field} value={sex ?? ''} disabled={body.blocked} onChange={(e) => bodyStore.setSettings({ sex: (e.target.value || null) as Sex | null })}>
        <option value="">Escolha</option><option value="f">Feminino</option><option value="m">Masculino</option><option value="na">Prefiro não informar</option></select></label>
      <NumField label="Idade (anos)" value={age} min={14} onCommit={(v) => bodyStore.setSettings({ age: v })} />
      <NumField label="Altura (cm)" value={heightCm} min={100} onCommit={(v) => bodyStore.setSettings({ heightCm: v })} />
      <label>Nível de atividade<select style={field} value={s.activity} disabled={body.blocked} onChange={(e) => bodyStore.setSettings({ activity: e.target.value as ActivityLevel })}>
        {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((k) => <option key={k} value={k}>{ACTIVITY_LABEL[k]}</option>)}</select></label>
      <label>Objetivo<select style={field} value={s.kind} disabled={body.blocked} onChange={(e) => bodyStore.setSettings({ kind: e.target.value as GoalKind })}>
        {(Object.keys(KIND_LABEL) as GoalKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></label>
      {s.kind !== 'maintain' && <NumField label="Ritmo (kg por semana, 0,1 a 1)" value={s.weeklyChangeKg} step={0.05} min={0.1} onCommit={(v) => v !== null && bodyStore.setSettings({ weeklyChangeKg: v })} />}
      <NumField label="Gordura corporal (%, opcional)" value={s.bodyFatPct} step={0.5} min={3} onCommit={(v) => bodyStore.setSettings({ bodyFatPct: v })} />
    </details>

    <h3 className="field-title" style={{ marginTop: 12 }}>Peso corporal</h3>
    <div className="row" style={{ gap: 8, alignItems: 'end' }}>
      <label style={{ flex: 1 }}>Data<input type="date" max={today} style={field} value={wDate} onChange={(e) => setWDate(e.target.value)} /></label>
      <label style={{ flex: 1 }}>Peso (kg)<input type="number" inputMode="decimal" step="0.1" min="25" style={field} value={wKg} onChange={(e) => setWKg(e.target.value)} /></label>
      <Button variant="secondary" disabled={!wKg || body.blocked} onClick={addWeight}>Registrar</Button>
    </div>
    {body.weights.length > 0 && <p className="small muted num">{body.weights.slice(-4).reverse().map((w) => `${w.date.slice(8)}/${w.date.slice(5, 7)}: ${fmt(w.kg, ' kg')}`).join(' · ')}</p>}

    {missing && <p className="small muted" style={{ marginTop: 10 }}>Informe sexo, idade, altura e um peso para ver sua meta calculada.</p>}
    {calc?.error && <p role="alert" className="small">{calc.error}</p>}
    {g && <div style={{ marginTop: 12 }} data-testid="calculated-goals">
      <p className="num"><b>{g.calories.toLocaleString('pt-BR')} kcal</b> por dia <span className="muted small">(estimativa; basal {g.bmr.toLocaleString('pt-BR')}, gasto total {g.tdee.toLocaleString('pt-BR')})</span></p>
      <p className="small muted num">Proteína {g.macros.protein} g · carboidratos {g.macros.carbs} g · gorduras {g.macros.fat} g</p>
      <Button variant="primary" disabled={nutrition.blocked || target === g.calories} onClick={() => useAsGoal(g.calories, 'Meta salva a partir de hoje.')}>{target === g.calories ? 'Esta já é sua meta' : 'Usar como meta de hoje'}</Button>
    </div>}

    {insights && <div style={{ marginTop: 14 }}>
      <h3 className="field-title">Ajuste semanal sugerido</h3>
      <p className="small" data-testid="adaptive-message">{insights.suggestion.message}</p>
      {insights.suggestion.changed && <Button variant="secondary" disabled={nutrition.blocked} onClick={() => useAsGoal(insights.suggestion.suggestedKcal, `Meta ajustada para ${insights.suggestion.suggestedKcal} kcal.`)}>Aceitar {insights.suggestion.deltaKcal > 0 ? '+' : ''}{insights.suggestion.deltaKcal} kcal</Button>}
      <h3 className="field-title" style={{ marginTop: 12 }}>Previsão de peso</h3>
      {insights.forecast.predictedWeeklyChangeKg === null
        ? <p className="small muted">Registre dias completos de alimentação (duas ou mais refeições) para estimar a tendência. Dias parciais não entram na conta.</p>
        : <p className="small num" data-testid="forecast">Em 30 dias: {fmt(insights.forecast.predicted30dKg, ' kg')} · 60: {fmt(insights.forecast.predicted60dKg, ' kg')} · 90: {fmt(insights.forecast.predicted90dKg, ' kg')} <span className="muted">(ritmo previsto {fmt(insights.forecast.predictedWeeklyChangeKg, ' kg/sem')})</span></p>}
      {insights.forecast.trendsDisagree && <p className="small">Seu peso real e a previsão estão em direções diferentes. Pode haver itens esquecidos no registro.</p>}
      {insights.forecast.likelyUnderLogging && <p className="small">A ingestão registrada está bem abaixo do seu gasto basal com peso estável: provavelmente falta registrar refeições.</p>}
    </div>}
  </section>
}
