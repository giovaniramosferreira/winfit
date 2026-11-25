const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os')
const playwright=require(process.env.WINFIT_PLAYWRIGHT||'playwright'),engine=process.env.WINFIT_BROWSER||'chromium'
assert.ok(['chromium','webkit'].includes(engine))
const base=process.env.WINFIT_URL||'http://127.0.0.1:5176/'
const directory=process.env.WINFIT_POC_DIR||path.join(os.tmpdir(),'winfit-meal-vision-poc')
const manifest=JSON.parse(fs.readFileSync(path.join(directory,'brazilian-images.json')))
const annotations=JSON.parse(fs.readFileSync('docs/testing/brazilian-meal-recognition-annotations.json'))
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
const selected=process.env.WINFIT_RECOGNITION_IDS?.split(',')
const artifacts=path.resolve('docs/testing/artifacts');fs.mkdirSync(artifacts,{recursive:true})
async function run(){
 const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})})
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,timezoneId:'America/Sao_Paulo'})
 const page=await context.newPage();page.setDefaultTimeout(12000)
 const external=[],errors=[],results=[],checks=[]
 page.on('pageerror',e=>errors.push(e.message))
 await context.route('**/*',route=>{const u=route.request().url();if(/^https?:/.test(u)&&new URL(u).origin!==new URL(base).origin){external.push(new URL(u).origin);return route.abort()}return route.continue()})
 const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name)}
 const outputPath=path.resolve(process.env.WINFIT_RECOGNITION_REPORT||`docs/testing/brazilian-recognition-${engine}-results.json`)
 let metadata=null,failure=null
 const save=()=>fs.writeFileSync(outputPath,JSON.stringify({executedAt:new Date().toISOString(),engine,platform:browser.version(),model:metadata,scope:'Real public images through browser adapter and actual local Ollama; no mocked vision outputs; filenames and annotations excluded from model input',checks,externalRequests:external,pageErrors:errors,images:results,failure},null,2))
 try{
  await page.goto(base+'#/nutrition')
  metadata=await page.evaluate(async()=>{const {connectLocalMealService}=await import('/src/lib/localMealService.ts');window.__mealService=await connectLocalMealService();return window.__mealService.metadata})
  for(const entry of manifest.images.filter(i=>i.download==='ok'&&(!selected||selected.includes(i.id)))){
   const payload=fs.readFileSync(path.join(directory,entry.file)).toString('base64')
   const measured=await page.evaluate(async(payload)=>{
    const {prepareMealPhoto}=await import('/src/lib/mealPhoto.ts')
    const bytes=Uint8Array.from(atob(payload),c=>c.charCodeAt(0)),photo=await prepareMealPhoto(new File([bytes],'authorized-public-image.jpg',{type:'image/jpeg'}))
    const result=await window.__mealService.analyze(photo,true)
    return {result,elapsedMs:window.__mealService.analysisMs}
   },payload)
   const annotation=annotations[entry.id]
   const names=measured.result.candidates.map(c=>normalize(c.name)),dish=normalize(measured.result.dishName||'')
   const matched=(annotation?.requiredGroups||[]).map(group=>({name:group.name,found:group.patterns.some(pattern=>names.some(name=>name.includes(normalize(pattern)))||(/feijoada/.test(group.name)&&dish.includes(normalize(pattern))))}))
   const quality=annotation?annotation.containsFood?(measured.result.containsFood===true&&matched.every(g=>g.found)):(measured.result.containsFood===false&&names.length===0):null
   results.push({...entry,...measured,annotation:annotation||null,matched,qualityPassed:quality});save()
   console.log('RECOGNIZED',entry.id,Math.round(measured.elapsedMs)+'ms',measured.result.dishName||'',measured.result.candidates.map(c=>c.name).join(' | '),'quality',quality)
  }
  await page.evaluate(()=>window.__mealService.dispose())
  await page.getByRole('button',{name:'Adicionar refeição',exact:true}).click()
  await page.getByText('POC de reconhecimento local (pesquisa)',{exact:true}).click()
  const lab=page.locator('.nutrition-vision-lab')
  await lab.getByText('Modelo pronto no Mac.',{exact:false}).waitFor({timeout:20000})
  await lab.getByLabel('Foto da refeição para reconhecimento').setInputFiles(path.join(directory,'cc-24.jpg'))
  await check('No analysis before explicit local consent',async()=>assert.equal(await lab.getByRole('button',{name:'Reconhecer alimentos',exact:true}).isDisabled(),true))
  await lab.getByLabel('Autorizo analisar esta foto').check()
  const analyze=async()=>{await lab.getByRole('button',{name:'Reconhecer alimentos',exact:true}).click();await lab.getByText('Alimentos reconhecidos.',{exact:false}).waitFor({timeout:150000})}
  await analyze()
  await check('Real recognition renders rice and beans before manual correction',async()=>{const text=normalize(await lab.locator('.nutrition-recognition-result').innerText());assert.ok(text.includes('arroz'));assert.ok(text.includes('feijao'))})
  await lab.screenshot({path:path.join(artifacts,`brazilian-recognition-${engine}.png`)})
  await lab.getByRole('button',{name:'Revisar alimentos no diário'}).click()
  async function fieldFor(word){const fields=page.locator('fieldset');for(let index=0;index<await fields.count();index++){const field=fields.nth(index);if(normalize(await field.getByLabel('Alimento',{exact:true}).inputValue()).includes(word))return field}throw Error('Recognized food missing from editor: '+word)}
  await check('Recognized foods populate the existing meal editor automatically',async()=>{await fieldFor('arroz');await fieldFor('feijao')})
  for(const [word,id] of [['arroz','TACO-3'],['feijao','TACO-561']]){
   const field=await fieldFor(word);await field.getByRole('button',{name:'Calcular com catálogo de referência'}).click()
   await field.getByLabel('Alimento e preparo de referência').selectOption(id)
   await field.getByLabel('Peso consumido confirmado').fill('100')
   await field.getByLabel('Revisei o alimento').check();await field.getByRole('button',{name:'Aplicar item revisado'}).click()
  }
  const before=await page.locator('fieldset').count()
  await analyze();await lab.getByRole('button',{name:'Revisar alimentos no diário'}).click()
  await check('Reanalysis does not duplicate items and keeps reviewed nutrients',async()=>{assert.equal(await page.locator('fieldset').count(),before);const rice=await fieldFor('arroz');assert.equal(await rice.getByLabel('Calorias da porção (opcional)').inputValue(),'128')})
  await page.getByRole('button',{name:'Salvar refeição',exact:true}).click()
  await check('Confirmed rice/beans update the rendered daily total',async()=>assert.match(await page.locator('.nutrition-total').innerText(),/204\s*kcal/))
  await page.screenshot({path:path.join(artifacts,`brazilian-recognition-${engine}-saved.png`),fullPage:true})
  await page.reload();await page.getByRole('button',{name:'Editar refeição',exact:true}).waitFor()
  await check('Reload preserves one meal and recognition provenance',async()=>{const meals=await page.evaluate(()=>JSON.parse(localStorage.getItem('winfit-nutrition-v1')).meals);assert.equal(meals.length,1);assert.ok(meals[0].items.every(i=>i.recognition));assert.ok(meals[0].items.some(i=>i.provenance?.recordId==='TACO-3'))})
  await page.getByRole('button',{name:'Excluir refeição',exact:true}).click()
  await check('Deleting a recognized meal recalculates the day',async()=>assert.match(await page.locator('.nutrition-total').innerText(),/^0\s*kcal/))
  await page.getByText('Refeições excluídas (1)',{exact:true}).click();await page.getByRole('button',{name:'Restaurar refeição'}).click()
  await check('Restoring a recognized meal restores the total once',async()=>assert.match(await page.locator('.nutrition-total').innerText(),/204\s*kcal/))
  await check('No third-party requests or page errors',async()=>{assert.deepEqual(external,[]);assert.deepEqual(errors,[])})
  const critical=results.filter(r=>r.annotation)
  await check('Brazilian recognition and non-food quality gate',async()=>{assert.ok(critical.length>=4,'Need multiple annotated critical cases');assert.deepEqual(critical.filter(r=>!r.qualityPassed).map(r=>({id:r.id,misses:r.matched.filter(m=>!m.found)})),[])})
  save();console.log('REPORT',outputPath,results.length,'actual images;',checks.length,'checks')
 }catch(error){failure=error.message;save();throw error}finally{await browser.close()}
}
run().catch(error=>{console.error(error);process.exitCode=1})
