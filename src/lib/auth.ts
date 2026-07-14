// Autenticação com Google via Google Identity Services (GIS) — 100% client-side.
// Sem backend: o token de identidade é decodificado localmente só para exibir
// nome/e-mail/foto e identificar o perfil neste aparelho. O sync na nuvem
// (fase 2, Supabase) reutilizará esta mesma conta.

import type { GoogleUser } from '../types'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
export const googleAuthEnabled = GOOGLE_CLIENT_ID.length > 0

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }): void
          renderButton(
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              logo_alignment?: 'left' | 'center'
              width?: number
              locale?: string
            },
          ): void
          prompt(): void
          disableAutoSelect(): void
        }
      }
    }
  }
}

let gsiPromise: Promise<void> | null = null

/** Carrega o script do GIS uma única vez (idempotente). */
export function loadGsi(): Promise<void> {
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => {
      gsiPromise = null
      reject(new Error('Falha ao carregar o script de login do Google'))
    }
    document.head.appendChild(s)
  })
  return gsiPromise
}

/** Decodifica o payload do ID token (JWT) retornado pelo Google. */
export function decodeCredential(credential: string): GoogleUser | null {
  try {
    const b64url = credential.split('.')[1]
    if (!b64url) return null
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '='))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(bytes))
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === 'string' ? payload.name : payload.email,
      picture: typeof payload.picture === 'string' ? payload.picture : undefined,
      signedInAt: Date.now(),
    }
  } catch {
    return null
  }
}

/** Desativa o auto-select do One Tap para o próximo carregamento. */
export function googleSignOut() {
  window.google?.accounts.id.disableAutoSelect()
}
