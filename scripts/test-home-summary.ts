import assert from 'node:assert/strict'
import { homeSummary } from '../src/lib/homeSummary'
import type { Plan, Session, TrainingProfile } from '../src/types'
const now = new Date(2026, 9, 29, 10).getTime()
const profile = { frequency: 6 } as TrainingProfile
const plan = { id: 'current', days: [{ id: 'upper', label: 'Superiores A' }, { id: 'legs', label: 'Pernas' }] } as Plan
const session = (overrides: Partial<Session> = {}) => ({ id: 's', planId: 'current', dayId: 'upper', startedAt: now - 1000, status: 'completed', ...overrides }) as Session
assert.equal(homeSummary({ profile, plan, sessions: [], now, name: 'Giovani Ramos' }).message, 'Hoje é dia de Superiores A, Giovani.')
assert.equal(homeSummary({ profile, plan, sessions: [session()], now }).message, 'Hoje é dia de Pernas.')
assert.equal(homeSummary({ profile, plan, sessions: [session({ status: 'discarded' }), session({ source: 'home' })], now }).message, 'Hoje é dia de Superiores A.')
const progress = homeSummary({ profile, plan, sessions: [session(), session({ startedAt: now + 86400000 }), session({ startedAt: now - 8 * 86400000 })], now })
assert.equal(progress.weekCount, 1)
assert.equal(progress.weekGoal, 6, 'Weekly target comes from the profile, not number of days in split')
assert.match(homeSummary({ profile, plan, sessions: [], active: session({ status: 'active', dayLabel: 'Pernas' }), now, name: ' Ana ' }).message, /continuar Pernas, Ana/)
assert.equal(homeSummary({ profile: null, plan: null, sessions: [], now }).message, 'Vamos montar seu treino?')
assert.equal(homeSummary({ profile, plan, sessions: [], now, name: '' }).message.includes('Giovani'), false)
console.log('Home summary: real plan, name, active session and weekly target OK')
