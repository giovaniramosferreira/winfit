import assert from 'node:assert/strict'
import {readdir,readFile} from 'node:fs/promises'
import path from 'node:path'
async function files(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(path.join(dir,e.name)):path.join(dir,e.name)))).flat()}
const built=await files('dist')
assert.ok(!built.some(f=>/\.onnx$|ort-wasm|MealVisionLab|onnxruntime/i.test(f)),'Production must not distribute research/runtime artifacts')
for(const filename of built.filter(f=>/\.(js|html)$/.test(f))){
 const text=await readFile(filename,'utf8')
 assert.ok(!text.includes('Laboratório local de foto')&&!text.includes('plate-vision/model-v0.2.0')&&!text.includes('ort-wasm-simd-threaded'),`Research lab leaked into ${filename}`)
}
console.log('Production exclusion: no lab, research model or ONNX runtime/WASM artifacts PASS')
