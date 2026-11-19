export interface SupabaseAuthConfig {
  /** Backend configuration only: project origin, never a value from the request. */
  url: string
  publicKey: string
  timeoutMs?: number
}

export interface AuthenticatedUser { id: string }

const unavailable = (): Error => new Error('Autenticação indisponível')
const maxResponseBytes = 65536
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Consults the Auth authority on every call; never trusts decoded JWT claims or a client ID. */
export function createSupabaseAuthenticator(
  config: SupabaseAuthConfig,
  fetcher: typeof fetch = fetch,
): (bearer: string) => Promise<AuthenticatedUser | null> {
  let origin: URL
  const timeoutMs = config.timeoutMs ?? 5000
  try {
    origin = new URL(config.url)
    if (origin.protocol !== 'https:' || origin.username || origin.password ||
        origin.pathname !== '/' || origin.search || origin.hash ||
        !config.publicKey || !/^[\x21-\x7e]+$/.test(config.publicKey) ||
        !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw Error()
  } catch {
    throw new Error('Configuração de autenticação inválida')
  }
  const endpoint = `${origin.origin}/auth/v1/user`
  const publicKey = config.publicKey

  return async (bearer: string): Promise<AuthenticatedUser | null> => {
    if (typeof bearer !== 'string' || bearer.length > 8192 || !/^[\x21-\x7e]+$/.test(bearer)) return null

    const controller = new AbortController()
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    // The explicit race bounds headers AND streamed body, including injected transports.
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        if (reader) void reader.cancel().catch(() => {})
        reject(unavailable())
      }, timeoutMs)
    })
    const verify = async (): Promise<AuthenticatedUser | null> => {
      const response = await fetcher(endpoint, {
        method: 'GET',
        headers: { apikey: publicKey, Authorization: `Bearer ${bearer}`, Accept: 'application/json' },
        redirect: 'error', cache: 'no-store', signal: controller.signal,
      })
      if (controller.signal.aborted) {
        if (response.body) void response.body.cancel().catch(() => {})
        throw unavailable()
      }
      if (response.status === 401 || response.status === 403) {
        if (response.body) void response.body.cancel().catch(() => {})
        return null
      }
      if (response.status !== 200 || response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json' || !response.body) {
        if (response.body) void response.body.cancel().catch(() => {})
        throw unavailable()
      }
      reader = response.body.getReader()
      let size = 0, text = ''
      const decoder = new TextDecoder('utf-8', { fatal: true })
      while (true) {
        const part = await reader.read()
        if (controller.signal.aborted) throw unavailable()
        if (part.done) break
        size += part.value.byteLength
        if (size > maxResponseBytes) throw unavailable()
        text += decoder.decode(part.value, { stream: true })
      }
      text += decoder.decode()
      const user: unknown = JSON.parse(text)
      if (!user || typeof user !== 'object' || Array.isArray(user) ||
          !('id' in user) || typeof user.id !== 'string' || !uuid.test(user.id) || 'error' in user) throw unavailable()
      return { id: user.id }
    }
    try {
      return await Promise.race([verify(), deadline])
    } catch {
      controller.abort()
      throw unavailable()
    } finally {
      clearTimeout(timer)
      if (reader) {
        // Do not await cancellation: a broken upstream must not extend the deadline.
        void reader.cancel().catch(() => {})
      }
    }
  }
}
