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
const render = (el: ReturnType<typeof createElement>) => renderToStaticMarkup(createElement(StaticRouter, { location:'/home' },el))
assert.equal(sessionModules.length,4)
const hub = render(createElement(Home))
for (const path of ['/training','/calisthenics','/pelvic','/nutrition','/routine','/assistant']) assert.ok(hub.includes(`href="${path}"`),path)
assert.match(hub,/Respiração disponível/)
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

