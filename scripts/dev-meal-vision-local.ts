import {randomBytes} from 'node:crypto'
import {createServer} from 'vite'
import {createPocMealVisionHandler,MAX_POC_BODY_BYTES} from '../server/poc-meal-vision'
import {createOllamaMealProvider} from '../server/ollama-meal-provider'

const port=Number(process.env.WINFIT_LOCAL_VISION_PORT||5176)
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Porta local inválida.')
const origin=`http://127.0.0.1:${port}`
const token=randomBytes(32).toString('hex')
const provider=createOllamaMealProvider()
const handle=createPocMealVisionHandler({origin,token,...provider})
process.env.VITE_MEAL_VISION_POC='true'
const server=await createServer({
 define:{'import.meta.env.VITE_SUPABASE_URL':'""','import.meta.env.VITE_SUPABASE_ANON_KEY':'""'},
 server:{host:'127.0.0.1',port,strictPort:true,cors:false},
 plugins:[{name:'local-meal-vision',configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
  if(!req.url?.startsWith('/api/poc-meal-vision/'))return next()
  const controller=new AbortController()
  res.once('close',()=>{if(!res.writableEnded)controller.abort()})
  try {
   const chunks:Buffer[]=[];let size=0
   for await(const chunk of req){size+=chunk.length;if(size>MAX_POC_BODY_BYTES){res.statusCode=413;res.end('{"error":"Imagem grande demais."}');return}chunks.push(Buffer.from(chunk))}
   const headers=new Headers()
   for(const [key,value] of Object.entries(req.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):value)
   const request=new Request(origin+req.url,{method:req.method,headers,signal:controller.signal,...(req.method==='POST'?{body:Buffer.concat(chunks).toString('utf8')}:{})})
   const response=await handle(request)
   if(res.destroyed)return
   res.statusCode=response.status;response.headers.forEach((value,key)=>res.setHeader(key,value));res.end(await response.text())
  }catch{if(!res.destroyed){res.statusCode=503;res.setHeader('Content-Type','application/json');res.end('{"error":"Análise local indisponível. Continue pelo diário manual."}')}}
 })}}],
})
await server.listen()
console.log(`POC local de visão: ${origin}/#/nutrition — Ollama somente em 127.0.0.1; sem produção.`)
process.once('SIGINT',()=>{void server.close().then(()=>process.exit(0))})
process.once('SIGTERM',()=>{void server.close().then(()=>process.exit(0))})
