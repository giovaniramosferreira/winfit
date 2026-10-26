import assert from 'node:assert/strict'
import { defaultRoutine, duePrompt, calendarFile, validateRoutine } from '../src/lib/routine'
import { createRoutineStore, ROUTINE_STORAGE_KEY } from '../src/lib/routineStore'
const r = defaultRoutine('UTC')
r.reminder = { enabled: true, days: [1], time: '10:00' }
assert.equal(duePrompt(r, Date.parse('2026-10-26T10:00:00Z'))?.kind, 'reminder')
r.delivered = ['2026-10-26']
assert.equal(duePrompt(r, Date.parse('2026-10-26T10:05:00Z')), null)
r.delivered = []; r.checkin.enabled = true; r.checkin.time = '10:00'
assert.equal(duePrompt(r, Date.parse('2026-10-26T10:00:00Z'))?.kind, 'combined')
r.pausedUntil = Date.parse('2026-10-27T10:00:00Z')
assert.equal(duePrompt(r, Date.parse('2026-10-26T10:00:00Z')), null)
assert.match(calendarFile(r), /BEGIN:VCALENDAR/)
assert.equal(validateRoutine({ ...r, timezone: 'Invalid/Zone' }), null)
assert.equal(validateRoutine({ ...r, reminder: { ...r.reminder, time: '99:00' } }), null)
r.pausedUntil = 0; r.reminder.enabled = false; r.checkin.time = '21:00'
assert.equal(duePrompt(r, Date.parse('2026-10-26T23:00:00Z')), null, 'Quiet hours cross midnight')
assert.equal(duePrompt(r, Date.parse('2026-10-26T21:00:00Z'))?.kind, 'checkin')
r.timezone = 'America/Sao_Paulo'; r.checkin.time = '18:00'
assert.equal(duePrompt(r, Date.parse('2026-10-26T20:59:00Z')), null)
assert.equal(duePrompt(r, Date.parse('2026-10-26T21:00:00Z'))?.kind, 'checkin')
r.snoozedUntil = Date.parse('2026-10-26T21:30:00Z')
assert.equal(duePrompt(r, Date.parse('2026-10-26T21:10:00Z')), null)
assert.equal(duePrompt(r, Date.parse('2026-10-26T21:30:00Z'))?.kind, 'checkin')
assert.equal(validateRoutine({ ...r, entries: [{ id: 'a', ts: 0, energy: 10, note: '' }] }), null)
const saved = new Map<string, string>([[ROUTINE_STORAGE_KEY, '{bad']])
const storage = { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => { saved.set(key, value) } }
const corrupted = createRoutineStore(storage)
assert.equal(corrupted.getState().blocked, true)
assert.equal(corrupted.getState().update({ timezone: 'UTC' }), false)
assert.equal(saved.get(ROUTINE_STORAGE_KEY), '{bad')
assert.equal(corrupted.getState().exportData(), '{bad')
assert.equal(corrupted.getState().resetAll(), true)
assert.equal(corrupted.getState().blocked, false)
const quota = createRoutineStore({ getItem: () => null, setItem: () => { throw Error('quota') } })
assert.equal(quota.getState().update({ timezone: 'UTC' }), false)
assert.match(quota.getState().error!, /salvar/)
assert.notEqual(quota.getState().data.timezone, 'UTC')
const unavailable = createRoutineStore(null)
assert.equal(unavailable.getState().update({ timezone: 'UTC' }), false)
const working = createRoutineStore(storage)
assert.equal(working.getState().importData({ bad: true }), false)
assert.equal(working.getState().importData(defaultRoutine('UTC')), true)
const reloaded = createRoutineStore(storage)
assert.equal(reloaded.getState().data.timezone, 'UTC')
const oldEnvelope = createRoutineStore({ getItem: () => JSON.stringify({ state: { data: defaultRoutine('UTC') }, version: 0 }), setItem: () => {} })
assert.equal(oldEnvelope.getState().data.timezone, 'UTC')
const agenda = defaultRoutine('America/New_York')
agenda.reminder = { enabled: true, days: [1], time: '09:00' }
assert.match(calendarFile(agenda, Date.parse('2026-10-26T14:00:00Z')), /DTSTART;TZID=America\/New_York:20261102T090000/)
assert.match(calendarFile(agenda, Date.parse('2026-10-25T12:00:00Z')), /DTSTART;TZID=America\/New_York:20261026T090000/)
assert.throws(() => calendarFile({ ...agenda, reminder: { ...agenda.reminder, days: [] } }))
console.log('Routine timezone, coordination, dedup, pause and validation OK')
