import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import Routine from '../src/pages/Routine'
import Nutrition from '../src/pages/Nutrition'
import Pelvic from '../src/pages/Pelvic'
import Assistant from '../src/pages/Assistant'
import MealPhotoDraft from '../src/components/MealPhotoDraft'
import { useStore } from '../src/lib/store'
import { generatePlan } from '../src/lib/generator'
import type { TrainingProfile } from '../src/types'
const profile: TrainingProfile = { goal:'health', experience:'none', currentState:'sometimes', location:'gym_full', equipment:['halteres','barra','banco','maquinas','polia','peso_corporal'], frequency:3, sessionTimeMin:30, limitations:[], biometrics:{}, version:1 }
const initial = useStore.getInitialState()
Object.assign(initial, { profile, plan: generatePlan(profile,'wellness-test'), sessions: [], activeSession: null })
const render = (Component: typeof Routine) => renderToStaticMarkup(createElement(StaticRouter, { location:'/home' }, createElement(Component)))
const routine = render(Routine)
const panels = routine.match(/<section[^>]*role="tabpanel"[^>]*>/g) ?? []
assert.equal(panels.length,3)
assert.equal(panels.filter(panel => !panel.includes('hidden=""')).length,1,'Only one routine section is visible')
assert.match(routine,/Usar fuso deste aparelho/)
const nutrition = render(Nutrition)
assert.ok(!nutrition.includes('Todos os itens registrados têm calorias informadas.'))
assert.match(nutrition,/Nenhuma refeição registrada neste dia/)
const assistant = render(Assistant)
assert.ok(assistant.indexOf('id="assistant-adaptation"') < assistant.indexOf('assistant-context'),'Adaptation comes before optional context')
assert.match(assistant,/<details[^>]*assistant-context/)
const pelvic = render(Pelvic)
assert.match(pelvic,/Kegel aguardam revisão profissional/)
assert.match(pelvic,/<button[^>]*disabled=""[^>]*>Aguardando revisão profissional/)
assert.ok(pelvic.indexOf('Pare se sentir dor') < pelvic.indexOf('Começar pausa'),'Essential guidance before start')
const photo = render(MealPhotoDraft)
assert.ok(photo.indexOf('não será anexada') < photo.indexOf('Tirar foto'),'Photo limits before selection')
assert.match(photo,/Salvar, cancelar ou fechar este formulário/)
console.log('Wellness usability: one visible section, primary adaptation, empty nutrition, pelvic gate and photo discard disclosure OK')
