import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {createHash} from 'node:crypto'
const directory=process.env.WINFIT_POC_DIR||path.join(tmpdir(),'winfit-meal-vision-poc')
await mkdir(directory,{recursive:true})
const original=JSON.parse(await readFile(path.join(directory,'images.json'),'utf8'))
const supplements=[
 {id:'br-01',title:'Feijoada_completa.jpg',url:'https://upload.wikimedia.org/wikipedia/commons/4/42/Feijoada_completa.jpg',author:'Andre S. Ribeiro',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/'},
 {id:'br-02',title:'Rice,_beans_and_vegetables_in_Brazil.jpg',url:'https://upload.wikimedia.org/wikipedia/commons/c/c1/Rice%2C_beans_and_vegetables_in_Brazil.jpg',author:'Mike Peel (www.mikepeel.net)',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'},
 {id:'br-03',title:'Coxinha.jpg',url:'https://upload.wikimedia.org/wikipedia/commons/8/81/Coxinha.jpg',author:'Tom B',license:'Public Domain',licenseUrl:'https://commons.wikimedia.org/wiki/File:Coxinha.jpg'},
 {id:'br-04',title:'Pao_de_queijo.jpg',url:'https://upload.wikimedia.org/wikipedia/commons/3/3f/Pao_de_queijo.jpg',author:'Carioca',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'},
]
for(const item of supplements){
 item.file=item.id+'.jpg';item.source='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(item.title)
 try{
  let bytes;try{bytes=await readFile(path.join(directory,item.file))}catch{const response=await fetch(item.url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('HTTP '+response.status);bytes=new Uint8Array(await response.arrayBuffer());await writeFile(path.join(directory,item.file),bytes)}
  item.sha256=createHash('sha256').update(bytes).digest('hex');item.download='ok'
 }catch(e){item.download='failed';item.error=e.message}
 console.log(item.id,item.download,item.error||item.sha256)
}
await writeFile(path.join(directory,'brazilian-images.json'),JSON.stringify({version:1,images:[...original.images.filter(i=>i.download==='ok'),...supplements],annotationPolicy:'Visual inspection and source captions only; no measured portions, no hidden ingredients; never send filenames/labels to the vision model.'},null,2))
