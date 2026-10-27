import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Entry = { url: string; revision?: string | null; integrity?: string }

/** Never install a SPA fallback or stale image under an approved illustration key. */
export async function protectIllustrationPrecache<T extends Entry>(entries: T[], publicDirectory = resolve('public')) {
  const manifest = await Promise.all(entries.map(async (entry) => {
    if (!/^\/?media\/.*\.webp$/.test(entry.url)) return entry
    const bytes = await readFile(resolve(publicDirectory, entry.url.replace(/^\//, '')))
    const digest = createHash('sha256').update(bytes)
    return {
      ...entry,
      // SHA256 also replaces legacy MD5 cache keys, refetching any poisoned entries once.
      revision: digest.copy().digest('hex'),
      integrity: `sha256-${digest.digest('base64')}`,
    }
  }))
  return { manifest, warnings: [] as string[] }
}
