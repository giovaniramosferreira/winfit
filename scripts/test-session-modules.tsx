import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'



import { useStore } from '../src/lib/store'
import { generatePlan } from '../src/lib/generator'
import type { TrainingProfile } from '../src/types'
const { sessionModules, startTraining } = await import('../src/data/sessionModules')
const { default: Training } = await import('../src/pages/Training')
const { default: Home } = await import('../src/pages/Home')
const profile: TrainingProfile = { goal:'health', experience:'none', currentState:'sometimes', location:'gym_full', equipment:['halteres','barra','banco','maquinas','polia','peso_corporal'], frequency:3, sessionTimeMin:30, limitations:[], biometrics:{}, version:1 }
const plan = generatePlan(profile,'module-test')
useStore.setState({ profile,plan,sessions:[],activeSession:null,prs:[],seed:'module-test' })
const render = (el: ReturnType<typeof createElement>) => {
  const initial = useStore.getInitialState(); const previous = { ...initial }
  Object.assign(initial,useStore.getState())
  try { return renderToStaticMarkup(createElement(StaticRouter,{ location:'/home' },el)) }
  finally { Object.assign(initial,previous) }
}
assert.equal(sessionModules.length,4)
const hub = render(createElement(Home))
for (const path of ['/training','/calisthenics','/pelvic','/nutrition']) assert.ok(hub.includes(`href="${path}"`),path)
for (const path of ['/routine','/assistant']) assert.ok(!hub.includes(`href="${path}"`), 'Secondary shortcuts stay outside Home')
assert.match(hub,/Respiração disponível/)
assert.match(hub,/home-hub/, 'Home owns a viewport-sized layout')
assert.match(hub,/home-module-grid/, 'Four modules share a compact grid')
assert.equal((hub.match(/class="home-module-art /g) || []).length, 4, 'Every module has an illustration')
assert.ok(!hub.includes('Instalar o WinFit'), 'Installation stays available in Profile instead of stretching Home')
assert.match(hub,/0 de 3 treinos/, 'Weekly summary shows actual recorded sessions against the local goal')
const gym = render(createElement(Training,{ mode:'gym' }))
assert.match(gym,/Academia/)
assert.ok(!gym.includes('Começar em casa'))
const home = render(createElement(Training,{ mode:'home' }))
assert.match(home,/Calistenia/)
assert.match(home,/Casa A/)
assert.ok(!home.includes('Treinar outro dia do plano'))
assert.ok(!home.includes('Último recorde'))
assert.equal(startTraining('gym',plan.days[0].id),'started')
const first = useStore.getState().activeSession!
const resumeHub = render(createElement(Home))
assert.match(resumeHub,/Retomar treino/)
assert.match(resumeHub,/home-resume/, 'Active workout uses a compact resume action')
useStore.setState({ sessions: [{ ...first, status: 'completed', endedAt: Date.now() }] })
assert.match(render(createElement(Home)), /1 de 3 treinos/, 'Completed sessions update the weekly summary')
useStore.setState({ sessions: [] })
useStore.getState().setCurrentIndex(1)
assert.equal(startTraining('home'),'resumable')
assert.equal(useStore.getState().activeSession!.id,first.id)
assert.equal(useStore.getState().activeSession!.currentIndex,1)
useStore.setState({activeSession:{...useStore.getState().activeSession!,startedAt:1}})
assert.equal(startTraining('gym',plan.days[1].id),'expired')
assert.equal(useStore.getState().activeSession!.id,first.id)
const activeHome = render(createElement(Training,{ mode:'home' }))
assert.match(activeHome,/Academia em andamento/)
assert.ok(activeHome.includes(first.dayLabel))
console.log('Session modules: four links, separate training modes, active session and index preserved OK')
