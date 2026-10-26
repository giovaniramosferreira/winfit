const assert = require('node:assert/strict')
const fs = require('node:fs')
const { chromium } = require(process.env.WINFIT_PLAYWRIGHT || 'playwright')
const base = process.env.WINFIT_SYNC_URL || 'http://127.0.0.1:5174/'
const results=[],failures=[],errors=[]
async function run(){
 const browser=await chromium.launch({channel:'chrome',headless:true})
 const contexts=[]
 async function scenario({storage={},user='accountA',remote=null,conflict=false,slowUser=false}={}){
  const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});contexts.push(context)
  const calls=[];let remoteState=remote,releaseUser;const userGate=new Promise(resolve=>releaseUser=resolve)
  await context.addInitScript(seed=>{
   window.__qaPath=p=>performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname===p).at(-1)?.name||p
   if(!sessionStorage.getItem('qa-initialized')){localStorage.clear();for(const [k,v] of Object.entries(seed))localStorage.setItem(k,v);sessionStorage.setItem('qa-initialized','1')}
  },storage)
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(!/^https?:/.test(url.protocol)||url.origin===new URL(base).origin)return route.continue()
   if(url.hostname!=='winfit-test.invalid')return route.fulfill({status:200,contentType:'application/json',body:'{}'})
   const method=req.method();let body=null;try{body=req.postDataJSON()}catch{}
   calls.push({method,path:url.pathname,query:url.search,body})
   let response={}
   if(url.pathname==='/auth/v1/user'){if(slowUser)await userGate;response={id:user,email:`${user}@example.invalid`}}
   else if(url.pathname.includes('/user_state')){
    if(method==='GET')response=remoteState?[{data:remoteState,updated_at:'2026-10-26T10:00:00.000Z'}]:[]
    if(method==='POST'){remoteState=body.data;response=[body]}
    if(method==='PATCH'){if(conflict)response=[];else{remoteState=body.data;response=[body]}}
    if(method==='DELETE'){remoteState=null;response=[{id:user}]}
   }
   try{await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(response)})}catch{}
  })
  const page=await context.newPage();page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message))
  const go=async route=>{await page.goto(`${base}#${route}`);await page.waitForTimeout(120)}
  const snap=()=>page.evaluate(async()=>{const{applicationSnapshot}=await import(window.__qaPath('/src/lib/applicationBackup.ts'));return applicationSnapshot()})
  const writes=()=>calls.filter(c=>['POST','PATCH','DELETE'].includes(c.method)&&c.path.includes('/user_state'))
  await go('/home')
  return{context,page,go,calls,writes,snap,releaseUser}
 }
 async function check(name,fn){try{await fn();results.push(name);console.log('PASS',name)}catch(e){failures.push({name,error:e.message});console.log('FAIL',name,e.message.split('\n')[0])}}
 try{
  const fixture=await scenario()
  const seed=await fixture.page.evaluate(async()=>{
   const{useStore}=await import(window.__qaPath('/src/lib/store.ts'));useStore.getState().completeOnboarding({goal:'health',experience:'none',currentState:'sometimes',location:'gym_full',equipment:['halteres','barra','banco','maquinas','polia','peso_corporal'],frequency:3,sessionTimeMin:30,limitations:[],biometrics:{},version:1});useStore.getState().startSession(useStore.getState().plan.days[0].id);useStore.getState().logSet(0,7.25,12);useStore.getState().setCurrentIndex(1);useStore.getState().startTimer(90)
   const{nutritionStore}=await import(window.__qaPath('/src/lib/nutritionStore.ts'));nutritionStore.upsertMeal({id:'private-local-meal',date:'2026-10-26',time:'12:00',type:'Almoço',items:[{id:'private-item',name:'Privado QA',portion:null,kcal:100}]})
   const{usePelvicStore}=await import(window.__qaPath('/src/lib/pelvicStore.ts'));usePelvicStore.getState().start('breathing-v1');usePelvicStore.getState().pause()
   const{useRoutineStore}=await import(window.__qaPath('/src/lib/routineStore.ts'));useRoutineStore.getState().update({checklists:{academia:[{id:'private-check',text:'Privado QA',done:false}],casa:[],viagem:[]}})
   const{applicationSnapshot}=await import(window.__qaPath('/src/lib/applicationBackup.ts'));return{storage:Object.fromEntries(Object.entries(localStorage)),snapshot:applicationSnapshot()}
  })
  await fixture.context.close()
  const auth=JSON.stringify({access_token:'synthetic-access',refresh_token:'',expires_at:4102444800})
  const remote=structuredClone(seed.snapshot);delete remote.modules
  remote.activeSession.id='remote-active';remote.activeSession.logs=remote.activeSession.logs.map(l=>({...l,id:`remote-${l.id}`}));remote.activeSession.startedAt-=10000
  const localId=seed.snapshot.activeSession.id
  await check('Sem dados locais restaura plano remoto sem onboarding e sem envio automático',async()=>{
   const s=await scenario({storage:{'winfit-auth-session':auth},remote});await s.page.getByRole('heading',{name:'Como vamos cuidar de você hoje?'}).waitFor();assert.equal((await s.snap()).plan.id,remote.plan.id);assert.equal(s.writes().length,0);await s.context.close()
  })
  await check('Local ativo é preservado ao entrar sem backup remoto; envio privado desligado por padrão',async()=>{
   const s=await scenario({storage:{...seed.storage,'winfit-auth-session':auth}});await s.go('/profile');await s.page.getByText('Alterações locais',{exact:true}).waitFor();assert.equal(s.writes().length,0);assert.equal((await s.snap()).activeSession.id,localId);assert.equal(await s.page.getByLabel('Incluir alimentação, saúde pélvica e rotina neste envio').isChecked(),false)
   await s.page.getByRole('button',{name:'Revisar e enviar backup',exact:true}).click();await s.page.getByText('Backup confirmado',{exact:true}).waitFor();assert.equal(s.writes().length,1);assert.ok(!s.writes()[0].body.data.modules);assert.ok(!JSON.stringify(s.writes()[0].body).includes('private-local-meal'));await s.context.close()
  })
  await check('Revisão remota oferece download; merge preserva ativos distintos sem enviar módulos privados',async()=>{
   const s=await scenario({storage:{...seed.storage,'winfit-auth-session':auth},remote});await s.go('/profile');await s.page.getByText('Revisão necessária',{exact:true}).waitFor();assert.equal(s.writes().length,0)
   const download=s.page.waitForEvent('download');await s.page.getByRole('button',{name:'Baixar cópia da nuvem',exact:true}).click();assert.equal((await download).suggestedFilename(),'winfit-backup-nuvem.json')
   await s.page.getByRole('button',{name:'Confirmar mesclagem e envio',exact:true}).click();await s.page.getByText('Backup confirmado',{exact:true}).waitFor();const merged=await s.snap();assert.equal(merged.activeSession.id,localId);assert.equal(merged.sessions.find(r=>r.id==='remote-active').status,'partial');assert.equal(Object.keys(s.writes()[0].body.data.modules ?? {}).length,0);assert.ok(!JSON.stringify(s.writes()[0].body.data).includes('private-local-meal'));assert.ok(merged.modules.nutrition.meals.some(m=>m.id==='private-local-meal'));assert.match(s.writes()[0].query,/updated_at=eq/);await s.context.close()
  })
  await check('Opt-in explícito envia três módulos privados',async()=>{
   const s=await scenario({storage:{...seed.storage,'winfit-auth-session':auth}});await s.go('/profile');await s.page.getByText('Alterações locais',{exact:true}).waitFor();await s.page.getByLabel('Incluir alimentação, saúde pélvica e rotina neste envio').check();await s.page.getByRole('button',{name:'Revisar e enviar backup',exact:true}).click();await s.page.getByText('Backup confirmado',{exact:true}).waitFor();const data=s.writes()[0].body.data;assert.ok(data.modules.nutrition.meals.some(m=>m.id==='private-local-meal'));assert.ok(data.modules.pelvic.active);assert.ok(data.modules.routine.checklists.academia.some(c=>c.id==='private-check'));await s.context.close()
  })
  await check('CAS PATCH sem linhas retorna falha e nunca confirmação',async()=>{
   const s=await scenario({storage:{...seed.storage,'winfit-auth-session':auth},remote,conflict:true});await s.go('/profile');await s.page.getByRole('button',{name:'Confirmar mesclagem e envio',exact:true}).waitFor();await s.page.getByRole('button',{name:'Confirmar mesclagem e envio',exact:true}).click();await s.page.getByText('Falha no backup',{exact:true}).waitFor();assert.match(await s.page.getByRole('alert').innerText(),/mudou em outro aparelho/);assert.equal(await s.page.getByText('Backup confirmado',{exact:true}).count(),0);await s.context.close()
  })
  await check('Logout interrompe novos envios e remove sessão local',async()=>{
   const s=await scenario({storage:{...seed.storage,'winfit-auth-session':auth}});await s.go('/profile');await s.page.getByRole('button',{name:'Sair',exact:true}).click();const before=s.writes().length;await s.page.getByRole('heading',{name:'Salve seu treino na sua conta',exact:true}).waitFor();await s.go('/nutrition');await s.go('/profile');assert.equal(s.writes().length,before);assert.equal(await s.page.evaluate(()=>localStorage.getItem('winfit-auth-session')),null);await s.context.close()
  })
  await check('Troca accountA→accountB exige confirmação; dismiss não envia POST',async()=>{
   const s=await scenario({storage:{...seed.storage,'winfit-auth-session':auth,'winfit-data-owner':'accountA'},user:'accountB'});await s.go('/profile');let dialogs=0;s.page.on('dialog',async d=>{dialogs++;assert.match(d.message(),/outra conta/);await d.dismiss()});await s.page.getByRole('button',{name:'Revisar e enviar backup',exact:true}).click();await s.page.waitForTimeout(150);assert.equal(dialogs,1);assert.equal(s.writes().length,0);await s.context.close()
  })
  await check('Logout durante restore lento não ressuscita sessão ou grava credenciais',async()=>{
   const s=await scenario({storage:{...seed.storage,'winfit-auth-session':auth},slowUser:true});await s.page.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>new URL(r.name).pathname==='/src/lib/auth.ts'))
   await s.page.evaluate(async()=>{const{signOut}=await import(window.__qaPath('/src/lib/auth.ts'));signOut()});s.releaseUser();await s.page.waitForTimeout(250);assert.equal(await s.page.evaluate(()=>localStorage.getItem('winfit-auth-session')),null);assert.equal(s.calls.filter(c=>c.path.includes('/user_state')).length,0);await s.context.close()
  })
  await check('Excluir remoto usa DELETE CAS e mantém dados locais',async()=>{
   const s=await scenario({storage:{...seed.storage,'winfit-auth-session':auth},remote});await s.go('/profile');await s.page.getByText('Revisão necessária',{exact:true}).waitFor();s.page.once('dialog',d=>d.accept());await s.page.getByRole('button',{name:'Excluir backup da conta',exact:true}).click();await s.page.getByText('Alterações locais',{exact:true}).waitFor();assert.ok(s.writes().some(c=>c.method==='DELETE'&&c.query.includes('updated_at=eq.')));assert.equal((await s.snap()).activeSession.id,localId);await s.context.close()
  })
  await check('Exportar arquivo completo e importar preserva módulos e sessão ativa',async()=>{
   const s=await scenario({storage:seed.storage});await s.go('/profile');const downloaded=s.page.waitForEvent('download');await s.page.getByRole('button',{name:'Exportar backup completo',exact:true}).click();const file=await downloaded;const exported=JSON.parse(fs.readFileSync(await file.path(),'utf8'));assert.ok(exported.modules.nutrition.meals.length);assert.equal(exported.activeSession.id,localId)
   await s.page.getByLabel('Mesclar um backup JSON',{exact:true}).setInputFiles({name:'synthetic-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(remote))});await s.page.getByRole('button',{name:'Confirmar mesclagem',exact:true}).click();await s.page.getByText('Backup mesclado. Registros locais preservados.',{exact:true}).waitFor();assert.equal((await s.snap()).activeSession.id,localId);assert.ok((await s.snap()).sessions.some(r=>r.id==='remote-active'));await s.context.close()
  })
 }finally{
  for(const c of contexts)await c.close().catch(()=>{});await browser.close()
  fs.mkdirSync('docs/qa',{recursive:true});fs.writeFileSync('docs/qa/sync-browser.md',`# QA browser de sincronização\n\n${new Date().toISOString()} · Chrome headless · ${base}\n\nConfiguração sintética: host winfit-test.invalid, chave pública fictícia. Todo HTTP externo interceptado; nenhuma chamada real ao Supabase ou relay. Dados e credenciais de teste sem identidade real.\n\n${results.map(r=>`- PASS: ${r}`).join('\n')}\n\n${failures.map(f=>`- FAIL: ${f.name}: ${f.error}`).join('\n')}\n\nPageerrors: ${errors.length}. Sem validação de RLS real ou backend hospedado; estes testes verificam contrato cliente com respostas simuladas.\n`)
 }
 if(failures.length||errors.length)process.exitCode=1
}
run().catch(e=>{console.error(e);process.exitCode=1})
