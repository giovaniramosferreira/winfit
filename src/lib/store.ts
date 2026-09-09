import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  OnboardingDraft, Plan, PlanExercise, PRRecord, Session, SessionExercise, SetLog, TrainingProfile,
  WatchCommand, WatchStatusPayload,
} from '../types'
import { canPerform, generatePlan } from './generator'
import { checkPR, suggestFor } from './progression'
import { byId } from '../data/exercises'
import { homeWorkout, isEquipmentFree } from './homeWorkout'
import { beep, vibrate } from './helpers'

// Persistência write-through: o middleware `persist` grava em localStorage a cada `set`,
// antes do próximo frame — princípio 1 da spec (nunca perder uma série logada).

const RESUME_WINDOW_MS = 8 * 60 * 60 * 1000 // 8h (seção 21)

export interface WatchCommandResult {
  ok: boolean
  message: string
  restSec?: number
}

interface WinfitState {
  seed: string
  watchToken: string
  profile: TrainingProfile | null
  draft: OnboardingDraft | null
  plan: Plan | null
  archivedPlans: Plan[]
  sessions: Session[] // encerradas (completed | partial)
  activeSession: Session | null
  prs: PRRecord[]

  setWatchToken: (t: string) => void
  setDraft: (d: OnboardingDraft | null) => void
  completeOnboarding: (p: TrainingProfile) => void
  activatePlan: () => void
  regenerate: (p: TrainingProfile) => void

  startSession: (dayId: string) => void
  startHomeSession: () => void
  resumeOrExpireSession: () => 'none' | 'resumable' | 'expired'
  saveExpiredAsPartial: () => void
  discardActive: () => void
  logSet: (exerciseIdx: number, weight: number, reps: number) => SetLog | null
  editSet: (logId: string, weight: number, reps: number) => void
  deleteSet: (logId: string) => void
  substitute: (exerciseIdx: number, newExerciseId: string, scope: 'today' | 'always') => void
  skipExercise: (exerciseIdx: number) => void
  setCurrentIndex: (i: number) => void
  clearTimer: () => void
  startTimer: (sec: number) => void
  finishSession: (rpe?: number) => string | null

  getWatchStatusPayload: () => WatchStatusPayload
  executeWatchCommand: (cmd: WatchCommand) => WatchCommandResult

  exportData: () => string
  resetAll: () => void
}


function sessionFromDay(plan: Plan, dayId: string): Session | null {
  const day = plan.days.find((d) => d.id === dayId)
  if (!day) return null
  const exercises: SessionExercise[] = day.exercises.map((pe) => ({
    planExerciseId: pe.id,
    exerciseId: pe.exerciseId,
    sets: pe.sets,
    repMin: pe.repMin,
    repMax: pe.repMax,
    restSec: pe.restSec,
    optional: pe.optional,
    skipped: false,
  }))
  return {
    id: crypto.randomUUID(),
    planId: plan.id,
    dayId: day.id,
    dayLabel: day.label,
    startedAt: Date.now(),
    status: 'active',
    exercises,
    logs: [],
    currentIndex: 0,
    timer: null,
  }
}

