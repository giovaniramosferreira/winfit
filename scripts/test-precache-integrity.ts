import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { protectIllustrationPrecache } from './precache-integrity'
const root=await mkdtemp(join(tmpdir(),'winfit-precache-'))
try {
  await mkdir(join(root,'media/motion'),{recursive:true})
  const image=Buffer.from('RIFF-original-approved-WebP-bytes')
  await writeFile(join(root,'media/motion/example.webp'),image)
  const entries=[{url:'media/motion/example.webp',revision:'legacy-md5'},{url:'assets/app.js',revision:null}]
  const result=await protectIllustrationPrecache(entries,root)
  const sha=createHash('sha256').update(image)
  assert.equal(result.manifest[0].revision,sha.copy().digest('hex'))
  assert.equal(result.manifest[0].integrity,`sha256-${sha.copy().digest('base64')}`)
  assert.equal(entries[0].revision,'legacy-md5','must not mutate incoming manifest')
  assert.equal(result.manifest[1],entries[1],'app shell remains unchanged')
  assert.deepEqual(result.warnings,[])
  const correct=await fetch('data:image/webp;base64,'+image.toString('base64'),{integrity:result.manifest[0].integrity})
  assert.deepEqual(Buffer.from(await correct.arrayBuffer()),image)
  await assert.rejects(fetch('data:text/html;base64,'+Buffer.from('<html>SPA fallback</html>').toString('base64'),{integrity:result.manifest[0].integrity}))
  await assert.rejects(protectIllustrationPrecache([{url:'media/missing.webp',revision:'old'}],root))
  console.log('Precache integrity: SHA256 replaces old cache key; approved image accepted; HTML fallback rejected; missing asset fails build')
} finally { await rm(root,{recursive:true,force:true}) }
