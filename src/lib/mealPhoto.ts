export const MAX_MEAL_PHOTO_BYTES = 5 * 1024 * 1024
export const MEAL_PHOTO_TYPES = ['image/jpeg','image/png','image/webp'] as const
export function validateImageFile(file: {size:number;type:string}): void {
  if (!MEAL_PHOTO_TYPES.includes(file.type as typeof MEAL_PHOTO_TYPES[number])) throw Error('Escolha uma imagem JPG, PNG ou WebP.')
  if (!Number.isFinite(file.size) || file.size<=0 || file.size>MAX_MEAL_PHOTO_BYTES) throw Error('A foto deve ter no máximo 5 MB e não pode estar vazia.')
}
export function hasImageSignature(bytes:Uint8Array,type:string): boolean {
  if(type==='image/jpeg')return bytes.length>=4 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255
  if(type==='image/png')return bytes.length>=8 && [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n)
  if(type==='image/webp')return bytes.length>=12 && String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP'
  return false
}
/** Decode then re-encode pixels: original EXIF/GPS is never copied to the output. */
export async function prepareMealPhoto(file:File): Promise<Blob> {
  validateImageFile(file)
  if (!hasImageSignature(new Uint8Array(await file.slice(0,12).arrayBuffer()),file.type)) throw Error('O conteúdo da imagem não corresponde ao formato informado.')
  const url=URL.createObjectURL(file)
  try {
    const image=new Image()
    await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Não foi possível abrir esta imagem.'));image.src=url})
    if(!image.naturalWidth || !image.naturalHeight || image.naturalWidth*image.naturalHeight>40_000_000)throw Error('Imagem grande demais. Escolha uma foto de até 40 megapixels.')
    const scale=Math.min(1,1920/Math.max(image.naturalWidth,image.naturalHeight))
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale))
    const context=canvas.getContext('2d');if(!context)throw Error('Seu navegador não conseguiu preparar a imagem.')
    context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height)
    const output=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Não foi possível preparar a foto.')),'image/jpeg',.85))
    validateImageFile(output);return output
  } finally {URL.revokeObjectURL(url)}
}
