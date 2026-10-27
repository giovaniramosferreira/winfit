import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { sendMagicLink } from '../lib/auth'
import { useStore } from '../lib/store'
import GoogleSignInButton from '../components/GoogleSignInButton'

export default function Login() {
  const nav = useNavigate()
  const { configured, loading, session, error } = useAuth()
  const onboarded = useStore((s) => s.profile !== null && s.plan !== null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  // Já logado: a sincronização do AuthProvider traz o plano; sem plano, segue pro onboarding.
  useEffect(() => {
    if (!loading && session?.user) nav(onboarded ? '/home' : '/onboarding', { replace: true })
  }, [loading, session, onboarded, nav])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true); setMessage('')
    try { await sendMagicLink(email); setSent(true) }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Tente novamente.') }
    finally { setSending(false) }
  }

  return (
    <div className="page-full product-shell account-screen login-screen fade-in">
      <button className="btn btn-quiet btn-sm" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => nav('/')}>
        ← Voltar
      </button>

      <div style={{ paddingTop: 32 }}>
        <div className="account-entry-mark" aria-hidden="true">W<span>f</span></div><div className="screen-kicker">Bem-vindo ao seu ritmo</div>
        <h1 className="screen-title" style={{ marginTop: 10 }}>Acesse sua <em>conta WinFit.</em></h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Seu espaço para treinar e cuidar da rotina. Entre na sua conta ou comece sem cadastro.
        </p>
      </div>

      <div style={{ marginTop: 24 }}><GoogleSignInButton /></div>
      {error && <p role="alert" className="small" style={{ marginTop: 12 }}>{error}</p>}
      {loading ? <p role="status" className="muted" style={{ marginTop: 24 }}>Preparando sua conta e verificando seus dados…</p> : !configured ? (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Comece no seu ritmo</h3>
          <p className="small muted" style={{ marginTop: 6 }}>
            Enquanto o login não está disponível, você pode experimentar o WinFit. Seus registros ficam neste aparelho.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => nav(onboarded ? '/home' : '/onboarding')}>
            Experimentar sem conta
          </button>
        </div>
      ) : sent ? (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Confira seu e-mail</h3>
          <p className="small muted" style={{ marginTop: 6 }}>
            Enviamos um link de acesso para <strong>{email}</strong>. Abra neste aparelho para entrar.
          </p>
          <button className="btn btn-quiet btn-sm" style={{ marginTop: 10 }} onClick={() => setSent(false)}>
            Usar outro e-mail
          </button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ marginTop: 24 }}>
          <label className="field" htmlFor="login-email">E-mail</label>
          <input
            id="login-email" className="input" type="email" autoComplete="email" required
            placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" style={{ marginTop: 14 }} disabled={!email || sending}>
            {sending ? 'Enviando…' : 'Entrar ou criar conta'}
          </button>
          <p className="tiny faint" style={{ marginTop: 10 }}>Sem senha: você recebe um link de acesso por e-mail.</p>
          {message && <p className="tiny" style={{ marginTop: 8, color: 'var(--red)' }}>{message}</p>}
        </form>
      )}
      {configured && !loading && <button className="btn btn-quiet" style={{ marginTop: 20 }} onClick={() => nav(onboarded ? '/home' : '/onboarding')}>Experimentar sem conta</button>}
    </div>
  )
}
