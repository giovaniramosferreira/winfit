import assert from 'node:assert/strict'
import { POLICY_LABEL, suggestFor, type ProgressionPolicy } from '../src/lib/progression'
import { policyFor, setPolicy, POLICY_KEY } from '../src/lib/progressionPolicyStore'
import { suggestDeload, isValidDeloadFactor } from '../src/lib/deload'
import { streakCelebration, streakInfo, weekKey } from '../src/lib/streak'
import { halfLifeDecay, isHardSet, muscleFatigue, stateOf, type ExerciseMuscles } from '../src/lib/fatigue'
import type { Exercise, PlanExercise, Session, SetLog } from '../src/types'

const DAY = 86_400_000
const ex = { id: 'supino', loadType: 'external', minIncrementKg: 2.5 } as Exercise
const plan: PlanExercise = { id: 'p', exerciseId: 'supino', slotType: 'push_h_comp', sets: 3, repMin: 8, repMax: 12, restSec: 90, optional: false }
const log = (weight: number, reps: number, n = 1): SetLog => ({ id: `l${n}${weight}${reps}`, exerciseId: 'supino', planExerciseId: 'p', setNumber: n, weight, reps, ts: 0, isPR: false })
const session = (startedAt: number, logs: SetLog[], status: Session['status'] = 'completed'): Session => ({ id: `s${startedAt}`, planId: 'p', dayId: 'd', dayLabel: 'A', startedAt, status, exercises: [], logs, currentIndex: 0, timer: null })
const sets = (weight: number, reps: number[]) => reps.map((r, i) => log(weight, r, i + 1))

// --- G1/G2: leitura honesta da sessão
let s = suggestFor(plan, ex, [session(1, sets(60, [12, 12, 12]))])
assert.equal(s.weight, 62.5, 'fechou 3x12: sobe')
assert.equal(s.targetReps, 8)
assert.equal(s.isIncrease, true)
assert.equal(s.policy, 'double')
s = suggestFor(plan, ex, [session(1, sets(60, [12, 12]))])
assert.equal(s.weight, 60, 'só 2 de 3 séries registradas: NÃO sobe (série não feita = falha)')
assert.equal(s.isIncrease, false)
assert.equal(s.lastSessionComplete, false)
assert.match(s.note, /2 de 3 séries/)
s = suggestFor(plan, ex, [session(1, sets(60, [12, 12, 11]))])
assert.equal(s.weight, 60, 'uma série abaixo do teto: mantém')
assert.equal(s.targetReps, 12)
assert.equal(suggestFor(plan, ex, []).weight, null, 'primeira vez: calibrar')
// corrigir uma série errada corrige a sugestão (derivada do histórico, nada guardado)
const wrong = session(1, sets(60, [12, 12, 5]))
assert.equal(suggestFor(plan, ex, [wrong]).isIncrease, false)
assert.equal(suggestFor(plan, ex, [{ ...wrong, logs: sets(60, [12, 12, 12]) }]).isIncrease, true)
assert.equal(suggestFor(plan, ex, [session(1, sets(60, [12, 12, 12]), 'discarded')]).weight, null, 'sessão descartada não conta')
// sessão mais recente manda
assert.equal(suggestFor(plan, ex, [session(1, sets(60, [12, 12, 12])), session(2, sets(62.5, [8, 8, 8]))]).weight, 62.5)

// --- G3: políticas
const cases: Array<[ProgressionPolicy, number[], number | null, boolean]> = [
  ['linear', [8, 8, 8], 62.5, true],    // fez o piso em todas: sobe
  ['linear', [8, 8, 7], 60, false],     // uma abaixo do piso: mantém
  ['double', [8, 8, 8], 60, false],     // dupla ainda não fechou o teto
  ['reps', [12, 12, 12], 60, false],    // nunca sobe sozinha
]
for (const [policy, reps, weight, inc] of cases) {
  const r = suggestFor(plan, ex, [session(1, sets(60, reps))], { policy })
  assert.equal(r.weight, weight, `${policy} ${reps}`)
  assert.equal(r.isIncrease, inc, `${policy} ${reps} aumento`)
  assert.equal(r.policy, policy)
  assert.ok(r.note.length > 10 && POLICY_LABEL[policy], 'o motivo é sempre explicado')
}
assert.match(suggestFor(plan, ex, [session(1, sets(60, [12, 12, 12]))], { policy: 'reps' }).note, /não sobe sozinha/)
const bw = { id: 'flexao', loadType: 'bodyweight', minIncrementKg: 0 } as Exercise
const bwPlan = { ...plan, exerciseId: 'flexao', repMax: 15 }
const bwLog = (reps: number, n: number): SetLog => ({ ...log(0, reps, n), exerciseId: 'flexao' })
assert.equal(suggestFor(bwPlan, bw, [session(1, [bwLog(15, 1), bwLog(15, 2)])]).isIncrease, false, 'peso corporal incompleto não "fecha a faixa"')
assert.equal(suggestFor(bwPlan, bw, [session(1, [bwLog(15, 1), bwLog(15, 2), bwLog(15, 3)])]).isIncrease, true)

