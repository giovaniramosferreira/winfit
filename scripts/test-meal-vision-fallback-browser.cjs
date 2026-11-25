const assert=require('node:assert/strict')
const playwright=require(process.env.WINFIT_PLAYWRIGHT||'playwright')
const engine=process.env.WINFIT_BROWSER||'chromium'
assert.ok(['chromium','webkit'].includes(engine))
;(async()=>{
 const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'?{channel:process.env.PW_CHANNEL||'chrome'}:{})})
 try {
  const context=await browser.newContext(),page=await context.newPage()
  await context.route('**/src/components/MealVisionLab.tsx*',route=>route.abort())
  await page.goto((process.env.WINFIT_URL||'http://127.0.0.1:5175/')+'#/nutrition')
  await page.getByRole('button',{name:'Adicionar refeição',exact:true}).click()
  await page.getByText('POC de reconhecimento local (pesquisa)',{exact:true}).click()
  await page.getByText('O laboratório não pôde ser carregado.',{exact:false}).waitFor({timeout:10000})
  assert.equal(await page.getByRole('button',{name:'Salvar refeição',exact:true}).isVisible(),true,'A failed research chunk must preserve the manual diary')
  await page.getByLabel('Alimento',{exact:true}).fill('Registro manual após falha de rede')
  await page.getByRole('button',{name:'Salvar refeição',exact:true}).click()
  const meals=await page.evaluate(()=>JSON.parse(localStorage.getItem('winfit-nutrition-v1')).meals)
  assert.equal(meals.length,1);assert.equal(meals[0].items[0].kcal,null)
  console.log(`${engine}: cold lab import failure preserves manual saving PASS`)
 } finally {await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1})
