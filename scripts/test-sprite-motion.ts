import assert from 'node:assert/strict'
import { spriteMotion } from '../src/lib/spriteMotion'
const motion = spriteMotion({ columns: 8, rows: 5, frameCount: 40, duration: 5 })
assert.equal(motion.backgroundSize, '800% 500%')
assert.equal(motion.duration, '5s')
assert.match(motion.keyframes, /0%\{background-position:0% 0%\}/)
assert.match(motion.keyframes, /97.5%\{background-position:100% 100%\}/)
assert.match(motion.keyframes, /100%\{background-position:0% 0%\}/)
assert.equal((motion.keyframes.match(/background-position/g) ?? []).length, 41)
assert.throws(() => spriteMotion({ columns: 2, rows: 2, frameCount: 5, duration: 5 }))
console.log('Sprite motion: grid coordinates, complete cycle, duration and invalid metadata OK')

// Published metadata and checksums protect against stale atlases and silent omissions.
const { readFileSync } = await import('node:fs')
const { createHash } = await import('node:crypto')
const { EXERCISE_ILLUSTRATIONS } = await import('../src/data/exerciseIllustrations')
const packed = JSON.parse(readFileSync('docs/media/catalog/motion-packing.json', 'utf8')).assets
const animated = Object.entries(EXERCISE_ILLUSTRATIONS).filter(([,art]) => !art.hold)
assert.equal(animated.length, 74)
assert.equal(Object.keys(packed).length, 74)
for (const [id,art] of animated) {
  assert.ok(art.motion, `${id}: missing motion`)
  assert.equal(art.motion.frameCount, 64)
  assert.equal(art.motion.columns * art.motion.rows, 64)
  assert.match(art.sprite, /^\/media\/motion\/[a-z0-9-]+\.webp$/)
  const bytes = readFileSync(`public${art.sprite}`)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), packed[id].outputHash, `${id}: stale asset`)
}
for (const [,art] of Object.entries(EXERCISE_ILLUSTRATIONS).filter(([,art])=>art.hold)) assert.equal(art.motion, undefined)
console.log('All74 animated sprites have64frames; four holds stay static; hashes verified')
const sharp = (await import('/Users/giovaniramosferreira/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs')).default
for (const [id,art] of animated) {
  const info = await sharp(`public${art.sprite}`).metadata()
  assert.equal(info.width! % art.motion!.columns, 0, `${id}: partial column`)
  assert.equal(info.height! % art.motion!.rows, 0, `${id}: partial row`)
  const [width,height] = art.aspectRatio.split('/').map(Number)
  assert.equal(info.width! / art.motion!.columns, width, id)
  assert.equal(info.height! / art.motion!.rows, height, id)
}
console.log('All atlas dimensions match complete64-frame grids and displayed aspect ratios')
const { createElement } = await import('react')
const { renderToStaticMarkup } = await import('react-dom/server')
const { default: IllustratedExerciseDemo } = await import('../src/components/IllustratedExerciseDemo')
const html = renderToStaticMarkup(createElement(IllustratedExerciseDemo, {
  name: 'Agachamento', pilot: EXERCISE_ILLUSTRATIONS['agachamento-corporal'],
}))
assert.match(html, /animation-name:sprite-8-8-64/)
assert.match(html, /background-size:800% 800%/)
assert.match(html, /animation-duration:5s/)
assert.match(html, /animation-play-state:paused/)
assert.match(html, /aria-pressed="false"/)
console.log('Renderer consumes full motion grid and starts paused with an explicit play control')
