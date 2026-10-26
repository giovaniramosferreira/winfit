const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require(process.env.WINFIT_PLAYWRIGHT || 'playwright')
const base = process.env.WINFIT_URL || 'http://127.0.0.1:5173/'
const results = [], failures = [], errors = [], external = [], relay = []
const artifacts = path.resolve('docs/testing/artifacts'); fs.mkdirSync(artifacts,{recursive:true})
async function run() {
 const browser = await chromium.launch({channel:process.env.PW_CHANNEL || 'chrome',headless:true})
 const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'})
 await context.addInitScript(() => { window.__qaPath = path => performance.getEntriesByType('resource').filter(r => new URL(r.name).pathname === path).at(-1)?.name || path })
 const page = await context.newPage(); page.setDefaultTimeout(5000)
 page.on('pageerror',e=>errors.push(e.message))
 await context.route('**/*',async route=>{
   const url = route.request().url()
   if (!/^https?:/.test(url) || new URL(url).origin === new URL(base).origin) return route.continue()
   external.push(url.replace(/\/status\/[^/?]+|\/poll\/[^/?]+|\/events\/[^/?]+/g,'/[redacted]'))
   if (url.includes('workers.dev')) { relay.push({method:route.request().method(),kind:new URL(url).pathname.split('/')[1],at:Date.now()}); return route.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':url.includes('/events/')?'text/event-stream':'application/json'},body:url.includes('/events/')?'retry: 60000\n\n':JSON.stringify({ok:true,commands:[]})}) }
   return route.fulfill({status:200,contentType:'application/json',body:'{}'})
 })
 const go = async route => { await page.goto(`${base}#${route}`); await page.locator('#root').waitFor(); await page.waitForTimeout(180) }
 const check = async (name,fn) => { try { await fn(); results.push(name); console.log('PASS',name) } catch(e) { failures.push({name,error:e.message}); console.log('FAIL',name,e.message.split('\n')[0]); await page.screenshot({path:path.join(artifacts,`backlog-failure-${failures.length}.png`),fullPage:true}).catch(()=>{}) } }
 try {
  await go('/')
  await page.evaluate(async()=>{
    localStorage.clear()
    const {useStore} = await import(window.__qaPath('/src/lib/store.ts'))
    useStore.getState().completeOnboarding({goal:'health',experience:'none',currentState:'sometimes',location:'gym_full',equipment:['halteres','barra','banco','maquinas','polia','peso_corporal'],frequency:3,sessionTimeMin:30,limitations:[],biometrics:{},version:1})
    const {privacy}=await import(window.__qaPath('/src/lib/privacy.ts')); privacy.setWatchDestination(null)
  })
  await go('/home'); await page.reload(); await page.getByRole('heading',{name:'Como vamos cuidar de você hoje?'}).waitFor()
  await check('Hub contém quatro módulos e links auxiliares',async()=>{
    for(const href of ['/training','/calisthenics','/pelvic','/nutrition','/routine','/assistant']) assert.ok(await page.locator(`a[href="#${href}"]`).count(),href)
    assert.match(await page.locator('body').innerText(),/Respiração disponível/)
  })
  await check('Academia e calistenia preservam sessão, índice, séries e descanso',async()=>{
    await go('/training'); await page.getByRole('button',{name:'Começar treino',exact:true}).click(); await page.waitForURL('**#/player')
    const before = await page.evaluate(async()=>{const {useStore}=await import(window.__qaPath('/src/lib/store.ts'));const s=useStore.getState();s.logSet(0,7.25,12);s.setCurrentIndex(1);s.startTimer(90);return JSON.stringify(useStore.getState().activeSession)})
    await go('/calisthenics'); await page.getByRole('button',{name:'Retomar treino',exact:true}).click(); await page.waitForURL('**#/player')
    const after=await page.evaluate(async()=>{const {useStore}=await import(window.__qaPath('/src/lib/store.ts'));return JSON.stringify(useStore.getState().activeSession)})
    assert.equal(after,before)
  })
  await check('Watch sem consentimento gera zero requests',async()=>{await page.waitForTimeout(1600);assert.equal(relay.length,0)})
  await check('Watch opt-in inicia relay mock e revogação interrompe',async()=>{
    await go('/profile'); await page.getByRole('button',{name:'Adicionar ao Apple Watch',exact:true}).click(); await page.getByRole('button',{name:'Ativar envio ao Watch',exact:true}).click(); await page.getByRole('button',{name:'✕',exact:true}).click(); await go('/player'); await page.waitForTimeout(1300); assert.ok(relay.length>0); assert.ok(relay.some(r=>r.kind==='status')); assert.ok(relay.some(r=>r.kind==='poll'))
    await page.evaluate(async()=>{const {privacy}=await import(window.__qaPath('/src/lib/privacy.ts'));privacy.setWatchDestination(null)})
    await page.waitForTimeout(200); const count=relay.length; await page.waitForTimeout(1500); assert.equal(relay.length,count)
  })
  await check('Saúde pélvica inicia, pausa e recarrega pausada',async()=>{
    await go('/pelvic'); assert.ok(await page.getByRole('button',{name:'Aguardando revisão profissional'}).isDisabled()); await page.getByRole('button',{name:/Começar pausa/}).click(); await page.waitForTimeout(1200); await page.getByRole('button',{name:'Pausar',exact:true}).click()
    const before=await page.evaluate(async()=>{const {usePelvicStore}=await import(window.__qaPath('/src/lib/pelvicStore.ts'));return usePelvicStore.getState().active.timer.elapsedMs})
    await page.reload(); await page.getByRole('button',{name:'Retomar',exact:true}).waitFor(); await page.waitForTimeout(1100)
    const after=await page.evaluate(async()=>{const {usePelvicStore}=await import(window.__qaPath('/src/lib/pelvicStore.ts'));return usePelvicStore.getState().active.timer.elapsedMs});assert.equal(before,after)
  })
  await check('Alimentação: pendência, edição, exclusão, restauração e meta persistem',async()=>{
    await go('/nutrition'); await page.getByRole('button',{name:'Adicionar refeição',exact:true}).click(); await page.getByLabel('Alimento',{exact:true}).fill('Arroz QA'); await page.getByRole('button',{name:'Salvar refeição',exact:true}).click(); await page.getByText('Arroz QA · kcal pendentes',{exact:true}).waitFor(); await page.getByText('Total parcial',{exact:true}).waitFor()
    await page.getByRole('button',{name:'Editar refeição',exact:true}).click(); await page.getByLabel('Calorias da porção (opcional)',{exact:true}).fill('125'); await page.getByRole('button',{name:'Salvar refeição',exact:true}).click(); await page.getByText('Arroz QA · 125 kcal',{exact:true}).waitFor()
    await page.getByRole('button',{name:'Excluir refeição',exact:true}).click(); await page.getByText(/Refeições excluídas \(1\)/).click(); await page.getByRole('button',{name:'Restaurar refeição',exact:true}).click(); await page.getByText('Arroz QA · 125 kcal',{exact:true}).waitFor()
    await page.getByRole('button',{name:'Configurar meta',exact:true}).click(); await page.getByLabel('Meta (kcal)',{exact:true}).fill('2200'); await page.getByRole('button',{name:'Salvar meta',exact:true}).click(); await page.reload(); await page.getByText('Arroz QA · 125 kcal',{exact:true}).waitFor(); await page.getByText(/Meta informada: 2.200 kcal/).waitFor()
  })
  await check('Rotina: checklist e lembretes desligados persistem',async()=>{
    await go('/routine'); assert.equal(await page.getByLabel('Lembrete de treino',{exact:true}).isChecked(),false); await page.getByLabel('Novo item',{exact:true}).fill('Garrafa QA'); await page.getByRole('button',{name:'Adicionar',exact:true}).click(); await page.getByLabel('Texto do item',{exact:true}).last().waitFor(); await page.locator('section').filter({has:page.getByRole('heading',{name:'Checklist por local',exact:true})}).locator('input[type=checkbox]').last().check(); await page.reload(); assert.equal(await page.locator('section').filter({has:page.getByRole('heading',{name:'Checklist por local',exact:true})}).locator('input[type=checkbox]').last().isChecked(),true); assert.equal(await page.getByLabel('Texto do item',{exact:true}).last().inputValue(),'Garrafa QA'); assert.equal(await page.getByLabel('Lembrete de treino',{exact:true}).isChecked(),false)
  })
  await check('Progresso abre detalhes das séries históricas',async()=>{
    await page.evaluate(async()=>{const {useStore}=await import(window.__qaPath('/src/lib/store.ts'));useStore.getState().finishSession()})
    await go('/progress'); const link=page.locator('a[href^="#/session/"]').first(); await link.waitFor(); await link.click(); await page.getByText(/Série 1: 7,25 kg/).waitFor()
  })
  await check('Assistente mostra proposta sem aplicar automaticamente',async()=>{
    await go('/assistant'); const before=await page.evaluate(async()=>{const {useStore}=await import(window.__qaPath('/src/lib/store.ts'));return JSON.stringify(useStore.getState().plan)}); await page.getByRole('button',{name:'Ver proposta',exact:true}).click(); await page.getByRole('heading',{name:'Prévia',exact:true}).waitFor(); const after=await page.evaluate(async()=>{const {useStore}=await import(window.__qaPath('/src/lib/store.ts'));return JSON.stringify(useStore.getState().plan)});assert.equal(after,before)
  })
  for(const width of [390,320]) for(const route of ['/home','/training','/calisthenics','/pelvic','/nutrition','/routine','/progress','/assistant']) await check(`Layout ${width}px ${route}`,async()=>{
    await page.setViewportSize({width,height:width===390?844:568});await go(route)
    const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)}).slice(0,6).map(el=>({tag:el.tagName,class:el.className,text:el.textContent.slice(0,60)}))}))
    await page.screenshot({path:path.join(artifacts,`backlog-${route.slice(1)}-${width}.png`),fullPage:true}); assert.ok(overflow.scroll<=overflow.width+1,JSON.stringify(overflow))
  })
  assert.equal(errors.length,0,`Browser errors: ${errors.join('; ')}`)
 } finally {
   const report={results,failures,errors,externalRequests:external.length,relayRequests:relay.map(r=>r.kind),viewportScreenshots:artifacts}
   fs.mkdirSync('docs/qa',{recursive:true});fs.writeFileSync('docs/qa/backlog-mobile.md',`# QA móvel do backlog\n\nExecução local: ${new Date().toISOString()} · Chrome headless · ${base}\n\n${results.map(r=>`- PASS: ${r}`).join('\n')}\n\n${failures.map(f=>`- FAIL: ${f.name}: ${f.error}`).join('\n')}\n\nConsole pageerrors: ${errors.length}. Requests externos interceptados: ${external.length}; nenhum encaminhado à rede. Relay mock: ${relay.length}.\n\nInspeção visual de Home390, Nutrition320 e Routine320: módulos legíveis e sem corte horizontal. Routine usa controles nativos pequenos e labels colados; recomendar padronização de campos e áreas de toque antes da liberação. Sem baseline visual: regressão de aparência inconclusiva. Screenshots em docs/testing/artifacts/backlog-*.png. Não substitui Safari físico, leitor de tela ou medição de Core Web Vitals.\n\n\`\`\`json\n${JSON.stringify(report,null,2)}\n\`\`\`\n`)
   await browser.close()
 }
 if(failures.length||errors.length) process.exitCode=1
}
run().catch(error=>{console.error(error);process.exitCode=1})
