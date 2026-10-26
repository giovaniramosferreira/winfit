export interface RoutineData {
  version: 1; timezone: string; pausedUntil: number; snoozedUntil: number; delivered: string[]
  reminder: { enabled: boolean; days: number[]; time: string }
  checkin: { enabled: boolean; days: number[]; time: string; quietStart: string; quietEnd: string }
  checklists: Record<string, { id: string; text: string; done: boolean }[]>
  entries: { id: string; ts: number; energy: number; note: string }[]
}
export function defaultRoutine(timezone = 'America/Sao_Paulo'): RoutineData {
  return { version: 1, timezone, pausedUntil: 0, snoozedUntil: 0, delivered: [], reminder: { enabled: false, days: [1, 3, 5], time: '18:00' }, checkin: { enabled: false, days: [1, 3, 5], time: '18:00', quietStart: '22:00', quietEnd: '08:00' }, checklists: { academia: [], casa: [], viagem: [] }, entries: [] }
}
const clock = (s: unknown): s is string => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s)
const days = (d: unknown): d is number[] => Array.isArray(d) && d.every((n) => Number.isInteger(n) && n >= 0 && n <= 6)
export function validateRoutine(input: unknown): RoutineData | null {
  try {
    const r = input as RoutineData
    new Intl.DateTimeFormat('en', { timeZone: r.timezone }).format()
    if (r.version !== 1 || typeof r.timezone !== 'string' || !Number.isFinite(r.pausedUntil) || !Number.isFinite(r.snoozedUntil)
      || typeof r.reminder.enabled !== 'boolean' || typeof r.checkin.enabled !== 'boolean' || !days(r.reminder.days) || !days(r.checkin.days)
      || !clock(r.reminder.time) || !clock(r.checkin.time) || !clock(r.checkin.quietStart) || !clock(r.checkin.quietEnd)
      || !Array.isArray(r.delivered) || !r.delivered.every((s) => typeof s === 'string') || !Array.isArray(r.entries)
      || !r.entries.every((e) => typeof e.id === 'string' && Number.isFinite(e.ts) && Number.isInteger(e.energy) && e.energy >= 1 && e.energy <= 5 && typeof e.note === 'string' && e.note.length <= 1000)
      || !r.checklists || !Object.values(r.checklists).every((list) => Array.isArray(list) && list.every((item) => typeof item.id === 'string' && typeof item.text === 'string' && item.text.length <= 200 && typeof item.done === 'boolean'))) return null
    return JSON.parse(JSON.stringify(r)) as RoutineData
  } catch { return null }
}
export function localMoment(now: number, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const get = (key: string) => parts.find((p) => p.type === key)?.value ?? ''
  const date = `${get('year')}-${get('month')}-${get('day')}`
  return { date, time: `${get('hour')}:${get('minute')}`, day: new Date(`${date}T12:00:00Z`).getUTCDay() }
}
export function duePrompt(r: RoutineData, now: number): { kind: 'reminder' | 'checkin' | 'combined'; date: string } | null {
  if (now < r.pausedUntil || now < r.snoozedUntil) return null
  const m = localMoment(now, r.timezone)
  if (r.delivered.includes(m.date)) return null
  const reminder = r.reminder.enabled && r.reminder.days.includes(m.day) && m.time >= r.reminder.time
  const q = r.checkin
  const quiet = q.quietStart === q.quietEnd ? false : q.quietStart < q.quietEnd ? m.time >= q.quietStart && m.time < q.quietEnd : m.time >= q.quietStart || m.time < q.quietEnd
  const checkin = q.enabled && q.days.includes(m.day) && m.time >= q.time && !quiet
  return reminder || checkin ? { kind: reminder && checkin ? 'combined' : reminder ? 'reminder' : 'checkin', date: m.date } : null
}
export function calendarFile(r: RoutineData): string {
  const labels = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
  const m = localMoment(Date.now(), r.timezone)
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Winfit//Routine//PT', 'BEGIN:VEVENT', 'UID:winfit-training-reminder', `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`, `DTSTART;TZID=${r.timezone}:${m.date.replace(/-/g, '')}T${r.reminder.time.replace(':', '')}00`, `RRULE:FREQ=WEEKLY;BYDAY=${r.reminder.days.map((d) => labels[d]).join(',')}`, 'SUMMARY:Treino Winfit', 'DESCRIPTION:Abra o Winfit para registrar seu treino.', 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Hora do treino', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n')
}
