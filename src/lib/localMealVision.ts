import * as ort from 'onnxruntime-web/wasm'
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'
import wasmModuleUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url'
import { candidatesFromLogits, type LocalVisionAdapter } from './mealVision'
import { RESEARCH_MODEL, rgbFromRgba, validateResearchArtifacts } from './mealVisionArtifacts'

export interface VisionMetrics { modelBytes:number; initializationMs:number; analysisMs:number|null; jsHeapBytes:number|null }
export interface MeasuredLocalVision extends LocalVisionAdapter { metrics:VisionMetrics }
export async function createLocalMealVision(modelFile:File,labelsFile:File):Promise<MeasuredLocalVision> {
  if(modelFile.size!==RESEARCH_MODEL.bytes || labelsFile.size>100_000)throw Error('Tamanho do modelo ou dos rótulos incompatível.')
  const start=performance.now()
  const model=await modelFile.arrayBuffer(),labels=await validateResearchArtifacts(model,await labelsFile.arrayBuffer())
  // Self-hosted WASM/JS assets only. No CDN, image request, worker relay or external data.
  ort.env.wasm.wasmPaths={wasm:wasmUrl,mjs:wasmModuleUrl}
  ort.env.wasm.numThreads=1
  ort.env.logLevel='fatal'
  const session=await ort.InferenceSession.create(model,{executionProviders:['wasm'],logSeverityLevel:4})
  if(session.inputNames.length!==1 || session.inputNames[0]!=='image' || !session.outputNames.includes('logits')) {
    await session.release();throw Error('Contrato de entrada/saída do modelo incompatível.')
  }
  let disposed=false,running=false
  const metrics:VisionMetrics={modelBytes:model.byteLength,initializationMs:performance.now()-start,analysisMs:null,jsHeapBytes:null}
  return {
    metrics,
    async analyze(photo:Blob) {
      if(disposed || running)throw Error('Analisador ocupado ou encerrado. Tente novamente.')
      running=true
      const started=performance.now(),url=URL.createObjectURL(photo)
      try {
        const image=new Image()
        await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Não foi possível abrir a foto.'));image.src=url})
        const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight
        if(!canvas.width || !canvas.height || canvas.width*canvas.height>1920*1920)throw Error('Prepare uma imagem de até 1920 pixels por lado.')
        const context=canvas.getContext('2d');if(!context)throw Error('Seu navegador não conseguiu ler a imagem.')
        context.drawImage(image,0,0)
        const tensor=new ort.Tensor('uint8',rgbFromRgba(context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height),[1,canvas.height,canvas.width,3])
        // Explicit fetch list: discard the regression head entirely; nutrients are not a vision output.
        try {
          const output=await session.run({image:tensor},['logits'])
          try {
            if(disposed)throw Error('Análise descartada.')
            const result=candidatesFromLogits(output.logits.data as Float32Array,labels)
            metrics.analysisMs=performance.now()-started
            metrics.jsHeapBytes=(performance as Performance & {memory?:{usedJSHeapSize:number}}).memory?.usedJSHeapSize??null
            return result
          } finally {Object.values(output).forEach(t=>t.dispose())}
        } finally {tensor.dispose()}
      } finally {URL.revokeObjectURL(url);running=false;if(disposed)await session.release()}
    },
    async dispose() {if(disposed)return;disposed=true;if(!running)await session.release()},
  }
}
