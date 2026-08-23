// Mock de localStorage para ambiente Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => { store.set(key, val) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    length: 0,
  } as Storage
}

import { useStore } from '../src/lib/store'
import type { TrainingProfile } from '../src/types'

async function runTests() {
  console.log('--- Testando Sincronização com Apple Watch ---')

  const profile: TrainingProfile = {
    goal: 'hypertrophy',
    experience: 'intermediate',
    currentState: 'active',
    location: 'gym_full',
    equipment: ['halteres', 'barra', 'banco', 'maquinas', 'polia', 'peso_corporal'],
    frequency: 4,
    sessionTimeMin: 45,
    limitations: [],
    biometrics: {},
    version: 1,
  }

  // 1. Setup inicial
  useStore.getState().completeOnboarding(profile)
  useStore.getState().activatePlan()
  const plan = useStore.getState().plan!

  console.log(`✓ Plano criado: ${plan.splitLabel} (${plan.days.length} dias)`)

  // 2. Iniciar sessão
  useStore.getState().startSession(plan.days[0].id)
  const session = useStore.getState().activeSession!
  console.log(`✓ Sessão iniciada: ${session.dayLabel} com ${session.exercises.length} exercícios`)

  // 3. Status Payload inicial
  const status1 = useStore.getState().getWatchStatusPayload()
  console.log(`✓ Status inicial do Watch: "${status1.summaryText}"`)
  if (!status1.active || !status1.exerciseName) {
    throw new Error('Falha no status do Watch: sessão deveria estar ativa')
  }

  // 4. Testar comando quick_log do Apple Watch
  const res1 = useStore.getState().executeWatchCommand({ action: 'quick_log' })
  console.log(`✓ Executado quick_log: "${res1.message}" (Descanso: ${res1.restSec}s)`)
  if (!res1.ok || res1.restSec === undefined) {
    throw new Error('Falha no comando quick_log')
  }

  // Validar se o log foi inserido e timer foi iniciado
  const sessionAfterLog1 = useStore.getState().activeSession!
  if (sessionAfterLog1.logs.length !== 1) {
    throw new Error(`Esperado 1 log, encontrado: ${sessionAfterLog1.logs.length}`)
  }
  if (!sessionAfterLog1.timer) {
    throw new Error('Timer de descanso deveria ter iniciado automaticamente')
  }

  // 5. Testar comando custom_log (peso e reps específicos pelo relógio)
  const res2 = useStore.getState().executeWatchCommand({
    action: 'custom_log',
    weight: 42.5,
    reps: 12,
  })
  console.log(`✓ Executado custom_log: "${res2.message}"`)
  if (!res2.ok) throw new Error('Falha no custom_log')

  const sessionAfterLog2 = useStore.getState().activeSession!
  const lastLog = sessionAfterLog2.logs[sessionAfterLog2.logs.length - 1]
  if (lastLog.weight !== 42.5 || lastLog.reps !== 12) {
    throw new Error(`Log customizado com valores incorretos: ${lastLog.weight}kg x ${lastLog.reps}`)
  }

  // 6. Testar comando +30s descanso
  const res3 = useStore.getState().executeWatchCommand({ action: 'add_rest' })
  console.log(`✓ Executado add_rest: "${res3.message}"`)
  if (!res3.ok) throw new Error('Falha no add_rest')

  // 7. Testar comando avançar exercício
  const res4 = useStore.getState().executeWatchCommand({ action: 'next_exercise' })
  console.log(`✓ Executado next_exercise: "${res4.message}"`)
  const sessionAfterNext = useStore.getState().activeSession!
  if (sessionAfterNext.currentIndex !== 1) {
    throw new Error('currentIndex deveria ser 1 após next_exercise')
  }

  console.log('\n✅ Todos os testes de integração do Apple Watch passaram com sucesso!')
}

runTests().catch((err) => {
  console.error('❌ Erro no teste:', err)
  process.exit(1)
})
