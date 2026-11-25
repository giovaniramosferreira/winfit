// Requisições com retry, backoff e cancelamento real (AURAVIZ-159). Sem logar corpo, foto ou token.
export const DEFAULT_DELAYS_MS = [1000, 2000, 4000] as const
/** Fluxo interativo (usuário olhando o overlay): um único retry rápido e depois mostra o erro. */
export const INTERACTIVE_DELAYS_MS = [1500] as const
export const RETRYABLE_STATUS = new Set([429, 503, 529])

export class RetryError extends Error {
  constructor(message: string, readonly status: number | null, readonly kind: 'http' | 'network' | 'aborted') { super(message) }
}

export interface RetryOptions {
  delaysMs?: readonly number[]
  signal?: AbortSignal
  fetcher?: typeof fetch
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>
}

const abortError = () => new RetryError('Requisição cancelada.', null, 'aborted')

/** Espera `ms`, mas acorda na hora (e rejeita) se o sinal for abortado. */
export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError())
    const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve() }, ms)
    const onAbort = () => { clearTimeout(timer); reject(abortError()) }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Repete 429/503/529 com os atraso dados. Outros erros HTTP não são repetidos. Erro de rede é repetido.
 * Mensagens de erro são genéricas: nunca incluem URL, corpo da resposta, foto ou cabeçalhos.
 */
export async function fetchWithRetry(url: string, init: RequestInit = {}, options: RetryOptions = {}): Promise<Response> {
  const delays = options.delaysMs ?? DEFAULT_DELAYS_MS
  const fetcher = options.fetcher ?? fetch
  const sleep = options.sleep ?? abortableSleep
  const signal = options.signal ?? init.signal ?? undefined
  let last: RetryError = new RetryError('Falha na requisição.', null, 'network')
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    if (signal?.aborted) throw abortError()
    try {
      const response = await fetcher(url, { ...init, signal })
      if (response.ok) return response
      last = new RetryError(`O serviço respondeu com erro ${response.status}.`, response.status, 'http')
      if (!RETRYABLE_STATUS.has(response.status)) throw last
    } catch (error) {
      if (error instanceof RetryError) { if (error.kind === 'http' && !RETRYABLE_STATUS.has(error.status ?? 0)) throw error }
      else if (signal?.aborted || (error as Error)?.name === 'AbortError') throw abortError()
      else last = new RetryError('Falha de rede.', null, 'network')
    }
    if (attempt < delays.length) await sleep(delays[attempt], signal)
  }
  throw last
}
