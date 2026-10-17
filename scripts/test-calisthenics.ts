import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as progression from '../src/lib/progression'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { createElement } from 'react'
import Progress from '../src/pages/Progress'
import Chart from '../src/components/Chart'
import { useStore } from '../src/lib/store'
import { byId } from '../src/data/exercises'
import { equivalentsFor, generatePlan } from '../src/lib/generator'
import { homeWorkout, isEquipmentFree } from '../src/lib/homeWorkout'
import { MOVEMENT_DEMOS } from '../src/data/movementDemos'
import type { Session, TrainingProfile } from '../src/types'

const profile: TrainingProfile = {
  goal: 'health', experience: 'none', currentState: 'sometimes', location: 'home_none',
  equipment: [], frequency: 3, sessionTimeMin: 30, limitations: [], biometrics: { age: 30 }, version: 1,
}

test('nenhum plano sem equipamentos usa porta, toalha, sofá ou degrau', () => {
  for (let seed = 0; seed < 40; seed++) {
    const plan = generatePlan(profile, String(seed))
    for (const day of plan.days) for (const item of day.exercises) {
      assert.ok(isEquipmentFree(byId.get(item.exerciseId)!), `Apoio improvisado: ${item.exerciseId}`)
    }
  }
  assert.ok(equivalentsFor('flexao', profile).every(isEquipmentFree))
})

test('flexão oferece opção mais fácil com joelhos, respeitando as limitações', () => {
  assert.ok(equivalentsFor('flexao', profile).some((ex) => ex.id === 'flexao-joelhos'))
  assert.ok(equivalentsFor('flexao', profile).some((ex) => ex.id === 'flexao-diamante'), 'Oferecer progressão mais difícil')
  assert.ok(!equivalentsFor('flexao', { ...profile, limitations: ['punho'] }).some((ex) => ex.id === 'flexao-joelhos'))
})

test('planos antigos sem equipamentos são saneados ao importar, sem modificar planos de academia', () => {
  const old = generatePlan(profile, 'legacy')
  old.days[0].exercises[0].exerciseId = 'remada-toalha'
  useStore.getState().importCloudData({ profile, plan: old })
  assert.ok(useStore.getState().plan!.days.flatMap((day) => day.exercises).every((pe) => isEquipmentFree(byId.get(pe.exerciseId)!)))
  const gymPlan = { ...old, profileSnapshot: { ...profile, location: 'gym_full' as const } }
  useStore.getState().importCloudData({ profile: gymPlan.profileSnapshot, plan: gymPlan })
  assert.deepEqual(useStore.getState().plan, gymPlan)
})

test('troca no core recalibra segundos e repetições sem alterar o plano principal', () => {
  useStore.getState().completeOnboarding(profile)
  const original = JSON.stringify(useStore.getState().plan)
  useStore.getState().startHomeSession()
  const index = useStore.getState().activeSession!.exercises.findIndex((ex) => ex.exerciseId === 'prancha')
  assert.ok(index >= 0)
  useStore.getState().substitute(index, 'dead-bug', 'today')
  assert.equal(useStore.getState().activeSession!.exercises[index].repMax, 15, 'Dead bug deve usar repetições, não 45 segundos')
  useStore.getState().substitute(index, 'prancha-joelhos', 'today')
  assert.equal(useStore.getState().activeSession!.exercises[index].repMax, 45)
  assert.equal(JSON.stringify(useStore.getState().plan), original)
  useStore.getState().discardActive()
})

test('trocar uma variação não reatribui séries já registradas', () => {
  useStore.getState().completeOnboarding(profile)
  useStore.getState().startHomeSession()
  const index = useStore.getState().activeSession!.exercises.findIndex((ex) => ex.exerciseId === 'flexao')
  useStore.getState().logSet(index, 0, 10)
  useStore.getState().substitute(index, 'flexao-diamante', 'today')
  assert.equal(useStore.getState().activeSession!.exercises[index].exerciseId, 'flexao')
  assert.equal(useStore.getState().activeSession!.logs[0].exerciseId, 'flexao')
  useStore.getState().discardActive()
})

test('histórico de calistenia mostra repetições e segundos em vez de 0 kg', () => {
  const plan = generatePlan(profile, 'history')
  const home = homeWorkout(profile, plan, 'history', [])
  const session: Session = {
    id: 'calistenia-test', source: 'home', planId: home.plan.id, dayId: home.day.id, dayLabel: home.day.label,
    startedAt: Date.now(), endedAt: Date.now(), status: 'completed', currentIndex: 0, timer: null, exercises: [],
    logs: [
      { id: 'reps', exerciseId: 'flexao', planExerciseId: 'a', setNumber: 1, weight: 0, reps: 12, ts: Date.now(), isPR: false },
      { id: 'time', exerciseId: 'prancha', planExerciseId: 'b', setNumber: 1, weight: 0, reps: 30, ts: Date.now(), isPR: false },
    ],
  }
  const totals = (progression as Record<string, unknown>).activityTotals
  assert.equal(typeof totals, 'function', 'Calcular atividade separando repetições de segundos')
  const result = (totals as (logs: Session['logs']) => Record<string, unknown>)(session.logs)
  assert.deepEqual(result, { sets: 2, reps: 12, seconds: 30, volume: 0, hasLoad: false })
})

