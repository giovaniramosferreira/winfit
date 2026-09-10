import { useState } from 'react'
import { sendMagicLink } from '../lib/auth'
import { useAuth } from './AuthProvider'

export default function AccountCard() {
  const { configured, loading, session, syncNow, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  if (!configured) return null
  if (loading) return <div className="card" style={{ marginTop: 12 }}><p className="small muted">Verificando sua conta…</p></div>
  if (session?.user) return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="between"><h3>Conta e backup</h3><span className="pill accent">Sincronizado</span></div>
      <p className="small muted" style={{ marginTop: 6 }}>{session.user.email}. Seu plano e histórico acompanham você em qualquer aparelho.</p>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-ghost btn-sm grow" onClick={() => syncNow().then(() => setMessage('Backup atualizado.')).catch(() => setMessage('Sem conexão. Seus dados continuam seguros neste aparelho.'))}>Sincronizar agora</button>
        <button className="btn btn-quiet btn-sm" onClick={logout}>Sair</button>
      </div>
      {message && <p className="tiny faint" style={{ marginTop: 8 }}>{message}</p>}
    </div>
  )
  const submit = async () => {
    setSending(true); setMessage('')
    try { await sendMagicLink(email); setMessage('Enviamos um link seguro para o seu e-mail.') }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Tente novamente.') }
    finally { setSending(false) }
  }
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3>Salve seu treino na sua conta</h3>
      <p className="small muted" style={{ marginTop: 6 }}>Entre para manter plano, cargas e histórico ao trocar de celular ou usar o computador.</p>
      <label className="sr-only" htmlFor="account-email">Seu e-mail</label>
      <input id="account-email" className="input" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginTop: 12 }} />
      <button className="btn btn-primary" style={{ marginTop: 10 }} disabled={!email || sending} onClick={submit}>{sending ? 'Enviando…' : 'Entrar ou criar conta'}</button>
      <p className="tiny faint" style={{ marginTop: 8 }}>Sem senha: você recebe um link de acesso por e-mail.</p>
      {message && <p className="tiny" style={{ marginTop: 8 }}>{message}</p>}
    </div>
  )
}
