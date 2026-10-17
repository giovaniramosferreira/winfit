import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import sharp from '/Users/giovaniramosferreira/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs'
import { packCatalog } from './prepare-catalog-art.mjs'

async function fixture(fn) {
  const root = await mkdtemp(join(tmpdir(), 'winfit-catalog-art-'))
  try {
    await mkdir(join(root, 'docs/media/catalog/generated'), { recursive: true })
    await mkdir(join(root, 'src/data'), { recursive: true })
    await writeFile(join(root, 'docs/media/catalog/jobs.json'), JSON.stringify([{ id: 'movimento', hold: false }, { id: 'prancha', hold: true }]))
    const pixels = Buffer.alloc(180 * 120 * 3, 255)
    for (let frame = 0; frame < 6; frame++) {
      const left = (frame % 3) * 60 + 15 + frame
      const top = Math.floor(frame / 3) * 60 + 10
      for (let y = top; y < top + 25 + frame; y++) for (let x = left; x < left + 20; x++) {
        const p = (y * 180 + x) * 3
        pixels[p] = pixels[p + 1] = pixels[p + 2] = 20
      }
    }
    const sourcePath = join(root, 'atlas.png')
    await sharp(pixels, { raw: { width: 180, height: 120, channels: 3 } }).png().toFile(sourcePath)
    await writeFile(join(root, 'docs/media/catalog/generated/movimento.json'), JSON.stringify({ id: 'movimento', hold: false, status: 'generated', sourcePath, selectedFrames: [0, 1, 2, 2, 1, 0] }))
    await fn(root, sourcePath)
  } finally { await rm(root, { recursive: true, force: true }) }
}

test('packer recorta seis quadros, preserva seleção e escala única e mantém cache incremental', async () => {
  await fixture(async root => {
    const result = await packCatalog({ root, partial: true, quiet: true })
    assert.deepEqual(result.missing, ['prancha'])
    assert.equal(result.packed, 1)
    const manifest = JSON.parse(await readFile(join(root, 'src/data/catalogIllustrations.json'), 'utf8'))
    assert.deepEqual(Object.keys(manifest), ['movimento'])
    assert.equal(manifest.movimento.cycle, 'return')
    const packing = JSON.parse(await readFile(join(root, 'docs/media/catalog/packing.json'), 'utf8'))
    const record = packing.assets.movimento
    assert.deepEqual(record.selectedFrames, [0, 1, 2, 2, 1, 0])
    assert.ok(record.scale > 0)
    assert.equal(new Set(record.frames.map(f => f.ground)).size, 1)
    const sprite = join(root, 'public/media/catalog/movimento.webp')
    const image = await sharp(sprite).metadata()
    assert.equal(image.width, record.frameWidth * 3)
    assert.equal(image.height, record.frameHeight * 2)
    const before = (await stat(sprite)).mtimeMs
    const cached = await packCatalog({ root, partial: true, quiet: true })
    assert.equal(cached.cached, 1)
    assert.equal((await stat(sprite)).mtimeMs, before)
    const metadataPath = join(root, 'docs/media/catalog/generated/movimento.json')
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
    metadata.cycle = 'loop'
    await writeFile(metadataPath, JSON.stringify(metadata))
    const changed = await packCatalog({ root, partial: true, quiet: true })
    assert.equal(changed.packed, 1)
    const changedManifest = JSON.parse(await readFile(join(root, 'src/data/catalogIllustrations.json'), 'utf8'))
    assert.equal(changedManifest.movimento.cycle, 'loop')
    await assert.rejects(packCatalog({ root, quiet: true }), /prancha/)
  })
})