// preferência por exercício
const mem = new Map<string, string>()
const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) }
assert.equal(policyFor('supino', store), 'double')
assert.equal(setPolicy('supino', 'linear', store), true)
assert.equal(policyFor('supino', store), 'linear')
assert.equal(policyFor('agachamento', store), 'double')
assert.equal(setPolicy('x', 'inventada' as never, store), false)
mem.set(POLICY_KEY, '{lixo'); assert.equal(policyFor('supino', store), 'double', 'dado corrompido volta ao padrão')
mem.set(POLICY_KEY, JSON.stringify({ supino: 'xyz', ok: 'reps' })); assert.equal(policyFor('supino', store), 'double'); assert.equal(policyFor('ok', store), 'reps')
assert.equal(policyFor('supino', undefined), 'double')

// --- G4: deload
const prog = (ts: number, kg: number, reps = 8) => session(ts, [log(kg, reps)])
const stalled = [prog(1, 60), prog(2, 60), prog(3, 60), prog(4, 60)]
const d = suggestDeload('supino', stalled)
assert.equal(d.suggest, true)
assert.equal(d.weightKg, 55, '90% de 60 = 54 → arredonda para 55')
assert.match(d.reason, /3 sessões/)
assert.equal(suggestDeload('supino', [prog(1, 60), prog(2, 62.5), prog(3, 65), prog(4, 67.5)]).suggest, false, 'progredindo')
assert.equal(suggestDeload('supino', stalled.slice(0, 3)).suggest, false, 'poucas sessões')
assert.equal(suggestDeload('supino', stalled, { factor: 0.8, after: 2 }).weightKg, 47.5)
assert.throws(() => suggestDeload('supino', stalled, { factor: 1 }))
assert.equal(isValidDeloadFactor(0.4), false)
assert.equal(suggestDeload('supino', [prog(1, 60), prog(2, 60), prog(3, 60), prog(4, 65)]).suggest, false, 'última sessão melhorou')
assert.equal(suggestDeload('supino', stalled.map((x, i) => ({ ...x, status: i === 3 ? ('discarded' as const) : x.status }))).suggest, false, 'descartada não conta')

// --- G6: sequência semanal
const wk = (n: number) => new Date(2026, 0, 5 + 7 * n, 10).getTime() // segundas de 2026-01-05 em diante
const t = (...weeks: number[]) => weeks.map((n) => ({ status: 'completed' as const, startedAt: wk(n) }))
const now = (n: number) => new Date(2026, 0, 5 + 7 * n, 18)
assert.equal(weekKey(new Date(2026, 0, 11, 12)), '2026-01-05', 'domingo pertence à semana que começa na segunda')
assert.equal(weekKey(new Date(2026, 0, 11, 12), 'sun'), '2026-01-11')
assert.equal(streakInfo([], now(0)).streak, 0)
assert.equal(streakInfo(t(0, 1, 2), now(2)).streak, 3)
let info = streakInfo(t(0, 1, 2, 3), now(3))
assert.equal(info.streak, 4)
assert.equal(info.freezes, 1, '4ª semana ganha um congelamento')
info = streakInfo(t(0, 1, 2, 3, 5), now(5))
assert.equal(info.streak, 5, 'semana 4 perdida usa o congelamento e a sequência segue')
assert.equal(info.weeks[4].status, 'frozen')
assert.equal(info.freezes, 0)
info = streakInfo(t(0, 1, 5), now(5))
assert.equal(info.streak, 1, 'sem congelamento a sequência recomeça')
assert.equal(info.best, 2)
info = streakInfo(t(0, 1, 2, 3), now(4))
assert.equal(info.weeks.at(-1)?.status, 'open', 'semana corrente sem treino fica aberta')
assert.equal(info.streak, 4)
assert.equal(streakInfo(t(0, 1, 2, 3, 5), now(5), 'none').streak, 1, 'regra "nenhum": nada de congelamento')
assert.equal(streakInfo(t(0, 1, 2, 3, 4, 5, 6, 7, 10), now(10), 'gentle').freezes, 0, 'suave: 1 congelamento cobre a 1ª semana perdida e a 2ª zera a sequência')
assert.equal(streakInfo(t(0, 1, 2, 3, 4, 5, 6, 7), now(7), 'generous').freezes, 2, 'generosa guarda até 2')
assert.equal(streakInfo(t(0, 1, 2, 3, 4, 5, 6, 7), now(7), 'gentle').freezes, 1, 'suave guarda no máximo 1')
const switched = streakInfo(t(0, 1, 2, 3, 4, 5, 6, 7), now(7), (w) => (w >= '2026-02-23' ? 'none' : 'generous'))
assert.equal(switched.freezes, 0, 'regra nova poda os congelamentos que ela não mantém')
assert.equal(switched.weeks[3].freezes, 1, 'o passado não é reescrito')
assert.equal(streakInfo(t(0, 1, 2, 3), now(3), 'generous', 'sun').streak >= 1, true)
assert.equal(streakInfo([{ status: 'discarded' as never, startedAt: wk(0) }], now(0)).streak, 0, 'descartada não conta')
assert.equal(streakInfo([{ status: 'partial', startedAt: wk(0) }], now(0)).streak, 1, 'parcial conta')
assert.equal(streakCelebration(4, []), 4)
assert.equal(streakCelebration(4, [4]), null)
assert.equal(streakCelebration(13, [4]), 12)
assert.equal(streakCelebration(3, []), null)
// dois aparelhos, mesma resposta (função pura dos treinos)
assert.deepEqual(streakInfo(t(0, 1, 2), now(2)), streakInfo(t(2, 1, 0), now(2)))

