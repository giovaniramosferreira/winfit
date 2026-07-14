import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { GOOGLE_CLIENT_ID, googleAuthEnabled, decodeCredential, loadGsi } from '../lib/auth'

// Renderiza o botão oficial "Entrar com Google" (GIS). Se o client ID não
// estiver configurado (VITE_GOOGLE_CLIENT_ID), não renderiza nada — o app
// continua funcionando 100% local, login é opcional.
export default function GoogleSignIn({ width = 280 }: { width?: number }) {
  const setGoogleUser = useStore((s) => s.setGoogleUser)
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!googleAuthEnabled) return
    let cancelled = false
    loadGsi()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => {
            const user = decodeCredential(credential)
            if (user) setGoogleUser(user)
          },
        })
        window.google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: 'pt-BR',
          width,
        })
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [setGoogleUser, width])

  if (!googleAuthEnabled) return null
  if (error) {
    return (
      <p className="tiny faint center">
        Não foi possível carregar o login do Google. Verifique sua conexão.
      </p>
    )
  }
  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
}
