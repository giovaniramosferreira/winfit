// Research only. No model is distributed, downloaded by the app, or stored persistently.
export const RESEARCH_MODEL={
  tag:'plate-vision/model-v0.2.0',bytes:33995501,
  sha256:'3f982c4aa8658a032cbc2a656040953a17744a3d35df11b49e722eed07f9f431',
  labelsSha256:'69b2f2163d477822dd3786b9425c6b1348180febfd71d23ec4491badc7c66de4',
  labelsCommit:'d5690063cc8795497c603aa676f97fd253053bbf',
} as const
const sha256=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')
export async function photoReviewId(photo:Blob):Promise<string> {return `photo-${await sha256(await photo.arrayBuffer())}`}
export async function validateResearchArtifacts(model:ArrayBuffer,labelsBytes:ArrayBuffer):Promise<string[]> {
  if(model.byteLength!==RESEARCH_MODEL.bytes || await sha256(model)!==RESEARCH_MODEL.sha256)throw Error('Modelo incompatível. Use o artefato fp32 model-v0.2.0 de pesquisa indicado na documentação.')
  if(labelsBytes.byteLength>100_000 || await sha256(labelsBytes)!==RESEARCH_MODEL.labelsSha256)throw Error('Rótulos incompatíveis com a ordem de classes verificada. Consulte a documentação da POC.')
  const parsed=JSON.parse(new TextDecoder().decode(labelsBytes))
  if(parsed.count!==101 || !Array.isArray(parsed.labels) || parsed.labels.length!==101 || parsed.labels.some((l:{index:number;key:string},i:number)=>l.index!==i || typeof l.key!=='string' || !l.key))throw Error('Rótulos inválidos.')
  return parsed.labels.map((l:{key:string})=>l.key)
}
export function rgbFromRgba(rgba:Uint8ClampedArray,width:number,height:number):Uint8Array {
  if(!Number.isInteger(width) || !Number.isInteger(height) || width<=0 || height<=0 || width*height>1920*1920 || rgba.length!==width*height*4)throw Error('Dimensões de imagem inválidas.')
  const rgb=new Uint8Array(width*height*3)
  for(let pixel=0;pixel<width*height;pixel++) for(let channel=0;channel<3;channel++)rgb[pixel*3+channel]=rgba[pixel*4+channel]
  return rgb
}
