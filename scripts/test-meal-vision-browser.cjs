const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os')
const playwright=require(process.env.WINFIT_PLAYWRIGHT||'playwright')
const engine=process.env.WINFIT_BROWSER||'chromium'
assert.ok(['chromium','webkit'].includes(engine),'WINFIT_BROWSER must be chromium or webkit')
const base=process.env.WINFIT_URL||'http://127.0.0.1:5175/'
const fixtureDir=process.env.WINFIT_POC_DIR||path.join(os.tmpdir(),'winfit-meal-vision-poc')
const reportPath=path.resolve(process.env.WINFIT_POC_REPORT||`docs/testing/meal-vision-poc${engine==='webkit'?'-webkit':''}-results.json`)
const manifest=JSON.parse(fs.readFileSync(path.join(fixtureDir,'images.json'),'utf8'))
const annotationsPath=path.resolve('docs/testing/meal-vision-poc-annotations.json')
const annotations=fs.existsSync(annotationsPath)?JSON.parse(fs.readFileSync(annotationsPath,'utf8')):{}
const artifactDir=path.resolve('docs/testing/artifacts')
fs.mkdirSync(artifactDir,{recursive:true})
async function run(){
 const browser=await playwright[engine].launch({...(engine==='chromium'?{channel:process.env.PW_CHANNEL||'chrome'}:{}),headless:true})
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'America/Sao_Paulo'})
 const page=await context.newPage();page.setDefaultTimeout(10000)
 const external=[],errors=[],checks=[],results=[],blockedHttp=[]
 let denyHttp=false
 // WebKit's setOffline(true) also breaks in-memory Blob reads in this build.
 // HTTP isolation is a separate control, never reported as physical device offline.
 const offlineMode=engine==='webkit'?'http-isolation':'browser-offline-emulation'
 const setNetworkUnavailable=async(value)=>{if(engine==='webkit')denyHttp=value;else await context.setOffline(value)}
 page.on('pageerror',error=>errors.push(error.message))
 await context.route('**/*',route=>{const u=route.request().url();if(/^https?:/.test(u)&&new URL(u).origin!==new URL(base).origin){external.push(new URL(u).origin);return route.abort()}if(denyHttp&&/^https?:/.test(u)){blockedHttp.push(new URL(u).pathname);return route.abort()}return route.continue()})
 const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name)}
 try{
  await page.goto(base+'#/nutrition');await page.getByRole('button',{name:'Adicionar refeição',exact:true}).click()
  await page.getByText('Consultar uma foto (opcional)',{exact:true}).click()
  await page.getByLabel('Escolher foto da refeição').setInputFiles(path.join(fixtureDir,'cc-01.jpg'))
  await page.getByAltText('Rascunho da refeição, ainda não salvo').waitFor()
  await page.getByRole('button',{name:'Adicionar refeição',exact:true}).click()
  await check('Switching meals discards the previous photo draft',async()=>assert.equal(await page.getByAltText('Rascunho da refeição, ainda não salvo').count(),0))
  await page.getByText('POC de reconhecimento local (pesquisa)',{exact:true}).click()
  const lab=page.locator('.nutrition-vision-lab')
  await lab.getByLabel('Modelo ONNX local').setInputFiles(path.join(fixtureDir,'plate-vision-fp32.onnx'))
  await lab.getByLabel('Rótulos Food-101').setInputFiles(path.join(fixtureDir,'food101_labels.json'))
  // Real adapter, actual WASM inference. No model or analysis endpoint is mocked.
  const initialization=await page.evaluate(async()=>{
   const module=await import('/src/lib/localMealVision.ts'),inputs=document.querySelectorAll('.nutrition-vision-lab input[type=file]')
   window.__pocAdapter=await module.createLocalMealVision(inputs[0].files[0],inputs[1].files[0])
   return {...window.__pocAdapter.metrics,userAgent:navigator.userAgent}
  })
  for(const entry of manifest.images.filter(i=>i.download==='ok')){
   // Assign a separate, explicit local File for the evaluation; the page never fetches an image URL.
   const payload=fs.readFileSync(path.join(fixtureDir,entry.file)).toString('base64')
   const measured=await page.evaluate(async({payload})=>{
    const {prepareMealPhoto}=await import('/src/lib/mealPhoto.ts')
    const bytes=Uint8Array.from(atob(payload),c=>c.charCodeAt(0))
    const photo=await prepareMealPhoto(new File([bytes],'authorized-test.jpg',{type:'image/jpeg'}))
    const result=await window.__pocAdapter.analyze(photo)
    return {result,metrics:{...window.__pocAdapter.metrics}}
   },{payload})
   const annotation=annotations[entry.id]??null
   results.push({...entry,...measured,annotation,knownGrams:entry.knownGrams,portionErrorGrams:null,portionErrorPercent:null})
   console.log('ANALYZED',entry.id,measured.result.candidates.map(c=>c.name).join(','),Math.round(measured.metrics.analysisMs)+'ms')
  }
  await page.evaluate(()=>window.__pocAdapter.dispose())
  await check('Model cannot load without explicit research acknowledgment',async()=>assert.equal(await lab.getByRole('button',{name:'Carregar modelo local'}).isDisabled(),true))
  await lab.getByLabel('Estou avaliando').check();await lab.getByRole('button',{name:'Carregar modelo local'}).click()
  await lab.getByText('Modelo local pronto.',{exact:false}).waitFor({timeout:90000})
  await lab.getByLabel('Foto de teste autorizada').setInputFiles(path.join(fixtureDir,'cc-21.jpg'))
  await lab.getByLabel('Tenho autorização').check()
  await lab.getByRole('button',{name:'Analisar no aparelho'}).click()
  await lab.getByText('Revise as alternativas.',{exact:false}).waitFor({timeout:90000})
  await lab.getByRole('button',{name:'Não corresponde / foto sem alimento'}).click()
  await check('Non-food suggestions can be rejected without diary entries',async()=>assert.equal(await page.locator('fieldset').count(),1))
  await lab.getByLabel('Foto de teste autorizada').setInputFiles(path.join(fixtureDir,'cc-23.jpg'))
  await check('Image cannot be analyzed before local opt-in',async()=>assert.equal(await lab.getByRole('button',{name:'Analisar no aparelho'}).isDisabled(),true))
  await lab.getByLabel('Tenho autorização').check()
  async function analyze(){
   await lab.getByRole('button',{name:'Analisar no aparelho'}).click()
   await lab.getByRole('status').filter({hasText:/Revise as alternativas|análise falhou/}).waitFor({timeout:90000})
   assert.match(await lab.getByRole('status').innerText(),/Revise as alternativas/)
  }
  async function confirm(){
   await lab.getByRole('button',{name:'Revisar alternativa 1',exact:true}).click()
   await lab.getByRole('button',{name:'Calcular com catálogo de referência'}).click()
   await lab.getByLabel('Alimento e preparo de referência').selectOption('TACO-540')
   await lab.getByLabel('Peso consumido confirmado').fill('150')
   await lab.getByLabel('Preparo, carnes, óleo').fill('Teste de fluxo: 150 g hipotéticos, sem peso real conhecido; receita pode diferir da TACO.')
   assert.equal(await lab.getByRole('button',{name:'Aplicar item revisado'}).isDisabled(),true)
   await lab.getByLabel('Revisei o alimento').check();await lab.getByRole('button',{name:'Aplicar item revisado'}).click()
  }
  const readMeals=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('winfit-nutrition-v1')||'{"meals":[]}').meals)
  await setNetworkUnavailable(true)
  await analyze()
  await setNetworkUnavailable(false)
  await check(engine==='webkit'?'Loaded WASM model analyzes with HTTP blocked (not offline emulation)':'Loaded WASM model analyzes locally while offline',async()=>await lab.getByText('Revise as alternativas.',{exact:false}).waitFor())
  await check('Changing candidates resets reference and confirmation',async()=>{
   await lab.getByRole('button',{name:'Revisar alternativa 1',exact:true}).click()
   await lab.getByRole('button',{name:'Calcular com catálogo de referência'}).click()
   await lab.getByLabel('Alimento e preparo de referência').selectOption('TACO-540')
   await lab.getByLabel('Peso consumido confirmado').fill('150')
   await lab.getByLabel('Revisei o alimento').check()
   await lab.getByRole('button',{name:'Revisar alternativa 2',exact:true}).click()
   const button=lab.getByRole('button',{name:'Aplicar item revisado'})
   assert.equal(await button.count()===0 || await button.isDisabled(),true)
  })
  await check('Analysis alone never saves food or nutrients',async()=>assert.equal((await readMeals()).length,0))
  await lab.screenshot({path:path.join(artifactDir,`meal-vision-${engine}-analysis.png`)})
  await confirm();await analyze();await confirm()
  await page.getByRole('button',{name:'Salvar refeição',exact:true}).click()
  await check('Repeated review of the same photo consumes once',async()=>{const meals=await readMeals();assert.equal(meals.length,1);assert.equal(meals[0].items.length,1);assert.equal(meals[0].items[0].kcal,175.5)})
  await check('Reviewed meal and daily total are rendered',async()=>{
   assert.match(await page.locator('.nutrition-total').innerText(),/175,5\s*kcal/)
   assert.match(await page.locator('.nutrition-meal').innerText(),/Feijoada/)
   assert.equal(await page.locator('.nutrition-meal').count(),1)
  })
  await page.screenshot({path:path.join(artifactDir,`meal-vision-${engine}-saved.png`),fullPage:true})
  await page.getByRole('button',{name:'Editar refeição',exact:true}).click()
  await page.getByLabel('Porção em gramas (opcional)').fill('200')
  await page.getByRole('button',{name:'Salvar refeição',exact:true}).click()
  await check('Editing grams recalculates energy and macros',async()=>{const [meal]=await readMeals();assert.equal(meal.items[0].kcal,234);assert.equal(meal.items[0].macros.protein,17.4);assert.equal(meal.items[0].review.previousPortion,150)})
  await page.reload();await page.getByRole('button',{name:'Editar refeição',exact:true}).waitFor()
  await check('Reload preserves one meal and reference provenance',async()=>{const meals=await readMeals();assert.equal(meals.length,1);assert.equal(meals[0].items[0].provenance.recordId,'TACO-540')})
  await page.getByRole('button',{name:'Excluir refeição',exact:true}).click()
  await check('Deletion recalculates the day',async()=>assert.equal((await readMeals()).length,0))
  await page.getByText('Refeições excluídas (1)',{exact:true}).click();await page.getByRole('button',{name:'Restaurar refeição'}).click()
  await check('Restoration does not duplicate the meal',async()=>assert.equal((await readMeals()).length,1))
  await page.getByLabel('Mostrar calorias e nutrientes').uncheck()
  await check('Diary can hide calorie counting',async()=>{assert.equal(await page.locator('.nutrition-total').count(),0);assert.ok(!(await page.locator('.nutrition-meal').innerText()).includes('kcal'))})
  await page.getByLabel('Mostrar calorias e nutrientes').check()
  await page.getByRole('button',{name:'Editar refeição',exact:true}).click()
  await page.locator('fieldset').getByRole('button',{name:'Calcular com catálogo de referência'}).click()
  await page.locator('fieldset').getByLabel('Buscar alimento no catálogo').fill('farofa')
  await check('Unknown catalog entry asks for manual input',async()=>await page.getByText('Sem correspondência.',{exact:false}).waitFor())
  await setNetworkUnavailable(true)
  await page.getByLabel('Alimento',{exact:true}).fill('Alimento manual offline')
  await page.getByRole('button',{name:'Salvar refeição',exact:true}).click()
  await check(engine==='webkit'?'Manual editing with HTTP blocked invalidates old calculated nutrients':'Manual offline editing invalidates old calculated nutrients',async()=>{const [meal]=await readMeals();assert.equal(meal.items[0].name,'Alimento manual offline');assert.equal(meal.items[0].kcal,null);assert.equal(meal.items[0].macros,undefined)})
  await setNetworkUnavailable(false)
  await check('No external image or analysis requests',async()=>assert.deepEqual(external,[]))
  await check('No page errors',async()=>assert.deepEqual(errors,[]))
  const latencies=results.map(r=>r.metrics.analysisMs).sort((a,b)=>a-b)
  const report={schemaVersion:1,executedAt:new Date().toISOString(),platform:`${engine==='webkit'?'Playwright WebKit':'Chrome'} desktop ${browser.version()}, 390x844 touch emulation; NOT physical iPhone`,offlineMode,blockedHttpRequests:blockedHttp,initialization,checks,externalRequests:external,pageErrors:errors,screenshots:[`artifacts/meal-vision-${engine}-analysis.png`,`artifacts/meal-vision-${engine}-saved.png`],latencyMs:{min:latencies[0],median:latencies[Math.floor(latencies.length/2)],p95:latencies[Math.min(latencies.length-1,Math.ceil(latencies.length*.95)-1)],max:latencies.at(-1)},cost:{remoteInferenceRequests:0,remoteInferenceCost:0,deviceEnergy:'unmeasured',setupDownloadsExcluded:true},physicalIPhoneTest:null,images:results,downloadFailures:manifest.images.filter(i=>i.download!=='ok')}
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2));console.log('Report',reportPath,results.length,'images')
 }catch(error){console.error('Failure status:',await page.locator('.nutrition-vision-lab [role=status]').allTextContents().catch(()=>[]));throw error}finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1})
