export interface IllustrationPilot {
  sprite: string
  aspectRatio: string
  cue: string
  cycle: 'return' | 'loop'
}

/** Piloto restrito a estes três movimentos, aguardando avaliação visual do usuário. */
export const ILLUSTRATION_PILOTS: Record<string, IllustrationPilot> = {
  'agachamento-corporal': {
    sprite: '/media/pilots/agachamento-v2.webp', aspectRatio: '1', cycle: 'return',
    cue: 'Desça levando o quadril para trás. Mantenha os pés inteiros apoiados e volte com controle.',
  },
  flexao: {
    sprite: '/media/pilots/flexao-v2.webp', aspectRatio: '30 / 17', cycle: 'return',
    cue: 'Dobre os cotovelos e aproxime o peito do chão. Ombros, quadril e calcanhares descem juntos.',
  },
  'leg-press': {
    sprite: '/media/pilots/leg-press-v2.webp', aspectRatio: '4 / 3', cycle: 'loop',
    cue: 'Costas e quadril apoiados no encosto, pés inteiros na plataforma. Empurre sem travar os joelhos e retorne com controle.',
  },
}
