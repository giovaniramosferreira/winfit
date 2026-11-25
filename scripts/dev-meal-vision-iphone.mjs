// LAN-only development entrypoint. Never used by build or deployment.
import {createServer as createHttpServer} from 'node:http'
import {createReadStream} from 'node:fs'
import {chmod,mkdtemp,readFile,writeFile,access} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {networkInterfaces,tmpdir} from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createServer as createViteServer} from 'vite'

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
export function isPrivateIPv4(ip) {
 if(typeof ip!=='string'||!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip))return false
 const p=ip.split('.').map(Number)
 return p.every(n=>n>=0&&n<=255)&&(p[0]===10||(p[0]===192&&p[1]===168)||(p[0]===172&&p[1]>=16&&p[1]<=31))
}
export function allowedDownload(name) {
 return ['plate-vision-fp32.onnx','food101_labels.json'].includes(name)||/^cc-(0[1-9]|1\d|2[0-6])\.jpg$/.test(name)?name:null
}
const page=(title,body)=>`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><body style="font:17px system-ui;max-width:650px;margin:30px auto;padding:16px;line-height:1.6"><h1>${title}</h1>${body}</body></html>`
export async function startIphonePoc() {
 const ip=process.env.WINFIT_LAN_IP||Object.values(networkInterfaces()).flat().find(i=>i?.family==='IPv4'&&!i.internal&&isPrivateIPv4(i.address))?.address
 if(!isPrivateIPv4(ip))throw Error('Nenhum IPv4 privado encontrado. Informe WINFIT_LAN_IP com o IP da rede Wi-Fi do Mac.')
 const port=Number(process.env.WINFIT_HTTPS_PORT||5443),setupPort=Number(process.env.WINFIT_SETUP_PORT||5442)
 if(![port,setupPort].every(p=>Number.isInteger(p)&&p>1024&&p<=65535)||port===setupPort)throw Error('Portas de teste inválidas.')
 const fixtures=process.env.WINFIT_POC_DIR||path.join(tmpdir(),'winfit-meal-vision-poc')
 for(const file of ['plate-vision-fp32.onnx','food101_labels.json','images.json'])await access(path.join(fixtures,file))
 const directory=await mkdtemp(path.join(tmpdir(),'winfit-iphone-https-'));await chmod(directory,0o700)
 const openssl=(...args)=>execFileSync('/usr/bin/openssl',args,{cwd:directory,stdio:['ignore','pipe','pipe']})
 await writeFile(path.join(directory,'ca.cnf'),'[req]\ndistinguished_name=dn\nx509_extensions=v3_ca\nprompt=no\n[dn]\nCN=Winfit POC local - teste temporario\n[v3_ca]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\nsubjectKeyIdentifier=hash\n')
 openssl('req','-x509','-newkey','rsa:2048','-nodes','-sha256','-days','7','-keyout','ca-key.pem','-out','ca.pem','-config','ca.cnf')
 openssl('req','-new','-newkey','rsa:2048','-nodes','-sha256','-keyout','server-key.pem','-out','server.csr','-subj','/CN=Winfit POC local')
 await writeFile(path.join(directory,'server.ext'),`basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=IP:${ip},DNS:localhost,IP:127.0.0.1\n`)
 openssl('x509','-req','-in','server.csr','-CA','ca.pem','-CAkey','ca-key.pem','-CAcreateserial','-out','server.pem','-days','3','-sha256','-extfile','server.ext')
 openssl('x509','-in','ca.pem','-outform','DER','-out','winfit-poc-local.cer')
 for(const key of ['ca-key.pem','server-key.pem'])await chmod(path.join(directory,key),0o600)
 const certificate=await readFile(path.join(directory,'winfit-poc-local.cer'))
 const origin=`https://${ip}:${port}`,setup=`http://${ip}:${setupPort}`
 const manifest=JSON.parse(await readFile(path.join(fixtures,'images.json'),'utf8'))
 const images=manifest.images.filter(i=>i.download==='ok'&&allowedDownload(i.file))
 const downloads=page('Arquivos da POC local',`<p>Salve em Arquivos → Downloads do iPhone. Modelo somente para pesquisa; fotos públicas licenciadas. Nada será enviado para análise remota.</p><p><a href="/__poc-test/plate-vision-fp32.onnx">Baixar modelo ONNX (32,4 MiB)</a><br><a href="/__poc-test/food101_labels.json">Baixar rótulos JSON</a></p><p>Fotos: ${images.map(i=>`<a href="/__poc-test/${i.file}">${i.id}</a>`).join(' · ')}</p><p><a href="/#/nutrition">Abrir Alimentação → Adicionar refeição</a></p>`)
 process.env.VITE_MEAL_VISION_POC='true'
 const vite=await createViteServer({root,define:{'import.meta.env.VITE_SUPABASE_URL':'""','import.meta.env.VITE_SUPABASE_ANON_KEY':'""'},server:{host:ip,port,strictPort:true,cors:false,https:{key:await readFile(path.join(directory,'server-key.pem')),cert:await readFile(path.join(directory,'server.pem'))},hmr:{host:ip,protocol:'wss',clientPort:port}},plugins:[{name:'local-poc-downloads',configureServer(server){server.middlewares.use((req,res,next)=>{
  const pathname=new URL(req.url,'https://local.invalid').pathname
  if(pathname==='/__poc-test/'||pathname==='/__poc-test'){res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(downloads);return}
  if(!pathname.startsWith('/__poc-test/'))return next()
  const name=allowedDownload(pathname.slice('/__poc-test/'.length))
  if(!name){res.statusCode=404;res.end('Arquivo indisponível');return}
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/octet-stream');res.setHeader('Content-Disposition',`attachment; filename="${name}"`)
  const stream=createReadStream(path.join(fixtures,name));stream.on('error',()=>{if(!res.headersSent)res.statusCode=404;res.end()});stream.pipe(res)
 })}}]})
 const bootstrap=createHttpServer((req,res)=>{
  const pathname=new URL(req.url,'http://local.invalid').pathname
  res.setHeader('Cache-Control','no-store')
  if(pathname==='/winfit-poc-local.cer'){res.setHeader('Content-Type','application/x-x509-ca-cert');res.end(certificate);return}
  if(pathname!=='/'){res.statusCode=404;res.end();return}
  res.setHeader('Content-Type','text/html; charset=utf-8')
  res.end(page('Winfit — teste no iPhone',`<p>Mac e iPhone precisam estar na mesma rede Wi-Fi.</p><ol><li><a href="/winfit-poc-local.cer">Baixar certificado temporário Winfit POC local</a>. Instale em Ajustes → Perfil Baixado.</li><li>Em Ajustes → Geral → Sobre → Certificados Confiáveis, ative a confiança desta raiz.</li><li><a href="${origin}/__poc-test/">Abrir arquivos e POC por HTTPS</a>.</li></ol><p>Este servidor existe apenas no Mac, na rede local. Após o teste, remova o perfil do certificado do iPhone e encerre o servidor com Ctrl+C.</p>`))
 })
 try {await vite.listen();await new Promise((resolve,reject)=>{bootstrap.once('error',reject);bootstrap.listen(setupPort,ip,resolve)})}
 catch(error){await vite.close();bootstrap.close();throw error}
 const stop=async()=>{await vite.close();await new Promise(resolve=>bootstrap.close(resolve))}
 return {ip,origin,setup,downloads:`${origin}/__poc-test/`,app:`${origin}/#/nutrition`,certificateDirectory:directory,stop}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 startIphonePoc().then(server=>{
  console.log(JSON.stringify({setup:server.setup,downloads:server.downloads,app:server.app,certificateDirectory:server.certificateDirectory},null,2))
  process.once('SIGINT',()=>server.stop().then(()=>process.exit(0)));process.once('SIGTERM',()=>server.stop().then(()=>process.exit(0)))
 }).catch(error=>{console.error(error.message);process.exitCode=1})
}
