import sharp from '/Users/giovaniramosferreira/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs'
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const json = async p => JSON.parse(await readFile(join(root, p), 'utf8'))
const hash = b => createHash('sha256').update(b).digest('hex')
const rife = process.env.WINFIT_RIFE_BIN
const model = process.env.WINFIT_RIFE_MODEL
if (!rife || !model) throw new Error('Set WINFIT_RIFE_BIN and WINFIT_RIFE_MODEL to the official RIFE executable/model')
const catalog = await json('src/data/catalogIllustrations.json')
const anchors = (await json('docs/media/catalog/motion-anchors.json')).assets
const pilots = {
  'agachamento-corporal': { sprite:'/media/pilots/agachamento-v2.webp', cycle:'return', aspectRatio:'1' },
  flexao: { sprite:'/media/pilots/flexao-v2.webp', cycle:'return', aspectRatio:'30 / 17' },
  'leg-press': { sprite:'/media/pilots/leg-press-v2.webp', cycle:'loop', aspectRatio:'4 / 3' },
}
const base = {...catalog,...pilots}
const manifest = {}, records = {}
const targetIds = process.argv.slice(2)
const cachePath = join(root, 'docs/media/catalog/motion-packing.json')
let previous = {};try { previous = JSON.parse(await readFile(cachePath,'utf8')).assets } catch {}
const work = '/private/tmp/winfit-motion-render'
await mkdir(join(root, 'public/media/motion'),{recursive:true})

