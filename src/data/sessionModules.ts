import { useStore } from '../lib/store'
export type TrainingMode = 'gym' | 'home'
export const sessionModules = [
  { id:'gym', title:'Academia', path:'/training', description:'Seu plano, sequência de treinos e evolução de cargas.', status:'Plano personalizado' },
  { id:'home', title:'Calistenia', path:'/calisthenics', description:'Treine com o peso do corpo, sem equipamentos improvisados.', status:'Ciclo de treinos em casa' },
  { id:'pelvic', title:'Saúde pélvica · Kegel', path:'/pelvic', description:'Pausa para respirar e conhecer a proposta de saúde pélvica.', status:'Respiração disponível · contrações em revisão' },
  { id:'nutrition', title:'Alimentação', path:'/nutrition', description:'Registre refeições e acompanhe suas metas alimentares.', status:'Diário alimentar manual' },
] as const
/** Every entry point shares this guard; choosing a day must never replace a session. */
export function startTraining(mode: TrainingMode, dayId?: string): 'started' | 'resumable' | 'expired' | 'unavailable' {
  const s = useStore.getState()
  const existing = s.resumeOrExpireSession()
  if (existing !== 'none') return existing
  if (mode === 'home') s.startHomeSession()
  else if (dayId) s.startSession(dayId)
  return useStore.getState().activeSession ? 'started' : 'unavailable'
}