// --- G5: fadiga
const lookup: ExerciseMuscles = (id) => (id === 'supino' ? { primary: 'peito', secondary: ['triceps', 'ombro'] } : undefined)
const heavy = (at: number, n: number): Session => ({ ...session(at, Array.from({ length: n }, (_, i) => log(60, 10, i))), endedAt: at })
const NOW = 100 * DAY
let f = muscleFatigue([heavy(NOW, 8)], NOW, lookup)
assert.equal(f.peito.level, 1, '8 séries duras = 1,0')
assert.equal(f.peito.state, 'high')
assert.equal(f.triceps.level, 0.4, 'secundário vale 0,4')
assert.equal(f.costas.state, 'fresh')
f = muscleFatigue([heavy(NOW - 48 * 3_600_000, 8)], NOW, lookup)
assert.equal(f.peito.level, 0.5, 'meia-vida de 48 h')
assert.equal(f.triceps.level, 0.16, 'meia-vida de 36 h no tríceps: 0,4 × 0,5^(48/36)')
f = muscleFatigue([heavy(NOW, 40)], NOW, lookup)
assert.equal(f.peito.level, 1.5, 'teto de 12 séries por sessão (12/8)')
assert.equal(muscleFatigue([heavy(NOW - 31 * DAY, 8)], NOW, lookup).peito.level, 0, 'fora da janela de 30 dias')
assert.equal(muscleFatigue([{ ...heavy(NOW, 8), status: 'discarded' }], NOW, lookup).peito.level, 0)
assert.equal(muscleFatigue([{ ...heavy(NOW + DAY, 8) }], NOW, lookup).peito.level, 0, 'futuro ignorado')
const light = session(NOW, [log(10, 2), log(10, 40)]); assert.equal(muscleFatigue([light], NOW, lookup).peito.level, 0, 'séries fora de 5–30 reps não contam como duras')
assert.equal(muscleFatigue([session(NOW, [{ ...log(60, 10), exerciseId: 'desconhecido' }])], NOW, lookup).peito.level, 0, 'exercício desconhecido é ignorado')
assert.equal(isHardSet(5), true); assert.equal(isHardSet(4), false); assert.equal(isHardSet(31), false)
assert.equal(halfLifeDecay(0, 1000), 1); assert.equal(halfLifeDecay(1000, 1000), 0.5)
assert.equal(stateOf(0.1), 'fresh'); assert.equal(stateOf(0.3), 'light'); assert.equal(stateOf(0.7), 'moderate'); assert.equal(stateOf(1), 'high')
// com o catálogo real
const real = muscleFatigue([{ ...session(NOW, Array.from({ length: 8 }, (_, i) => ({ ...log(60, 10, i), exerciseId: 'supino-reto-halter' }))), endedAt: NOW }], NOW)
assert.ok(Object.values(real).every((m) => Number.isFinite(m.level)))

console.log('training: progressão honesta, políticas, deload, sequência semanal e fadiga OK')