test('packer usa uma imagem estática para sustentação e rejeita atlas com divisão inexata', async () => {
  await fixture(async (root, sourcePath) => {
    const plankPath = join(root, 'plank.png')
    await sharp(sourcePath).extract({ left: 0, top: 0, width: 60, height: 60 }).png().toFile(plankPath)
    const metadata = { id: 'prancha', hold: true, status: 'generated', sourcePath: plankPath }
    await writeFile(join(root, 'docs/media/catalog/generated/prancha.json'), JSON.stringify(metadata))
    await packCatalog({ root, quiet: true })
    const manifest = JSON.parse(await readFile(join(root, 'src/data/catalogIllustrations.json'), 'utf8'))
    assert.equal(manifest.prancha.hold, true)
    const image = await sharp(join(root, 'public/media/catalog/prancha.webp')).metadata()
    assert.equal(image.width, image.height)
    const invalid = join(root, 'invalid.png')
    await sharp(sourcePath).resize(181, 120).png().toFile(invalid)
    await writeFile(join(root, 'docs/media/catalog/generated/movimento.json'), JSON.stringify({ id: 'movimento', hold: false, status: 'generated', sourcePath: invalid }))
    await assert.rejects(packCatalog({ root, quiet: true }), /divis/)
  })
})

test('quadros horizontais usam altura menor com proporção comum aos seis quadros', async () => {
  await fixture(async (root, sourcePath) => {
    const pixels = Buffer.alloc(180 * 120 * 3, 255)
    for (let frame = 0; frame < 6; frame++) {
      for (let y = 20; y < 30; y++) for (let x = 10; x < 50; x++) {
        const p = ((Math.floor(frame / 3) * 60 + y) * 180 + frame % 3 * 60 + x) * 3
        pixels[p] = pixels[p + 1] = pixels[p + 2] = 20
      }
    }
    await sharp(pixels, { raw: { width: 180, height: 120, channels: 3 } }).png().toFile(sourcePath)
    await packCatalog({ root, partial: true, quiet: true })
    const packing = JSON.parse(await readFile(join(root, 'docs/media/catalog/packing.json'), 'utf8'))
    assert.equal(packing.assets.movimento.frameWidth, 480)
    assert.equal(packing.assets.movimento.frameHeight, 280)
    assert.equal(packing.assets.movimento.illustration.aspectRatio, '480 / 280')
    const image = await sharp(join(root, 'public/media/catalog/movimento.webp')).metadata()
    assert.equal(image.height, 560)
  })
})

test('alignment source preserva apoio fixo quando a abertura dos braços muda os bounds', async () => {
  await fixture(async (root, sourcePath) => {
    const pixels = Buffer.alloc(180 * 120 * 3, 255)
    for (let frame = 0; frame < 6; frame++) {
      const rectangles = [{ x: 35, y: 45, width: 12, height: 10 }, { x: 5 + frame * 4, y: 8, width: 20, height: 8 }]
      for (const rect of rectangles) for (let y = rect.y; y < rect.y + rect.height; y++) for (let x = rect.x; x < rect.x + rect.width; x++) {
        const p = ((Math.floor(frame / 3) * 60 + y) * 180 + frame % 3 * 60 + x) * 3
        pixels[p] = pixels[p + 1] = pixels[p + 2] = 20
      }
    }
    await sharp(pixels, { raw: { width: 180, height: 120, channels: 3 } }).png().toFile(sourcePath)
    const metadataPath = join(root, 'docs/media/catalog/generated/movimento.json')
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
    metadata.alignment = 'source'
    metadata.selectedFrames = [0, 1, 2, 3, 4, 5]
    await writeFile(metadataPath, JSON.stringify(metadata))
    await packCatalog({ root, partial: true, quiet: true })
    const packing = JSON.parse(await readFile(join(root, 'docs/media/catalog/packing.json'), 'utf8'))
    const asset = packing.assets.movimento
    const { data, info } = await sharp(join(root, 'public/media/catalog/movimento.webp')).raw().toBuffer({ resolveWithObject: true })
    const supportBounds = []
    for (let frame = 0; frame < 6; frame++) {
      let minX = asset.frameWidth, maxX = -1
      for (let y = Math.floor(asset.frameHeight * .7); y < asset.frameHeight; y++) for (let x = 0; x < asset.frameWidth; x++) {
        const p = ((Math.floor(frame / 3) * asset.frameHeight + y) * info.width + frame % 3 * asset.frameWidth + x) * info.channels
        if (data[p] < 90) { minX = Math.min(minX, x); maxX = Math.max(maxX, x) }
      }
      assert.ok(maxX > minX)
      supportBounds.push([minX, maxX])
    }
    for (const bounds of supportBounds) assert.deepEqual(bounds, supportBounds[0])
  })
})
