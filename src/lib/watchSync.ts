import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import type { WatchCommand, WatchStatusPayload } from '../types'

// URL padrão do relay serverless (pode ser sobrescrita via localStorage ou .env)
export const DEFAULT_RELAY_URL =
  import.meta.env.VITE_WATCH_RELAY_URL || 'https://winfit-relay.giovaniramosferreira.workers.dev'

export const OFFICIAL_ICLOUD_SHORTCUT_URL = 'https://www.icloud.com/shortcuts/aa3492f388cf479fb3c9f48d5baba1f8'

export function getRelayUrl(): string {
  try {
    return localStorage.getItem('winfit_relay_url') || DEFAULT_RELAY_URL
  } catch {
    return DEFAULT_RELAY_URL
  }
}

export function setCustomRelayUrl(url: string) {
  try {
    if (url.trim()) {
      localStorage.setItem('winfit_relay_url', url.trim())
    } else {
      localStorage.removeItem('winfit_relay_url')
    }
  } catch {
    // ignore
  }
}

export type SyncState = 'idle' | 'connecting' | 'connected' | 'error'

/**
 * Publica o estado atual do treino para o endpoint de status do relay
 */
export async function pushWatchStatus(token: string, payload: WatchStatusPayload): Promise<boolean> {
  if (!token) return false
  const relay = getRelayUrl().replace(/\/+$/, '')
  try {
    const res = await fetch(`${relay}/status/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Hook que gerencia a conexão SSE em tempo real com o Apple Watch durante a sessão de treino
 */
export function useWatchSync() {
  const watchToken = useStore((s) => s.watchToken)
  const activeSession = useStore((s) => s.activeSession)
  const getWatchStatusPayload = useStore((s) => s.getWatchStatusPayload)
  const executeWatchCommand = useStore((s) => s.executeWatchCommand)

  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [lastCommand, setLastCommand] = useState<{ action: string; ts: number; message: string } | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const retryTimeoutRef = useRef<number | null>(null)
  const isMountedRef = useRef<boolean>(true)

  // Publica o status sempre que houver mudança na sessão ativa
  useEffect(() => {
    if (!activeSession || !watchToken) return
    const payload = getWatchStatusPayload()
    pushWatchStatus(watchToken, payload)
  }, [activeSession, watchToken, getWatchStatusPayload])

  // Gerencia o ciclo de vida do EventSource SSE
  useEffect(() => {
    isMountedRef.current = true

    if (!activeSession || !watchToken) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setSyncState('idle')
      return
    }

    let retryDelay = 2000
    const relay = getRelayUrl().replace(/\/+$/, '')
    const sseUrl = `${relay}/events/${encodeURIComponent(watchToken)}`

    function connect() {
      if (!isMountedRef.current) return
      setSyncState('connecting')

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const es = new EventSource(sseUrl)
      eventSourceRef.current = es

      es.addEventListener('connected', () => {
        if (!isMountedRef.current) return
        setSyncState('connected')
        retryDelay = 2000
        // Envia o status atual logo após conectar
        pushWatchStatus(watchToken, getWatchStatusPayload())
      })

      es.addEventListener('command', (event: MessageEvent) => {
        if (!isMountedRef.current) return
        try {
          const cmd = JSON.parse(event.data) as WatchCommand
          const result = executeWatchCommand(cmd)
          setLastCommand({ action: cmd.action, ts: Date.now(), message: result.message })
          // Atualiza status no relay imediatamente
          pushWatchStatus(watchToken, getWatchStatusPayload())
        } catch (err) {
          console.error('[WatchSync] Erro ao processar comando:', err)
        }
      })

      es.onerror = () => {
        if (!isMountedRef.current) return
        setSyncState('error')
        es.close()
        eventSourceRef.current = null

        // Reconexão com backoff exponencial
        retryTimeoutRef.current = window.setTimeout(() => {
          if (isMountedRef.current) {
            retryDelay = Math.min(retryDelay * 1.5, 15000)
            connect()
          }
        }, retryDelay)
      }
    }

    connect()

    return () => {
      isMountedRef.current = false
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [activeSession?.id, watchToken, executeWatchCommand, getWatchStatusPayload])

  return {
    syncState,
    watchToken,
    lastCommand,
  }
}

/**
 * URLs prontas para configurar os Atalhos do iOS / Apple Watch
 */
export function getShortcutEndpoints(token: string) {
  const base = getRelayUrl().replace(/\/+$/, '')
  const enc = encodeURIComponent(token)

  return {
    quickLog: `${base}/cmd/${enc}?action=quick_log&format=text`,
    customLog: `${base}/cmd/${enc}?action=custom_log&weight=PESO&reps=REPS&format=text`,
    addRest: `${base}/cmd/${enc}?action=add_rest&format=text`,
    skipRest: `${base}/cmd/${enc}?action=skip_rest&format=text`,
    skipExercise: `${base}/cmd/${enc}?action=skip_exercise&format=text`,
    statusText: `${base}/status/${enc}?format=text`,
    statusJson: `${base}/status/${enc}`,
  }
}
