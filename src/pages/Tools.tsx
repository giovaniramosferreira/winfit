import { useMemo, useState } from 'react'
import PageTop from '../components/PageTop'
import { bmi, bmiBand, dots, navyBodyFat, oneRm, percentTable, rpeLoad, type OneRmFormula } from '../lib/calculators'
import { plateSplit, warmupSets } from '../lib/plates'

const field = { width: '100%', minHeight: 44, marginTop: 4 }
const n = (v: string): number => (v.trim() === '' ? NaN : Number(v.replace(',', '.')))
/** Executa o cálculo e devolve mensagem de erro em vez de quebrar a tela. */
function attempt<T>(fn: () => T): { value: T | null; error: string | null } {
  try { return { value: fn(), error: null } } catch (e) { return { value: null, error: (e as Error).message } }
}
const kg = (x: number) => `${x.toLocaleString('pt-BR')} kg`
function In({ label, value, set, step = 'any' }: { label: string; value: string; set: (v: string) => void; step?: string }) {
  return <label>{label}<input type="number" inputMode="decimal" step={step} min="0" style={field} value={value} onChange={(e) => set(e.target.value)} /></label>
}

export default function Tools() {
  const [w, setW] = useState('100'), [reps, setReps] = useState('5'), [formula, setFormula] = useState<OneRmFormula>('epley'), [rpe, setRpe] = useState('8')
  const [total, setTotal] = useState('100'), [bar, setBar] = useState('20'), [plates, setPlates] = useState('25, 20, 15, 10, 5, 2.5, 1.25')
  const [sex, setSex] = useState<'m' | 'f'>('m'), [bw, setBw] = useState('80'), [height, setHeight] = useState('180'), [neck, setNeck] = useState('38'), [waist, setWaist] = useState('85'), [hip, setHip] = useState('95'), [lifted, setLifted] = useState('400')

  const rm = useMemo(() => attempt(() => oneRm(n(w), n(reps), formula)), [w, reps, formula])
  const rpeResult = useMemo(() => attempt(() => (rm.value === null ? null : rpeLoad(rm.value, 5, n(rpe)))), [rm.value, rpe])
  const table = useMemo(() => attempt(() => (rm.value === null ? [] : percentTable(rm.value))), [rm.value])
  const split = useMemo(() => attempt(() => plateSplit(n(total), n(bar), plates.split(/[ ,;]+/).map(Number).filter((x) => x > 0))), [total, bar, plates])
  const warm = useMemo(() => attempt(() => warmupSets(n(total), n(bar))), [total, bar])
  const bmiResult = useMemo(() => attempt(() => bmi(n(bw), n(height))), [bw, height])
  const navy = useMemo(() => attempt(() => navyBodyFat({ sex, heightCm: n(height), neckCm: n(neck), waistCm: n(waist), hipCm: n(hip) })), [sex, height, neck, waist, hip])
  const score = useMemo(() => attempt(() => dots(sex, n(bw), n(lifted))), [sex, bw, lifted])

  return <div className="page fade-in tools-page">
    <PageTop title="Ferramentas" />
    <p className="small muted" style={{ marginTop: 8 }}>Todas são estimativas e citam a fórmula. Nada aqui é recomendação médica.</p>

    <section className="card" style={{ marginTop: 12 }} aria-labelledby="t-1rm"><h2 id="t-1rm">1RM e porcentagens</h2>
      <In label="Carga (kg)" value={w} set={setW} /><In label="Repetições (1 a 30)" value={reps} set={setReps} step="1" />
      <label>Fórmula<select style={field} value={formula} onChange={(e) => setFormula(e.target.value as OneRmFormula)}><option value="epley">Epley</option><option value="brzycki">Brzycki</option><option value="lombardi">Lombardi</option></select></label>
      {rm.error ? <p role="alert" className="small">{rm.error}</p> : <p className="num" data-testid="one-rm"><b>1RM estimado: {kg(rm.value!)}</b></p>}
      <In label="RPE desejado (6 a 10) para 5 repetições" value={rpe} set={setRpe} step="0.5" />
      {rpeResult.value !== null && rpeResult.value !== undefined ? <p className="small num">Carga sugerida para 5 reps no RPE {rpe}: <b>{kg(rpeResult.value)}</b></p> : <p className="small muted">RPE fora da tabela (6 a 10, de meio em meio ponto).</p>}
      {table.value && table.value.length > 0 && <table className="small num" style={{ width: '100%', marginTop: 8 }}><tbody>{table.value.map((r) => <tr key={r.pct}><td>{r.pct}%</td><td style={{ textAlign: 'right' }}>{kg(r.weight)}</td></tr>)}</tbody></table>}
    </section>

    <section className="card" style={{ marginTop: 12 }} aria-labelledby="t-plates"><h2 id="t-plates">Anilhas e aquecimento</h2>
      <In label="Carga total na barra (kg)" value={total} set={setTotal} /><In label="Peso da barra (kg)" value={bar} set={setBar} />
      <label>Anilhas que você tem (kg, separadas por vírgula)<input style={field} value={plates} onChange={(e) => setPlates(e.target.value)} /></label>
      {split.error ? <p role="alert" className="small">{split.error}</p> : split.value && <p className="num" data-testid="plate-split">Por lado: <b>{split.value.perSide.length ? split.value.perSide.join(' + ') + ' kg' : 'só a barra'}</b>{!split.value.exact && <span className="muted small"> · não fecha exato: sobram {split.value.remainderKg} kg (carga montada: {kg(split.value.loadedKg)})</span>}</p>}
      {warm.value && warm.value.length > 0 && <p className="small num" data-testid="warmup">Aquecimento: {warm.value.map((s) => `${s.weight} kg × ${s.reps}`).join(' → ')}</p>}
    </section>

    <section className="card" style={{ marginTop: 12 }} aria-labelledby="t-body"><h2 id="t-body">Corpo</h2>
      <label>Sexo<select style={field} value={sex} onChange={(e) => setSex(e.target.value as 'm' | 'f')}><option value="m">Masculino</option><option value="f">Feminino</option></select></label>
      <In label="Peso (kg)" value={bw} set={setBw} /><In label="Altura (cm)" value={height} set={setHeight} />
      {bmiResult.error ? <p role="alert" className="small">{bmiResult.error}</p> : <p className="num">IMC <b>{bmiResult.value}</b> <span className="muted small">({bmiBand(bmiResult.value!)}; o IMC não distingue músculo de gordura)</span></p>}
      <In label="Pescoço (cm)" value={neck} set={setNeck} /><In label="Cintura (cm)" value={waist} set={setWaist} />{sex === 'f' && <In label="Quadril (cm)" value={hip} set={setHip} />}
      {navy.error ? <p role="alert" className="small">{navy.error}</p> : <p className="num">Gordura corporal (método da Marinha): <b>{navy.value}%</b> <span className="muted small">(estimativa grosseira)</span></p>}
      <In label="Total levantado, agachamento + supino + terra (kg)" value={lifted} set={setLifted} />
      {score.error ? <p role="alert" className="small">{score.error}</p> : <p className="num">DOTS: <b>{score.value}</b></p>}
    </section>
  </div>
}
