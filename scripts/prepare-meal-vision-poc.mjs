// Explicit research-only download, never invoked by dev/build/install.
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {tmpdir} from 'node:os'
import path from 'node:path'
if(!process.argv.includes('--research-only'))throw Error('Use --research-only after reading docs/meal-vision-poc.md. These weights are not licensed for production.')
const destination=path.resolve(process.env.WINFIT_POC_DIR||path.join(tmpdir(),'winfit-meal-vision-poc'))
const commit='d5690063cc8795497c603aa676f97fd253053bbf'
const raw=`https://raw.githubusercontent.com/simonkundrik/plate-vision/${commit}`
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Download failed: ${r.status} ${url}`);return new Uint8Array(await r.arrayBuffer())}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
await mkdir(destination,{recursive:true})
for(const [name,url,expected] of [
 ['plate-vision-fp32.onnx','https://github.com/simonkundrik/plate-vision/releases/download/model-v0.2.0/plate-vision-fp32.onnx','3f982c4aa8658a032cbc2a656040953a17744a3d35df11b49e722eed07f9f431'],
 ['food101_labels.json',`${raw}/packages/client/src/generated/food101_labels.json`,'69b2f2163d477822dd3786b9425c6b1348180febfd71d23ec4491badc7c66de4'],
]) {
 let bytes;try{bytes=await readFile(path.join(destination,name))}catch{}
 if(!bytes || hash(bytes)!==expected)bytes=await get(url)
 if(hash(bytes)!==expected)throw Error(`Digest mismatch: ${name}`)
 await writeFile(path.join(destination,name),bytes)
 console.log('verified',name,bytes.length)
}
const manifest=JSON.parse(new TextDecoder().decode(await get(`${raw}/model/data/ood/manifest.json`)))
const selections=[['fried_rice',3],['bibimbap',3],['steak',3],['beet_salad',3],['pork_chop',3],['caesar_salad',3],['spring_rolls',2]]
const selected=selections.flatMap(([key,count])=>manifest.images.filter(i=>i.class_key===key).slice(0,count))
// Deliberate non-food photos accidentally returned by a food search; no food label is trusted.
selected.push(...manifest.images.filter(i=>i.class_key==='spring_rolls' && /Spring Rolling Hills/.test(i.attribution)).slice(0,2))
const supplements=[
 ['FeijoadaBrasileira.jpg','5/51','Operoxido','by-sa','4.0'],
 ['Arroz,_feijão_e_farofa.jpg','8/8f','Felipe Spina','by','2.0'],
 ['Rice,_beans_and_vegetables_in_Brazil.jpg','c/c1','Mike Peel (www.mikepeel.net)','by-sa','4.0'],
 ['Feijoada_completa.jpg','4/42','Andre S. Ribeiro','by','2.0'],
]
selected.push(...supplements.map(([name,folder,author,license,version])=>({
 class_key:'brazilian-mixed',label:null,identifier:name,
 url:`https://upload.wikimedia.org/wikipedia/commons/${folder}/${encodeURIComponent(name)}`,
 license,license_url:`https://creativecommons.org/licenses/${license}/${version}/`,
 attribution:`${name.replaceAll('_',' ')} — ${author}, CC ${license.toUpperCase()} ${version}. Unmodified original; analysis uses resized/re-encoded pixels.`,
 source:'Wikimedia Commons',foreign_landing_url:`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name)}`,
})))
const entries=[]
for(const [index,image] of selected.entries()) {
 const id=`cc-${String(index+1).padStart(2,'0')}`
 const entry={id,file:`${id}.jpg`,...image,expectedVisibleItems:null,expectedFood101Label:null,containsFood:null,knownGrams:null,annotationStatus:'unreviewed',licenseEvidence:`plate-vision ${commit} model/data/ood/manifest.json`}
 try {
  if(!['by','by-sa','cc0','pdm'].includes(image.license))throw Error('License not allowed')
  let bytes;try{bytes=await readFile(path.join(destination,entry.file))}catch{bytes=await get(image.url)}
  await writeFile(path.join(destination,entry.file),bytes)
  entries.push({...entry,sha256:hash(bytes),download:'ok'})
 }catch(e){entries.push({...entry,download:'failed',error:e.message})}
}
await writeFile(path.join(destination,'images.json'),JSON.stringify({schemaVersion:1,upstreamCommit:commit,labelWarning:manifest.label_quality,images:entries},null,2))
console.log('Research fixtures',destination,entries.filter(e=>e.download==='ok').length,'downloaded; annotations must be reviewed before interpreting recognition results.')
