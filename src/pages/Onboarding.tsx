import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import Icon, { type IconName } from '../components/Icon'
import type {
  CurrentState, Equipment, Experience, Goal, Limitation, OnboardingDraft, TrainLocation, TrainingProfile,
} from '../types'

const GOALS: { v: Goal; t: string; s: string; i: IconName }[] = [
  { v: 'hypertrophy', t: 'Ganhar músculo', s: 'Hipertrofia como prioridade', i: 'dumbbell' },
  { v: 'fat_loss', t: 'Perder gordura', s: 'Emagrecer preservando músculo', i: 'flame' },
  { v: 'strength', t: 'Ficar mais forte', s: 'Foco em força nos básicos', i: 'bolt' },
  { v: 'return_fitness', t: 'Voltar à forma', s: 'Retomar o condicionamento', i: 'refresh' },
  { v: 'health', t: 'Saúde e disposição', s: 'Treinar bem, viver melhor', i: 'breath' },
]
const EXP: { v: Experience; t: string; s: string }[] = [
  { v: 'none', t: 'Nunca treinei', s: 'Ou treinei muito pouco' },
  { v: 'little', t: 'Já treinei um pouco', s: 'Conheço o básico dos exercícios' },
  { v: 'intermediate', t: 'Treino há 6 meses a 2 anos', s: 'Tenho prática regular' },
  { v: 'advanced', t: 'Treino há mais de 2 anos', s: 'Experiência sólida' },
]
const STATE: { v: CurrentState; t: string; s: string }[] = [
  { v: 'active', t: 'Treinando regularmente', s: 'Estou em ritmo' },
  { v: 'sometimes', t: 'Treinando às vezes', s: 'Sem constância' },
  { v: 'paused_months', t: 'Parado há alguns meses', s: 'Voltando de uma pausa' },
  { v: 'paused_long', t: 'Parado há muito tempo', s: '1 ano ou mais' },
]
const LOCATIONS: { v: TrainLocation; t: string; s: string; i: IconName }[] = [
  { v: 'gym_full', t: 'Academia completa', s: 'Máquinas, pesos livres, polias', i: 'building' },
  { v: 'gym_basic', t: 'Academia básica / condomínio', s: 'Estrutura limitada', i: 'dumbbell' },
  { v: 'home_equipment', t: 'Em casa, com equipamentos', s: 'Halteres, elásticos etc.', i: 'bag' },
  { v: 'home_none', t: 'Em casa, sem equipamentos', s: 'Só o peso do corpo', i: 'home' },
]
const EQUIP_OPTS: { v: Equipment; t: string }[] = [
  { v: 'halteres', t: 'Halteres' },
  { v: 'barra', t: 'Barra e anilhas' },
  { v: 'banco', t: 'Banco' },
  { v: 'elasticos', t: 'Elásticos' },
  { v: 'barra_fixa', t: 'Barra fixa' },
  { v: 'kettlebell', t: 'Kettlebell' },
  { v: 'maquinas', t: 'Máquinas' },
  { v: 'polia', t: 'Polia / crossover' },
]
const FREQS = [2, 3, 4, 5, 6]
const TIMES = [
  { v: 30, t: 'Até 30 min' },
  { v: 45, t: '~45 min' },
  { v: 60, t: '~60 min' },
  { v: 75, t: '75 min ou mais' },
]
const LIMS: { v: Limitation; t: string }[] = [
  { v: 'joelho', t: 'Joelho' },
  { v: 'lombar', t: 'Lombar' },
  { v: 'ombro', t: 'Ombro' },
  { v: 'punho', t: 'Punho' },
]