test('todo movimento e alternativa do ciclo de casa tem demonstração original', () => {
  const plan = generatePlan(profile, 'demo-coverage')
  const home = homeWorkout(profile, plan, 'demo-coverage', [])
  const ids = new Set(home.plan.days.flatMap((day) => day.exercises.map((ex) => ex.exerciseId)))
  for (const id of [...ids]) for (const alternative of equivalentsFor(id, profile)) ids.add(alternative.id)
  for (const id of ids) assert.ok(MOVEMENT_DEMOS[id], `Demonstração ausente: ${id}`)
})

test('ciclo inicial usa as alternativas básicas antes das variações de habilidade 2', () => {
  const home = homeWorkout(profile, generatePlan(profile, 'beginner'), 'beginner', [])
  for (const day of home.plan.days) for (const item of day.exercises) {
    assert.equal(byId.get(item.exerciseId)!.skill, 1, `Iniciante recebeu ${item.exerciseId}`)
  }
})

test('sessão comum sem equipamentos também preserva a variação das séries registradas', () => {
  useStore.setState({ activeSession: null })
  useStore.getState().completeOnboarding(profile)
  const day = useStore.getState().plan!.days.find((day) => day.exercises.some((ex) => ex.exerciseId === 'flexao'))!
  useStore.getState().startSession(day.id)
  const index = useStore.getState().activeSession!.exercises.findIndex((ex) => ex.exerciseId === 'flexao')
  useStore.getState().logSet(index, 0, 10)
  useStore.getState().substitute(index, 'flexao-joelhos', 'today')
  assert.equal(useStore.getState().activeSession!.exercises[index].exerciseId, 'flexao')
  // Mesmo contexto para sessões anteriores à introdução de profileSnapshot.
  useStore.setState({ activeSession: { ...useStore.getState().activeSession!, profileSnapshot: undefined } })
  useStore.getState().substitute(index, 'flexao-diamante', 'today')
  assert.equal(useStore.getState().activeSession!.exercises[index].exerciseId, 'flexao')
  useStore.getState().discardActive()
})

test('Watch confirma segundos nas duas pranchas com joelhos', () => {
  useStore.setState({ activeSession: null, sessions: [] })
  useStore.getState().completeOnboarding(profile)
  for (const id of ['prancha-joelhos', 'prancha-lateral-joelhos']) {
    useStore.getState().startHomeSession()
    const session = useStore.getState().activeSession!
    const index = session.exercises.findIndex((ex) => ex.exerciseId === 'prancha')
    useStore.getState().substitute(index, id, 'today')
    useStore.getState().setCurrentIndex(index)
    const result = useStore.getState().executeWatchCommand({ action: 'quick_log' })
    assert.match(result.message, /45 (?:seg|s)\b/)
    assert.equal(useStore.getState().getWatchStatusPayload().unit, 'seg')
    useStore.getState().discardActive()
  }
})

test('semana só de calistenia não volta a 0 kg por uma sessão antiga de academia', () => {
  const now = Date.now()
  const plan = generatePlan(profile, 'mixed-history')
  const makeSession = (id: string, ts: number, exerciseId: string, weight: number, reps: number): Session => ({
    id, planId: plan.id, dayId: plan.days[0].id, dayLabel: 'Treino de teste', startedAt: ts,
    endedAt: ts, status: 'completed', currentIndex: 0, timer: null, exercises: [],
    logs: [{ id, exerciseId, planExerciseId: id, setNumber: 1, weight, reps, ts, isPR: false }],
  })
  const sessions = [makeSession('today', now, 'flexao', 0, 12), makeSession('old', now - 15 * 86400000, 'supino-reto-barra', 40, 10)]
  // O renderizador de servidor do Zustand usa o snapshot inicial; fixture isolada,
  // sem substituir seletores ou simular a implementação da tela.
  const initial = useStore.getInitialState()
  const previous = { ...initial }
  Object.assign(initial, { profile, plan, sessions, prs: [] })
  try {
    const html = renderToStaticMarkup(createElement(StaticRouter, { location: '/progress' }, createElement(Progress)))
    assert.match(html, /Repetições na semana/)
    assert.ok(!html.includes('>0 kg<'), 'A semana de calistenia deve usar atividade, mesmo com musculação antiga')
  } finally { Object.assign(initial, previous) }
})

test('gráfico anuncia a unidade correta também para leitores de tela', () => {
  const data = [{ label: '1 out', value: 10 }, { label: '15 out', value: 15 }]
  for (const unit of ['reps', 'seg']) {
    const html = renderToStaticMarkup(createElement(Chart, { data, unit }))
    assert.ok(!html.includes('kg'), `Gráfico ${unit} não deve anunciar carga em kg`)
    assert.match(html, new RegExp(`10 ${unit}`))
  }
  assert.match(renderToStaticMarkup(createElement(Chart, { data, unit: '' })), /10 kg/)
})
