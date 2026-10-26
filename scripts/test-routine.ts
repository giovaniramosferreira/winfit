import assert from 'node:assert/strict'
import { defaultRoutine, duePrompt, calendarFile, validateRoutine } from '../src/lib/routine'
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
console.log('Routine timezone, coordination, dedup, pause and validation OK')