export default function Onboarding() {
  const nav = useNavigate()
  const draft = useStore((s) => s.draft)
  const setDraft = useStore((s) => s.setDraft)
  const complete = useStore((s) => s.completeOnboarding)
  const [d, setD] = useState<OnboardingDraft>(draft ?? { step: 1 })
  const [age, setAge] = useState(d.biometrics?.age?.toString() ?? '')
  const [weight, setWeight] = useState(d.biometrics?.weightKg?.toString() ?? '')

  // Persistência do rascunho a cada mudança — fechar e voltar retoma no mesmo passo.
  useEffect(() => { setDraft(d) }, [d, setDraft])

  const needsEquipStep = d.location === 'gym_basic' || d.location === 'home_equipment'
  const totalSteps = 9

  // Editando pelo resumo final: depois de responder, volta direto ao resumo.
  const [editing, setEditing] = useState(false)
  const next = (patch: Partial<OnboardingDraft>, jump = 1) => {
    const needsEquip = patch.location === 'gym_basic' || patch.location === 'home_equipment'
    setTimeout(() => setD((cur) => ({ ...cur, ...patch, step: editing && !needsEquip ? 9 : cur.step + jump })), 180)
  }

  const back = () => {
    if (d.step === 1) return nav('/')
    let jump = 1
    if (d.step === 6 && !needsEquipStep) jump = 2
    setD({ ...d, step: d.step - jump })
  }

  useEffect(() => { if (d.step === 9) setEditing(false) }, [d.step])
  const finish = () => {
    const profile: TrainingProfile = {
      goal: d.goal!,
      experience: d.experience!,
      currentState: d.currentState!,
      location: d.location!,
      equipment: d.location === 'gym_full' ? [] : d.equipment ?? [],
      frequency: d.frequency!,
      sessionTimeMin: d.sessionTimeMin!,
      limitations: d.limitations ?? [],
      biometrics: {
        age: age ? Number(age) : undefined,
        weightKg: weight ? Number(weight) : undefined,
        sex: d.biometrics?.sex,
      },
      version: 1,
    }
    complete(profile)
    nav('/preview')
  }

  const recap: [string, number][] = [
    [GOALS.find((o) => o.v === d.goal)?.t ?? '', 1],
    [EXP.find((o) => o.v === d.experience)?.t ?? '', 2],
    [LOCATIONS.find((o) => o.v === d.location)?.t ?? '', 4],
    [`${d.frequency ?? '?'} dias por semana`, 6],
    [TIMES.find((o) => o.v === d.sessionTimeMin)?.t ?? '', 7],
    [d.limitations?.length ? `Cuidado: ${d.limitations.map((l) => LIMS.find((o) => o.v === l)?.t.toLowerCase()).join(', ')}` : 'Sem limitações', 8],
  ]
  const toggleArr = <T,>(arr: T[] | undefined, v: T): T[] => {
    const a = arr ?? []
    return a.includes(v) ? a.filter((x) => x !== v) : [...a, v]
  }

  return (
    <div className="page-full product-shell account-screen onboarding-screen fade-in" key={d.step}>
      <div className="screen-topline" style={{ marginBottom: 8 }}>
        <button className="btn-quiet" onClick={back} style={{ padding: '8px 0' }}>← Voltar</button>
      </div>
      <div className="progressbar" role="progressbar" aria-label="Perguntas do seu plano" aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={d.step}><div style={{ width: `${(d.step / totalSteps) * 100}%` }} /></div>

      {d.step === 1 && (
        <Step title="Qual seu objetivo principal?">
          {GOALS.map((o) => (
            <button key={o.v} className={`option ${d.goal === o.v ? 'selected' : ''}`}
              onClick={() => next({ goal: o.v })}>
              <span className="icon"><Icon name={o.i} /></span><span>{o.t}<div className="desc">{o.s}</div></span>
            </button>
          ))}
        </Step>
      )}

      {d.step === 2 && (
        <Step title="Qual sua experiência com musculação?">
          {EXP.map((o) => (
            <button key={o.v} className={`option ${d.experience === o.v ? 'selected' : ''}`}
              onClick={() => next({ experience: o.v })}>
              <span>{o.t}<div className="desc">{o.s}</div></span>
            </button>
          ))}
        </Step>
      )}

      {d.step === 3 && (
        <Step title="Como está sua rotina de treino hoje?" sub="Se estiver voltando de pausa, o plano começa mais leve.">
          {STATE.map((o) => (
            <button key={o.v} className={`option ${d.currentState === o.v ? 'selected' : ''}`}
              onClick={() => next({ currentState: o.v })}>
              <span>{o.t}<div className="desc">{o.s}</div></span>
            </button>
          ))}
        </Step>
      )}

      {d.step === 4 && (
        <Step title="Onde você vai treinar?">
          {LOCATIONS.map((o) => (
            <button key={o.v} className={`option ${d.location === o.v ? 'selected' : ''}`}
              onClick={() => {
                const skip = o.v === 'gym_full' || o.v === 'home_none'
                next({ location: o.v, equipment: skip ? [] : d.equipment }, skip ? 2 : 1)
              }}>
              <span className="icon"><Icon name={o.i} /></span><span>{o.t}<div className="desc">{o.s}</div></span>
            </button>
          ))}
        </Step>
      )}

      {d.step === 5 && (
        <Step title="O que você tem disponível?">
          {EQUIP_OPTS.map((o) => (
            <button key={o.v} className={`option ${d.equipment?.includes(o.v) ? 'selected' : ''}`}
              onClick={() => setD({ ...d, equipment: toggleArr(d.equipment, o.v) })}>
              <span>{o.t}</span>
              <span style={{ marginLeft: 'auto' }}>{d.equipment?.includes(o.v) ? '✓' : ''}</span>
            </button>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 20 }}
            disabled={!d.equipment || d.equipment.length === 0}
            onClick={() => next({})}>
            Continuar
          </button>
        </Step>
      )}

      {d.step === 6 && (
        <Step title="Quantos dias por semana?" sub="Dá para mudar depois.">
          <div className="choice-grid" style={{ gridTemplateColumns: `repeat(${FREQS.length}, 1fr)` }}>
            {FREQS.map((f) => (
              <button key={f} className={d.frequency === f ? 'selected' : ''} aria-label={`${f} dias por semana`}
                onClick={() => next({ frequency: f })}>
                <span className="num">{f}</span><small>dias</small>
              </button>
            ))}
          </div>
        </Step>
      )}

      {d.step === 7 && (
        <Step title="Quanto tempo por treino?">
          <div className="choice-grid">
            {TIMES.map((o) => (
              <button key={o.v} className={d.sessionTimeMin === o.v ? 'selected' : ''} aria-label={o.t}
                onClick={() => next({ sessionTimeMin: o.v })}>
                <span className="num">{o.v}{o.v === 75 ? '+' : ''}</span><small>min</small>
              </button>
            ))}
          </div>
        </Step>
      )}

      {d.step === 8 && (
        <Step title="Alguma região com dor ou limitação?" sub="Marque quantas quiser. Evitamos exercícios que forçam essas regiões.">
          <button className={`option ${(d.limitations ?? []).length === 0 && d.limitations !== undefined ? 'selected' : ''}`}
            onClick={() => next({ limitations: [] })}>
            <span>Nenhuma</span>
          </button>
          {LIMS.map((o) => (
            <button key={o.v} className={`option ${d.limitations?.includes(o.v) ? 'selected' : ''}`}
              onClick={() => setD({ ...d, limitations: toggleArr(d.limitations, o.v) })}>
              <span>{o.t}</span>
              <span style={{ marginLeft: 'auto' }}>{d.limitations?.includes(o.v) ? '✓' : ''}</span>
            </button>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={(d.limitations?.length ?? 0) === 0} onClick={() => next({})}>
            Continuar
          </button>
          <p className="small muted" style={{ marginTop: 12 }}>Dor persistente? Procure um profissional de saúde.</p>
        </Step>
      )}

      {d.step === 9 && (
        <Step title="Sobre você" sub="Para ajustar o volume do treino.">
          <label className="field" htmlFor="ob-age">Idade</label>
          <div className="unit-input"><input id="ob-age" className="input num" type="number" inputMode="numeric" placeholder="28"
            value={age} onChange={(e) => setAge(e.target.value)} /><span>anos</span></div>
          <label className="field" htmlFor="ob-weight">Peso <span className="muted">(opcional)</span></label>
          <div className="unit-input"><input id="ob-weight" className="input num" type="number" inputMode="decimal" placeholder="72"
            value={weight} onChange={(e) => setWeight(e.target.value)} /><span>kg</span></div>
          <div className="recap" aria-label="Suas respostas">
            {recap.map(([label, step]) => <button key={label} type="button" className="lib-chip" onClick={() => { setEditing(true); setD({ ...d, step }) }}>{label}</button>)}
          </div>
          <p className="small muted" style={{ marginTop: 6 }}>Toque numa resposta para mudar.</p>
          <button className="btn btn-primary" style={{ marginTop: 18 }}
            disabled={!age || Number(age) < 13 || Number(age) > 100}
            onClick={finish}>
            Gerar meu plano
          </button>
        </Step>
      )}
    </div>
  )
}

function Step({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="account-question">
      <h1 className="screen-title" style={{ fontSize: 27 }}>{title}</h1>
      {sub && <p className="muted small" style={{ marginTop: 6 }}>{sub}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  )
}
