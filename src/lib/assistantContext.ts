import type { Equipment, Plan, Session, TrainingProfile, WorkoutDay } from '../types'
import { EXERCISES, byId } from '../data/exercises'
import { canPerform } from './generator'
import { isEquipmentFree, isTimedExercise } from './exerciseRules'

export interface AssistantRequest { context: string; question: string; consentVersion: string }
export interface AuthenticatedAssistantAdapter {
  // Implementation belongs on an authenticated backend. Never include API keys here.
  ask: (request: AssistantRequest, accessToken: string, signal?: AbortSignal) => Promise<{ answer: string }>
}
/** Small local preview, excluding biometrics, account identifiers and free-text health notes. */
export function buildAssistantContext(plan: Plan | null, sessions: Session[], profile: TrainingProfile | null): string {
  const profileLine = profile ? `Perfil informado: objetivo ${profile.goal}; experiência ${profile.experience}; local ${profile.location}; ${profile.frequency} treinos/semana; ${profile.sessionTimeMin} min disponíveis.` : 'Perfil não informado.'
  const planLine = plan ? `Plano atual: ${plan.splitLabel}. ${plan.days.slice(0, 7).map((day) => `${day.label}: ${day.exercises.length} exercícios, ~${day.estMin} min`).join('; ')}.` : 'Plano atual não disponível.'
  const recent = [...sessions].filter((session) => session.status === 'completed' || session.status === 'partial').sort((a, b) => b.startedAt - a.startedAt).slice(0, 3)
  const historyLine = recent.length ? `Últimas ${recent.length} sessões: ${recent.map((session) => `${session.dayLabel} em ${new Date(session.startedAt).toISOString().slice(0, 10)}: ${session.logs.length} séries, ${session.status === 'completed' ? 'concluído' : 'parcial'}`).join('; ')}.` : 'Sem sessões finalizadas registradas.'
  return [profileLine, planLine, historyLine, 'Fatos ausentes: disponibilidade de hoje, tempo real disponível e como você está não foram informados nesta consulta. Nenhum dado clínico foi inferido.'].join('\n').slice(0, 2000)
}
export function localExplanation(context: string, enabled: boolean): string {
  if (!enabled) return 'Ative o contexto local para consultar as explicações.'
  if (!context.trim()) return 'Modo local: adicione o contexto que deseja considerar.'
  const text = context.toLocaleLowerCase('pt-BR')
  const focus = /tempo|curt|minuto|pressa/.test(text) ? 'Você mencionou tempo: a proposta de sessão curta remove apenas exercícios opcionais. Os obrigatórios permanecem e a duração final pode exceder sua preferência.'
    : /casa|equipamento|viagem/.test(text) ? 'Você mencionou ambiente: a opção de peso corporal busca equivalências sem equipamento nem apoio; quando não há alternativa compatível, a aplicação é bloqueada.'
      : /dor|desconforto|les[aã]o/.test(text) ? 'Você mencionou desconforto: este modo local não avalia sintomas nem prescreve exercícios. Não use a proposta para insistir em um movimento que causa dor.'
        : 'Registre as séries realizadas e preserve o descanso. Você pode revisar uma proposta por tempo ou equipamento abaixo.'
  return `Explicação local por regras: ${focus} Confira a prévia antes de aceitar. Nenhum contexto foi enviado para IA.`
}
export function proposeAdaptation(day: WorkoutDay, minutes: number, profile?: TrainingProfile, equipment?: Equipment[]): WorkoutDay {
  const shorter = Number.isFinite(minutes) && minutes > 0 && minutes < day.estMin
  return { ...day, exercises: day.exercises.filter((item) => !shorter || !item.optional).map((item) => {
    if (!profile || !equipment) return { ...item }
    const original = byId.get(item.exerciseId)
    const compatible = (exercise: (typeof EXERCISES)[number]) => canPerform(exercise, equipment, profile.limitations) && (equipment.some((e) => e !== 'peso_corporal') || isEquipmentFree(exercise))
    if (!original || compatible(original)) return { ...item }
    const replacement = [...EXERCISES].sort((a, b) => a.equivRank - b.equivRank).find((candidate) => candidate.equivGroup === original.equivGroup && candidate.slotTypes.includes(item.slotType) && candidate.skill <= original.skill && isTimedExercise(candidate.id) === isTimedExercise(original.id) && compatible(candidate))
    return replacement ? { ...item, exerciseId: replacement.id } : { ...item }
  }) }
}
export function adaptationWarnings(day: WorkoutDay, profile: TrainingProfile, equipment: Equipment[]): string[] {
  return day.exercises.flatMap((item) => { const exercise = byId.get(item.exerciseId); return !exercise || !canPerform(exercise, equipment, profile.limitations) || (!equipment.some((e) => e !== 'peso_corporal') && !isEquipmentFree(exercise)) ? [`Sem alternativa compatível para ${exercise?.name ?? item.exerciseId}.`] : [] })
}
export function applyFutureDay(plan: Plan, proposal: WorkoutDay): Plan | null {
  if (!plan.days.some((day) => day.id === proposal.id) || !proposal.exercises.length) return null
  return { ...plan, days: plan.days.map((day) => day.id === proposal.id ? proposal : day) }
}
