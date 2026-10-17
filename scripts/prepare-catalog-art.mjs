import sharp from '/Users/giovaniramosferreira/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs'
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { resolve, join, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'

// One scale per exercise, with a common floor and centered ink. The original PNG is read only.
const VERSION = 3
const RESERVED = new Set(['agachamento-corporal', 'flexao', 'leg-press'])
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const exists = async path => access(path).then(() => true, error => { if (error.code === 'ENOENT') return false; throw error })
const json = async path => JSON.parse(await readFile(path, 'utf8'))
const save = async (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`)

function inkBounds(data, info, id) {
  const rows = Array(info.height).fill(0), columns = Array(info.width).fill(0)
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const pixel = (y * info.width + x) * info.channels
    if (Math.min(data[pixel], data[pixel + 1], data[pixel + 2]) < 110) {
      rows[y]++; columns[x]++
    }
  }
  const minX = columns.findIndex(n => n >= 3), maxX = columns.findLastIndex(n => n >= 3)
  const minY = rows.findIndex(n => n >= 3), maxY = rows.findLastIndex(n => n >= 3)
  if (minX < 0 || minY < 0 || maxX <= minX || maxY <= minY) throw new Error(`${id}: quadro sem tinta suficiente`)
  return { minX, maxX, minY, maxY }
}

async function packAsset(source, metadata, outputPath) {
  const image = await sharp(source).metadata()
  if (image.format !== 'png' || !image.width || !image.height) throw new Error(`${metadata.id}: fonte deve ser PNG válido`)
  const columns = metadata.hold ? 1 : 3, rows = metadata.hold ? 1 : 2
  if (image.width % columns || image.height % rows) throw new Error(`${metadata.id}: dimensões não permitem divisão inteira em ${columns} × ${rows}`)
  const cellWidth = image.width / columns, cellHeight = image.height / rows
  if (!metadata.hold && cellWidth !== cellHeight) throw new Error(`${metadata.id}: atlas deve ter seis células quadradas iguais`)
  const selection = metadata.hold ? [0] : metadata.selectedFrames ?? [0, 1, 2, 3, 4, 5]
  if (!Array.isArray(selection) || selection.length !== (metadata.hold ? 1 : 6) || selection.some(n => !Number.isInteger(n) || n < 0 || n >= columns * rows)) throw new Error(`${metadata.id}: selectedFrames inválido`)
  const frames = []
  for (const index of selection) {
    const left = index % columns * cellWidth, top = Math.floor(index / columns) * cellHeight
    const { data, info } = await sharp(source).extract({ left, top, width: cellWidth, height: cellHeight }).flatten({ background: '#fff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const bounds = inkBounds(data, info, metadata.id)
    const cropLeft = Math.max(0, bounds.minX - 4), cropTop = Math.max(0, bounds.minY - 4)
    const cropRight = Math.min(cellWidth - 1, bounds.maxX + 4), cropBottom = Math.min(cellHeight - 1, bounds.maxY + 4)
    frames.push({ index, ...bounds, crop: { left: left + cropLeft, top: top + cropTop, width: cropRight - cropLeft + 1, height: cropBottom - cropTop + 1 }, cropLeft, cropTop })
  }
  const alignment = metadata.alignment ?? 'ink'
  const globalBounds = {
    minX: Math.min(...frames.map(frame => frame.minX)), maxX: Math.max(...frames.map(frame => frame.maxX)),
    minY: Math.min(...frames.map(frame => frame.minY)), maxY: Math.max(...frames.map(frame => frame.maxY)),
  }
  if (alignment === 'source') {
    // One crop in cell coordinates preserves fixed feet, benches and machines as the arms move.
    const cropLeft = Math.max(0, globalBounds.minX - 4), cropTop = Math.max(0, globalBounds.minY - 4)
    const cropRight = Math.min(cellWidth - 1, globalBounds.maxX + 4), cropBottom = Math.min(cellHeight - 1, globalBounds.maxY + 4)
    for (const frame of frames) {
      frame.cropLeft = cropLeft
      frame.cropTop = cropTop
      frame.crop = { left: frame.index % columns * cellWidth + cropLeft, top: Math.floor(frame.index / columns) * cellHeight + cropTop, width: cropRight - cropLeft + 1, height: cropBottom - cropTop + 1 }
    }
  }
  // Horizontal exercises need less headroom; every frame still shares one canvas and one scale.
  const frameWidth = 480, padding = 22
  const inkWidth = alignment === 'source' ? globalBounds.maxX - globalBounds.minX + 1 : Math.max(...frames.map(frame => frame.maxX - frame.minX + 1))
  const inkHeight = alignment === 'source' ? globalBounds.maxY - globalBounds.minY + 1 : Math.max(...frames.map(frame => frame.maxY - frame.minY + 1))
  const frameHeight = Math.max(280, Math.min(480, Math.round((frameWidth - 2 * padding) * inkHeight / inkWidth + 2 * padding)))
  const maxWidth = Math.max(...frames.map(frame => frame.crop.width))
  const maxHeight = Math.max(...frames.map(frame => frame.crop.height))
  const scale = Math.min((frameWidth - 2 * padding) / maxWidth, (frameHeight - 2 * padding) / maxHeight)
  const ground = frameHeight - padding - Math.ceil(4 * scale)
  const tiles = []
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    const width = Math.max(1, Math.round(frame.crop.width * scale))
    const height = Math.max(1, Math.round(frame.crop.height * scale))
    const input = await sharp(source).extract(frame.crop).flatten({ background: '#fff' }).resize(width, height, { fit: 'fill' }).png().toBuffer()
    const center = (frame.minX + frame.maxX) / 2 - frame.cropLeft
    const left = alignment === 'source' ? Math.round((frameWidth - width) / 2) : Math.max(0, Math.round(frameWidth / 2 - center * scale))
    const bottomY = alignment === 'source' ? globalBounds.maxY : frame.maxY
    const top = Math.max(0, Math.round(ground - (bottomY - frame.cropTop) * scale))
    if (left + width > frameWidth || top + height > frameHeight) throw new Error(`${metadata.id}: quadro excede o atlas após alinhamento`)
    const tile = await sharp({ create: { width: frameWidth, height: frameHeight, channels: 3, background: '#fff' } }).composite([{ input, left, top }]).png().toBuffer()
    tiles.push({ input: tile, left: i % columns * frameWidth, top: Math.floor(i / columns) * frameHeight })
    frame.ground = ground
    frame.translation = { left, top }
  }
  await sharp({ create: { width: frameWidth * columns, height: frameHeight * rows, channels: 3, background: '#fff' } }).composite(tiles).webp({ quality: 84, effort: 6 }).toFile(outputPath)
  return { alignment, frameWidth, frameHeight, scale, selectedFrames: selection, frames, illustration: { sprite: `/media/catalog/${metadata.id}.webp`, aspectRatio: `${frameWidth} / ${frameHeight}`, cycle: metadata.cycle ?? 'return', hold: metadata.hold } }
}

export async function packCatalog({ root = resolve(fileURLToPath(new URL('..', import.meta.url))), partial = false, quiet = false } = {}) {
  const directory = join(root, 'docs/media/catalog')
  const jobs = await json(join(directory, 'jobs.json'))
  const ids = jobs.map(job => job.id)
  if (new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id) || RESERVED.has(id))) throw new Error('jobs.json contém ids inválidos, duplicados ou reservados aos pilotos')
  const cachePath = join(directory, 'packing.json')
  const previous = await exists(cachePath) ? await json(cachePath) : { assets: {} }
  const assets = {}, manifest = {}, missing = []
  let packed = 0, cached = 0
  await mkdir(join(root, 'public/media/catalog'), { recursive: true })
  for (const job of jobs) {
    const metadataPath = join(directory, 'generated', `${job.id}.json`)
    if (!await exists(metadataPath)) { missing.push(job.id); continue }
    const metadata = await json(metadataPath)
    if (metadata.id !== job.id || metadata.hold !== job.hold || metadata.status !== 'generated') throw new Error(`${job.id}: metadados não correspondem ao briefing ou à arte gerada`)
    if (metadata.cycle !== undefined && !['return', 'loop'].includes(metadata.cycle)) throw new Error(`${job.id}: cycle inválido`)
    if (metadata.alignment !== undefined && !['ink', 'source'].includes(metadata.alignment)) throw new Error(`${job.id}: alignment inválido`)
    if (typeof metadata.sourcePath !== 'string' || !isAbsolute(metadata.sourcePath)) throw new Error(`${job.id}: sourcePath deve ser absoluto`)
    if (!await exists(metadata.sourcePath)) { missing.push(job.id); continue }
    const source = await readFile(metadata.sourcePath)
    const fileHash = hash(source), metadataHash = hash(JSON.stringify(metadata))
    const outputPath = join(root, 'public/media/catalog', `${job.id}.webp`)
    const old = previous.assets[job.id]
    if (previous.version === VERSION && old?.fileHash === fileHash && old?.metadataHash === metadataHash && await exists(outputPath)) {
      assets[job.id] = old
      manifest[job.id] = old.illustration
      cached++
      continue
    }
    const packedAsset = await packAsset(source, metadata, outputPath)
    assets[job.id] = { fileHash, metadataHash, ...packedAsset }
    manifest[job.id] = packedAsset.illustration
    packed++
    if (!quiet) console.log(`Empacotado ${job.id}`)
  }
  await save(cachePath, { version: VERSION, assets })
  await save(join(root, 'src/data/catalogIllustrations.json'), manifest)
  if (!quiet) console.log(`${packed} novos atlas; ${cached} em cache; ${Object.keys(manifest).length}/${jobs.length} artes disponíveis.`)
  if (missing.length) {
    const message = `Faltam ${missing.length} artes: ${missing.join(', ')}`
    if (!quiet) console.warn(message)
    if (!partial) throw new Error(`${message}. Use --partial durante a geração.`)
  }
  return { packed, cached, missing }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.some(arg => arg !== '--partial')) throw new Error('Uso: node scripts/prepare-catalog-art.mjs [--partial]')
  await packCatalog({ partial: args.includes('--partial') })
}