function generateWatchToken(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let token = 'WF-'
  for (let i = 0; i < 4; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

export const useStore = create<WinfitState>()(
  persist(
    (set, get) => ({
      seed: crypto.randomUUID(),
      watchToken: generateWatchToken(),
      profile: null,
      draft: null,
      plan: null,
      archivedPlans: [],
      sessions: [],
      activeSession: null,
      prs: [],

      setWatchToken: (t) => set({ watchToken: t.trim().toUpperCase() }),
      setDraft: (d) => set({ draft: d }),

      completeOnboarding: (p) => {
        const plan = generatePlan(p, get().seed)
        set({ profile: p, plan, draft: null })
      },

      activatePlan: () => {
        const { plan } = get()
        if (plan) set({ plan: { ...plan, status: 'active' } })
      },

      regenerate: (p) => {
        const { plan, archivedPlans, seed } = get()
        const next = generatePlan(p, seed + ':' + Date.now())
        set({
          profile: p,
          plan: next,
          archivedPlans: plan ? [{ ...plan, status: 'archived' as const }, ...archivedPlans].slice(0, 10) : archivedPlans,
        })
      },

      startSession: (dayId) => {
        const { plan, activeSession } = get()
        if (!plan || activeSession) return
        const s = sessionFromDay(plan, dayId)
        if (s) set({ activeSession: s })
      },

      startHomeSession: () => {
        const { plan, profile, seed, sessions, activeSession } = get()
        if (!plan || !profile || activeSession) return
        const home = homeWorkout(profile, plan, seed, sessions)
        if (!home.day.exercises.length) return
        const s = sessionFromDay(home.plan, home.day.id)!
        set({ activeSession: { ...s, source: 'home', profileSnapshot: home.plan.profileSnapshot } })
      },

      resumeOrExpireSession: () => {
        const s = get().activeSession
        if (!s) return 'none'
        const lastTs = s.logs.length > 0 ? Math.max(...s.logs.map((l) => l.ts)) : s.startedAt
        return Date.now() - lastTs < RESUME_WINDOW_MS ? 'resumable' : 'expired'
      },

      saveExpiredAsPartial: () => {
        const s = get().activeSession
        if (!s) return
        if (s.logs.length === 0) {
          set({ activeSession: null })
          return
        }
        const done: Session = { ...s, status: 'partial', endedAt: Date.now(), timer: null }
        set({ activeSession: null, sessions: [done, ...get().sessions] })
      },

      discardActive: () => set({ activeSession: null }),

      logSet: (exerciseIdx, weight, reps) => {
        const { activeSession, sessions } = get()
        if (!activeSession) return null
        const ex = activeSession.exercises[exerciseIdx]
        if (!ex) return null
        const already = activeSession.logs.filter((l) => l.planExerciseId === ex.planExerciseId).length
        const isPR = checkPR(ex.exerciseId, weight, sessions)
        const log: SetLog = {
          id: crypto.randomUUID(),
          exerciseId: ex.exerciseId,
          planExerciseId: ex.planExerciseId,
          setNumber: already + 1,
          weight,
          reps,
          ts: Date.now(),
          isPR,
        }
        set({
          activeSession: {
            ...activeSession,
            logs: [...activeSession.logs, log],
            timer: { endsAt: Date.now() + ex.restSec * 1000, totalSec: ex.restSec },
          },
        })
        return log
      },

      editSet: (logId, weight, reps) => {
        const s = get().activeSession
        if (!s) return
        set({
          activeSession: {
            ...s,
            logs: s.logs.map((l) => (l.id === logId ? { ...l, weight, reps } : l)),
          },
        })
      },

      deleteSet: (logId) => {
        const s = get().activeSession
        if (!s) return
        set({ activeSession: { ...s, logs: s.logs.filter((l) => l.id !== logId) } })
      },

      substitute: (exerciseIdx, newExerciseId, scope) => {
        const { activeSession, plan } = get()
        if (!activeSession || !byId.has(newExerciseId)) return
        const replacement = byId.get(newExerciseId)!
        if (activeSession.source === 'home' && (!isEquipmentFree(replacement) ||
          !canPerform(replacement, ['peso_corporal'], activeSession.profileSnapshot?.limitations ?? []))) return
        const cur = activeSession.exercises[exerciseIdx]
        const exercises = activeSession.exercises.map((e, i) =>
          i === exerciseIdx ? { ...e, exerciseId: newExerciseId, substitutedFrom: cur.exerciseId } : e,
        )
        let nextPlan = plan
        if (scope === 'always' && plan && activeSession.source !== 'home') {
          nextPlan = {
            ...plan,
            days: plan.days.map((d) => ({
              ...d,
              exercises: d.exercises.map((pe) =>
                pe.id === cur.planExerciseId ? { ...pe, exerciseId: newExerciseId } : pe,
              ),
            })),
          }
        }
        set({ activeSession: { ...activeSession, exercises }, plan: nextPlan })
      },

      skipExercise: (exerciseIdx) => {
        const s = get().activeSession
        if (!s) return
        const exercises = s.exercises.map((e, i) => (i === exerciseIdx ? { ...e, skipped: true } : e))
        const next = exercises.findIndex((e, i) => i > exerciseIdx && !e.skipped)
        set({
          activeSession: {
            ...s,
            exercises,
            currentIndex: next >= 0 ? next : Math.min(exerciseIdx + 1, exercises.length - 1),
          },
        })
      },

      setCurrentIndex: (i) => {
        const s = get().activeSession
        if (!s) return
        set({ activeSession: { ...s, currentIndex: i } })
      },

      clearTimer: () => {
        const s = get().activeSession
        if (!s) return
        set({ activeSession: { ...s, timer: null } })
      },

      startTimer: (sec) => {
        const s = get().activeSession
        if (!s) return
        set({ activeSession: { ...s, timer: { endsAt: Date.now() + sec * 1000, totalSec: sec } } })
      },

      finishSession: (rpe) => {
        const { activeSession, sessions, prs } = get()
        if (!activeSession) return null
        if (activeSession.logs.length === 0) {
          set({ activeSession: null })
          return null
        }
        const totalPlanned = activeSession.exercises.filter((e) => !e.skipped).reduce((a, e) => a + e.sets, 0)
        const status = activeSession.logs.length >= totalPlanned ? 'completed' : 'partial'
        const done: Session = { ...activeSession, status, endedAt: Date.now(), timer: null, rpe }
        const newPRs: PRRecord[] = done.logs
          .filter((l) => l.isPR)
          .map((l) => ({
            id: crypto.randomUUID(),
            exerciseId: l.exerciseId,
            type: 'max_weight' as const,
            value: l.weight,
            reps: l.reps,
            ts: l.ts,
            sessionId: done.id,
          }))
        // Mantém só o melhor PR por exercício desta sessão
        const bestByEx = new Map<string, PRRecord>()
        for (const pr of newPRs) {
          const cur = bestByEx.get(pr.exerciseId)
          if (!cur || pr.value > cur.value) bestByEx.set(pr.exerciseId, pr)
        }
        set({
          activeSession: null,
          sessions: [done, ...sessions],
          prs: [...bestByEx.values(), ...prs],
        })
        return done.id
      },

      getWatchStatusPayload: (): WatchStatusPayload => {
        const { activeSession, sessions } = get()
        if (!activeSession) {
          return {
            active: false,
            summaryText: 'Nenhum treino em andamento no WinFit.',
            updatedAt: Date.now(),
          }
        }

        const idx = activeSession.currentIndex
        const sx = activeSession.exercises[idx]
        if (!sx) {
          return {
            active: false,
            summaryText: 'Nenhum exercício ativo.',
            updatedAt: Date.now(),
          }
        }
        const exercise = byId.get(sx.exerciseId)
        if (!exercise) {
          return {
            active: false,
            summaryText: 'Exercício não encontrado.',
            updatedAt: Date.now(),
          }
        }
        const logsHere = activeSession.logs.filter((l) => l.planExerciseId === sx.planExerciseId)
        const isTimed = sx.exerciseId === 'prancha' || sx.exerciseId === 'prancha-lateral'

        const planExLike: PlanExercise = {
          id: sx.planExerciseId,
          exerciseId: sx.exerciseId,
          slotType: 'core',
          sets: sx.sets,
          repMin: sx.repMin,
          repMax: sx.repMax,
          restSec: sx.restSec,
          optional: sx.optional,
        }
        const suggestion = suggestFor(planExLike, exercise, sessions)

        const defaultWeight = () => {
          if (logsHere.length > 0) return logsHere[logsHere.length - 1].weight
          if (exercise.loadType !== 'external') return 0
          return suggestion.weight ?? 0
        }
        const defaultReps = () => {
          if (logsHere.length > 0) return logsHere[logsHere.length - 1].reps
          return suggestion.targetReps
        }

        const currentSetNumber = logsHere.length + 1
        const timer = activeSession.timer
        const restRemaining = timer ? Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000)) : 0
        const isResting = restRemaining > 0
        const doneSets = activeSession.logs.length
        const totalPlannedSets = activeSession.exercises.filter((e) => !e.skipped).reduce((a, e) => a + e.sets, 0)

        const weight = defaultWeight()
        const reps = defaultReps()
        const unit = isTimed ? 'seg' : 'reps'

        let summaryText = `${exercise.name}: Série ${Math.min(currentSetNumber, sx.sets)} de ${sx.sets}`
        if (weight > 0) summaryText += ` com ${weight} kg`
        summaryText += ` (${reps} ${unit})`
        if (isResting) summaryText += ` · Descanso: ${restRemaining}s`

        return {
          active: true,
          sessionLabel: activeSession.dayLabel,
          exerciseName: exercise.name,
          exerciseIdx: idx,
          totalExercises: activeSession.exercises.length,
          currentSet: Math.min(currentSetNumber, sx.sets),
          totalSets: sx.sets,
          suggestedWeight: weight,
          suggestedReps: reps,
          unit,
          loadType: exercise.loadType,
          isResting,
          restRemainingSec: restRemaining,
          totalRestSec: timer?.totalSec ?? sx.restSec,
          doneSets,
          totalPlannedSets,
          summaryText,
          updatedAt: Date.now(),
        }
      },

      executeWatchCommand: (cmd: WatchCommand): WatchCommandResult => {
        const { activeSession, sessions, logSet, startTimer, clearTimer, skipExercise, setCurrentIndex, finishSession } = get()
        if (!activeSession) return { ok: false, message: 'Nenhum treino ativo no momento.' }

        const idx = activeSession.currentIndex
        const sx = activeSession.exercises[idx]
        if (!sx) return { ok: false, message: 'Exercício não encontrado.' }
        const exercise = byId.get(sx.exerciseId)
        if (!exercise) return { ok: false, message: 'Exercício não encontrado.' }

        const logsHere = activeSession.logs.filter((l) => l.planExerciseId === sx.planExerciseId)
        const isTimed = sx.exerciseId === 'prancha' || sx.exerciseId === 'prancha-lateral'

        const planExLike: PlanExercise = {
          id: sx.planExerciseId,
          exerciseId: sx.exerciseId,
          slotType: 'core',
          sets: sx.sets,
          repMin: sx.repMin,
          repMax: sx.repMax,
          restSec: sx.restSec,
          optional: sx.optional,
        }
        const suggestion = suggestFor(planExLike, exercise, sessions)

        const defaultWeight = () => {
          if (logsHere.length > 0) return logsHere[logsHere.length - 1].weight
          if (exercise.loadType !== 'external') return 0
          return suggestion.weight ?? 0
        }
        const defaultReps = () => {
          if (logsHere.length > 0) return logsHere[logsHere.length - 1].reps
          return suggestion.targetReps
        }

        switch (cmd.action) {
          case 'quick_log': {
            const weight = defaultWeight()
            const reps = defaultReps()
            logSet(idx, weight, reps)
            vibrate(50)
            beep()
            return {
              ok: true,
              message: `Série ${logsHere.length + 1} de ${sx.sets} registrada: ${weight > 0 ? weight + 'kg' : 'peso corporal'} × ${reps} ${isTimed ? 's' : 'reps'}.`,
              restSec: sx.restSec,
            }
          }
          case 'custom_log': {
            const weight = cmd.weight !== undefined ? cmd.weight : defaultWeight()
            const reps = cmd.reps !== undefined ? cmd.reps : defaultReps()
            logSet(idx, weight, reps)
            vibrate(50)
            beep()
            return {
              ok: true,
              message: `Série ${logsHere.length + 1} de ${sx.sets} registrada: ${weight > 0 ? weight + 'kg' : 'peso corporal'} × ${reps} ${isTimed ? 's' : 'reps'}.`,
              restSec: sx.restSec,
            }
          }
          case 'add_rest': {
            const timer = activeSession.timer
            const currentRemaining = timer ? Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000)) : 0
            const nextSec = (currentRemaining > 0 ? currentRemaining : sx.restSec) + 30
            startTimer(nextSec)
            return { ok: true, message: `+30s de descanso (${nextSec}s restantes).`, restSec: nextSec }
          }
          case 'skip_rest': {
            clearTimer()
            return { ok: true, message: 'Descanso encerrado.' }
          }
          case 'skip_exercise': {
            skipExercise(idx)
            return { ok: true, message: `${exercise.name} pulado.` }
          }
          case 'next_exercise': {
            const nextIdx = Math.min(idx + 1, activeSession.exercises.length - 1)
            setCurrentIndex(nextIdx)
            return { ok: true, message: 'Avançado para o próximo exercício.' }
          }
          case 'prev_exercise': {
            const prevIdx = Math.max(idx - 1, 0)
            setCurrentIndex(prevIdx)
            return { ok: true, message: 'Voltado para o exercício anterior.' }
          }
          case 'finish_session': {
            const id = finishSession()
            return { ok: true, message: id ? 'Treino encerrado com sucesso!' : 'Treino encerrado.' }
          }
          default:
            return { ok: false, message: 'Ação desconhecida.' }
        }
      },

      exportData: () => {
        const { profile, plan, archivedPlans, sessions, prs } = get()
        return JSON.stringify(
          { app: 'winfit', exportedAt: new Date().toISOString(), profile, plan, archivedPlans, sessions, prs },
          null,
          2,
        )
      },

      resetAll: () =>
        set({
          profile: null, draft: null, plan: null, archivedPlans: [],
          sessions: [], activeSession: null, prs: [],
        }),
    }),
    {
      name: 'winfit-v1',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
        if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage
        const memory = new Map<string, string>()
        return {
          getItem: (k: string) => memory.get(k) ?? null,
          setItem: (k: string, v: string) => { memory.set(k, v) },
          removeItem: (k: string) => { memory.delete(k) },
          clear: () => memory.clear(),
          key: (i: number) => Array.from(memory.keys())[i] ?? null,
          length: 0,
        } as Storage
      }),
    },
  ),
)