// Registration is measured on a fixed support, never on the moving athlete/weight.
async function register(frames, anchor) {
  const greys = await Promise.all(frames.map(frame => sharp(frame).resize(256,256).greyscale().blur(.8).raw().toBuffer()))
  const ref = greys[anchor.referenceFrame ?? 0]
  const [rx,ry,rw,rh] = anchor.region.map(v=>Math.round(v*256))
  const points=[]
  for(let y=ry;y<Math.min(256,ry+rh);y+=2)for(let x=rx;x<Math.min(256,rx+rw);x+=2)points.push([x,y,ref[y*256+x],ref[y*256+x]<190?1:.18])
  const score=(data,dx,dy,s)=>{
    let error=0,weight=0
    for(const [x,y,v,w] of points){const xx=Math.round((x-128)/s+128+dx),yy=Math.round((y-128)/s+128+dy);error+=Math.abs(v-(xx<0||xx>=256||yy<0||yy>=256?255:data[yy*256+xx]))*w;weight+=w}
    return error/weight + .2*(Math.abs(dx)+Math.abs(dy)) + 20*Math.abs(s-1)
  }
  const registrations=[]
  const output=[]
  for(let f=0;f<frames.length;f++){
    let best={dx:0,dy:0,scale:1,error:score(greys[f],0,0,1)}
    if(anchor.translations?.[f]) {
      best={dx:-anchor.translations[f][0]/2,dy:-anchor.translations[f][1]/2,scale:1,error:0}
    } else if(f!==(anchor.referenceFrame??0)){
      for(let dy=-40;dy<=40;dy+=2)for(let dx=-40;dx<=40;dx+=2){const error=score(greys[f],dx,dy,1);if(error<best.error)best={dx,dy,scale:1,error}}
      const center={...best}
      for(let s=.94;s<=1.061;s+=.02)for(let dy=center.dy-2;dy<=center.dy+2;dy++)for(let dx=center.dx-2;dx<=center.dx+2;dx++){const error=score(greys[f],dx,dy,s);if(error<best.error)best={dx,dy,scale:s,error}}
    }
    const s=best.scale,tx=256*(1-s)-best.dx*2*s,ty=256*(1-s)-best.dy*2*s
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="560" height="560"><rect width="560" height="560" fill="white"/><image width="512" height="512" transform="matrix(${s} 0 0 ${s} ${tx+24} ${ty+24})" xlink:href="data:image/png;base64,${frames[f].toString('base64')}"/></svg>`
    output.push(await sharp(Buffer.from(svg)).png().toBuffer())
    registrations.push(best)
  }
  return {frames:output, registrations}
}

for(const [id,art] of Object.entries(base)){
  if(art.hold) continue
  const outputPath=join(root,'public/media/motion',`${id}.webp`)
  const cycle=anchors[id]?.cycle??art.cycle
  const sourcePath=join(root,`public${art.sprite}`)
  let metadata=null
  if(!pilots[id])metadata=await json(`docs/media/catalog/generated/${id}.json`)
  // Original packed frames remain the source for free-body movements. Equipment
  // uses the original shared cell coordinates instead of per-pose ink centering.
  const overridePath=join(root,`docs/media/catalog/motion-sources/${id}.png`)
  const hasOverride=await access(overridePath).then(()=>true,()=>false)
  const original=(anchors[id]||hasOverride)&&metadata?await readFile(hasOverride?overridePath:metadata.sourcePath):await readFile(sourcePath)
  const signature=hash(Buffer.concat([original,Buffer.from(JSON.stringify({anchor:anchors[id],selection:metadata?.selectedFrames,cycle,version:4}))]))
  if((targetIds.length&&!targetIds.includes(id))||(previous?.[id]?.signature===signature&&await access(outputPath).then(()=>true,()=>false))){
    if(previous[id]){records[id]=previous[id];manifest[id]=previous[id].illustration;continue}
    if(targetIds.length&&!targetIds.includes(id))continue
  }
  const dim=await sharp(original).metadata(), w=dim.width/3,h=dim.height/2
  const selection=anchors[id]?.sourceFrames??((anchors[id]&&!hasOverride)&&metadata?(metadata.selectedFrames??[0,1,2,3,4,5]):[0,1,2,3,4,5])
  const poseKeys=anchors[id]?.sourceFrames??(hasOverride?[0,1,2,3,4,5]:(metadata?.selectedFrames??[0,1,2,3,4,5]))
  let frames=[]
  for(const n of selection){
    let tile=sharp(original).extract({left:n%3*w,top:Math.floor(n/3)*h,width:w,height:h}).flatten({background:'#fff'})
    if(anchors[id]||hasOverride){
      tile=tile.resize(512,512,{fit:'fill'})
      // These original sheets contain ink from the adjacent cell at y511.
      const trim=anchors[id]?.trimBottom??(['puxada-polia','crossover-polia'].includes(id)?22:0)
      if(trim)tile=tile.extract({left:0,top:0,width:512,height:512-trim}).extend({bottom:trim,background:'#fff'})
    }
    frames.push(await tile.png().toBuffer())
  }
  let registrations=[]
  if(anchors[id])({frames,registrations}=await register(frames,{...anchors[id],translations:anchors[id].translations?selection.map(n=>anchors[id].translations[n]):undefined,referenceFrame:Math.max(0,selection.indexOf(anchors[id].referenceFrame??0))}))
  const resized=await Promise.all(frames.map(f=>(anchors[id]?sharp(f):sharp(f).extend({top:Math.round(h*.047),bottom:Math.round(h*.047),left:Math.round(w*.047),right:Math.round(w*.047),background:'#fff'})).resize(320,Math.round(320*h/w),{fit:anchors[id]?.space==='published-cell'?'fill':'contain',background:'#fff'}).png().toBuffer()))
  frames=resized
  const info=await sharp(frames[0]).metadata()
  // Adjacent repeated selections in legacy sheets must not create long pauses.
  const unique=[]
  for(let i=0;i<frames.length;i++)if(!i||poseKeys[i]!==poseKeys[i-1])unique.push(frames[i])
  if(unique.length>1&&poseKeys.at(-1)===poseKeys[0])unique.pop()
  const order=cycle==='return'?[...unique,...unique.slice(1,-1).reverse(),unique[0]]:[...unique,unique[0]]
  const dir=join(work,id),input=join(dir,'in'),output=join(dir,'out',signature.slice(0,12))
  await mkdir(input,{recursive:true});await mkdir(output,{recursive:true})
  // Input directories are per content signature to avoid stale frame tails.
  const fresh=join(input,signature.slice(0,12));await mkdir(fresh,{recursive:true})
  for(let i=0;i<order.length;i++)await writeFile(join(fresh,`${String(i).padStart(4,'0')}.png`),order[i])
  const result=spawnSync(rife,['-i',fresh,'-o',output,'-n','65','-m',model,'-g','0','-f','%04d.png'],{encoding:'utf8',timeout:120000})
  if(result.status!==0)throw new Error(`${id}: RIFE failed ${result.stderr}`)
  const files=(await readdir(output)).filter(n=>n.endsWith('.png')).sort().slice(0,64)
  if(files.length!==64)throw new Error(`${id}: expected64frames, got${files.length}`)
  const tiles=await Promise.all(files.map(async(n,i)=>({input:await readFile(join(output,n)),left:i%8*info.width,top:Math.floor(i/8)*info.height})))
  await sharp({create:{width:info.width*8,height:info.height*8,channels:3,background:'#fff'}}).composite(tiles).webp({quality:84,effort:5}).toFile(outputPath)
  const illustration={sprite:`/media/motion/${id}.webp`,aspectRatio:`${info.width} / ${info.height}`,cycle,motion:{columns:8,rows:8,frameCount:64,duration:cycle==='return'?5:4}}
  manifest[id]=illustration
  records[id]={signature,sourcePath:hasOverride?overridePath:(anchors[id]&&metadata?metadata.sourcePath:sourcePath),registrations,originalFrames:unique.length,illustration,outputHash:hash(await readFile(outputPath))}
  await writeFile(cachePath,JSON.stringify({version:4,engine:'RIFE4.6',assets:{...previous,...records}},null,2)+'\n')
  console.log(`${id}: ${unique.length} poses ->64 frames${anchors[id]?' registered':''}`)
}
await writeFile(join(root,'src/data/motionIllustrations.json'),JSON.stringify(manifest,null,2)+'\n')
await writeFile(cachePath,JSON.stringify({version:4,engine:'RIFE4.6',assets:records},null,2)+'\n')
