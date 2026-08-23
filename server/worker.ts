/**
 * WinFit Apple Watch Sync Relay — Cloudflare Worker
 *
 * Relay serverless ultraleve (R$ 0 / free tier) que conecta os Atalhos do Apple Watch
 * ao PWA WinFit no iPhone via Server-Sent Events (SSE).
 *
 * Rotas:
 * - GET  /events/:token           -> Conexão SSE aberta para o PWA WinFit
 * - POST /cmd/:token              -> Recebe comando do Apple Watch e transmite via SSE
 * - GET  /cmd/:token?action=...   -> Atalho rápido via GET do Apple Watch
 * - POST /status/:token           -> PWA publica o estado do treino em andamento
 * - GET  /status/:token           -> Apple Watch / Siri lê o estado atual
 */

interface ClientStream {
  id: string
  writer: WritableStreamDefaultWriter<Uint8Array>
  encoder: TextEncoder
}

interface WatchStatusCache {
  active: boolean
  sessionLabel?: string
  exerciseName?: string
  exerciseIdx?: number
  totalExercises?: number
  currentSet?: number
  totalSets?: number
  suggestedWeight?: number
  suggestedReps?: number
  unit?: string
  loadType?: string
  isResting?: boolean
  restRemainingSec?: number
  totalRestSec?: number
  doneSets?: number
  totalPlannedSets?: number
  summaryText?: string
  updatedAt: number
}

// In-memory hub por instância do Worker
const tokenClients = new Map<string, Set<ClientStream>>()
const tokenStatus = new Map<string, WatchStatusCache>()

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  })
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...CORS_HEADERS,
    },
  })
}

function broadcastEvent(token: string, eventName: string, data: unknown): number {
  const clients = tokenClients.get(token.toUpperCase())
  if (!clients || clients.size === 0) return 0

  const encoder = new TextEncoder()
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
  const bytes = encoder.encode(payload)

  let sent = 0
  for (const client of Array.from(clients)) {
    try {
      client.writer.write(bytes).catch(() => {
        clients.delete(client)
      })
      sent++
    } catch {
      clients.delete(client)
    }
  }
  return sent
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const method = request.method

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const path = url.pathname

    // Health check
    if (path === '/' || path === '/health') {
      return jsonResponse({
        ok: true,
        service: 'winfit-watch-relay',
        version: '1.0.0',
        activeTokens: tokenClients.size,
        time: Date.now(),
      })
    }

    const matchEvents = path.match(/^\/events\/([^/]+)$/)
    const matchCmd = path.match(/^\/cmd\/([^/]+)$/)
    const matchStatus = path.match(/^\/status\/([^/]+)$/)

    // 1. SSE Stream: GET /events/:token
    if (method === 'GET' && matchEvents) {
      const token = decodeURIComponent(matchEvents[1]).trim().toUpperCase()

      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      const encoder = new TextEncoder()

      const client: ClientStream = {
        id: crypto.randomUUID(),
        writer,
        encoder,
      }

      if (!tokenClients.has(token)) {
        tokenClients.set(token, new Set())
      }
      tokenClients.get(token)!.add(client)

      // Envia evento inicial de boas-vindas
      const welcome = `event: connected\ndata: ${JSON.stringify({
        token,
        clientId: client.id,
        ts: Date.now(),
      })}\n\n`
      writer.write(encoder.encode(welcome))

      // Keepalive ping a cada 25s
      const interval = setInterval(() => {
        try {
          writer.write(encoder.encode(': ping\n\n')).catch(() => {
            clearInterval(interval)
            tokenClients.get(token)?.delete(client)
          })
        } catch {
          clearInterval(interval)
          tokenClients.get(token)?.delete(client)
        }
      }, 25000)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        tokenClients.get(token)?.delete(client)
        try {
          writer.close()
        } catch {
          // ignore
        }
      })

      return new Response(readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          ...CORS_HEADERS,
        },
      })
    }

    // 2. Command Endpoint: POST ou GET /cmd/:token
    if ((method === 'POST' || method === 'GET') && matchCmd) {
      const token = decodeURIComponent(matchCmd[1]).trim().toUpperCase()
      let action = 'quick_log'
      let weight: number | undefined
      let reps: number | undefined

      if (method === 'POST') {
        try {
          const body = (await request.json()) as Record<string, unknown>
          action = String(body.action || 'quick_log')
          if (body.weight !== undefined && body.weight !== null) weight = Number(body.weight)
          if (body.reps !== undefined && body.reps !== null) reps = Number(body.reps)
        } catch {
          // se não for json, tenta query params
          action = url.searchParams.get('action') || 'quick_log'
          if (url.searchParams.has('weight')) weight = Number(url.searchParams.get('weight'))
          if (url.searchParams.has('reps')) reps = Number(url.searchParams.get('reps'))
        }
      } else {
        action = url.searchParams.get('action') || 'quick_log'
        if (url.searchParams.has('weight')) weight = Number(url.searchParams.get('weight'))
        if (url.searchParams.has('reps')) reps = Number(url.searchParams.get('reps'))
      }

      const commandPayload = {
        id: crypto.randomUUID(),
        action,
        weight,
        reps,
        ts: Date.now(),
      }

      const recipients = broadcastEvent(token, 'command', commandPayload)
      const cached = tokenStatus.get(token)

      const restSec = cached?.totalRestSec || 90
      const summary = cached?.summaryText || 'Comando enviado ao WinFit.'

      // Formato amigável para resposta de atalhos da Apple
      if (url.searchParams.get('format') === 'text') {
        return textResponse(`✓ ${summary} (Descanso: ${restSec}s)`)
      }

      return jsonResponse({
        ok: true,
        deliveredTo: recipients,
        action,
        weight,
        reps,
        restSec,
        summaryText: summary,
        status: cached || null,
      })
    }

    // 3. Status Publisher: POST /status/:token
    if (method === 'POST' && matchStatus) {
      const token = decodeURIComponent(matchStatus[1]).trim().toUpperCase()
      try {
        const payload = (await request.json()) as WatchStatusCache
        tokenStatus.set(token, { ...payload, updatedAt: Date.now() })
        return jsonResponse({ ok: true })
      } catch (err) {
        return jsonResponse({ ok: false, error: 'JSON inválido' }, 400)
      }
    }

    // 4. Status Reader: GET /status/:token
    if (method === 'GET' && matchStatus) {
      const token = decodeURIComponent(matchStatus[1]).trim().toUpperCase()
      const cached = tokenStatus.get(token)

      if (!cached || !cached.active) {
        if (url.searchParams.get('format') === 'text') {
          return textResponse('Nenhum treino ativo no WinFit no momento.')
        }
        return jsonResponse({
          ok: true,
          active: false,
          summaryText: 'Nenhum treino ativo no WinFit.',
          restSec: 90,
        })
      }

      if (url.searchParams.get('format') === 'text') {
        return textResponse(cached.summaryText || 'Treino em andamento')
      }

      return jsonResponse({
        ok: true,
        ...cached,
        restSec: cached.isResting ? cached.restRemainingSec : cached.totalRestSec || 90,
      })
    }

    return jsonResponse({ ok: false, error: 'Rota não encontrada' }, 404)
  },
}
