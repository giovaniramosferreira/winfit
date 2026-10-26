import type { PelvicPhase } from '../lib/pelvicTimer'
export interface PelvicProgram {
  id: string; title: string; version: number; kind: 'relaxation' | 'contraction'
  reviewStatus: 'general-wellbeing' | 'pending-professional-review'; available: boolean
  description: string; phases: PelvicPhase[]
}
export const pelvicPrograms: PelvicProgram[] = [
  { id: 'breathing-v1', title: 'Pausa para respirar', version: 1, kind: 'relaxation', reviewStatus: 'general-wellbeing', available: true,
    description: 'Um minuto para respirar no seu ritmo, sem prender o ar, contrair ou empurrar. É uma pausa de bem-estar, não tratamento.',
    phases: [{ kind: 'prepare', seconds: 5 }, { kind: 'relax', seconds: 60 }, { kind: 'rest', seconds: 5 }] },
  { id: 'kegel-preview-v1', title: 'Kegel · em revisão', version: 1, kind: 'contraction', reviewStatus: 'pending-professional-review', available: false,
    description: 'Prévia: preparo → contração → relaxamento → repouso. Tempos e progressão aguardam revisão de profissional de saúde pélvica. A rotina ainda não pode ser iniciada.', phases: [] },
]
export const phaseLabels = { prepare: 'Prepare-se', contract: 'Contraia', relax: 'Relaxe', rest: 'Repouse' }
export const phaseInstructions = {
  prepare: 'Encontre uma posição confortável, sentado com apoio ou deitado.',
  contract: 'Rotina indisponível até revisão profissional.',
  relax: 'Respire suavemente no seu ritmo. Solte a tensão sem forçar e sem prender o ar.',
  rest: 'Continue respirando normalmente. Termine quando se sentir confortável.',
}
