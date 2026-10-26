import { useState } from 'react'
import { sendMagicLink } from '../lib/auth'
import { useAuth } from './AuthProvider'

export default function AccountCard() {
  const { configured, loading, session, syncNow, logout, status, error, review, resolve, deleteRemote, downloadRemote, destination } = useAuth()
  const [includeModules, setIncludeModules] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  if (!configured) return null
  if (loading) return <div className="card" style={{ marginTop: 12 }}><p className="small muted">Verificando sua conta…</p></div>
  if (session?.user) return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="between"><h3>Conta e backup</h3><span className="pill accent">{{ local: 'Local', checking: 'Verificando…', review: 'Revisão necessária', pending: 'Alterações locais', synced: 'Backup confirmado', error: 'Falha no backup' }[status]}</span></div>
      <p className="small muted" style={{ marginTop: 6 }}>{session.user.email}. O backup é manual: nenhum histórico é enviado só por entrar na conta.</p>
      <p className="tiny muted">Ao enviar, plano, séries e treino ativo seguem para {destination}. A cópia fica na sua conta Supabase até ser substituída ou excluída pelo serviço. Sair interrompe o acesso neste app; não apaga a cópia remota.</p>
      <label style={{ display: 'block', marginTop: 12 }}><input type="checkbox" checked={includeModules} onChange={(event) => setIncludeModules(event.target.checked)} /> Incluir alimentação, saúde pélvica e rotina neste envio</label>
      <p className="tiny muted">Desmarcar impede incluir dados privados deste aparelho no próximo envio; não remove cópias já enviadas. Use “Excluir backup da conta” para removê-las.</p>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-ghost btn-sm grow" disabled={status === 'checking'} onClick={() => void syncNow(includeModules)}>Revisar e enviar backup</button>
        <button className="btn btn-quiet btn-sm" onClick={logout}>Sair</button>
      </div>
      {review && <div className="note"><h3>Há dados na nuvem</h3><p className="small">Confira a cópia remota antes de mesclar. Registros com o mesmo ID mantêm a versão deste aparelho; o plano e treino ativo locais continuam. A rotina local prevalece. Dados de outra conta não devem ser mesclados sem sua intenção de transferi-los.</p>
        <button className="btn btn-ghost" onClick={downloadRemote}>Baixar cópia da nuvem</button>
        <button className="btn btn-primary" disabled={status === 'checking'} onClick={() => void resolve(includeModules)}>Confirmar mesclagem e envio</button></div>}
      <button className="btn btn-quiet btn-sm" disabled={status === 'checking'} onClick={() => { if (confirm('Excluir o backup da sua conta? Os dados locais ficam preservados. Esta ação não exclui a conta nem cópias de infraestrutura do provedor.')) void deleteRemote() }}>Excluir backup da conta</button>
      {error && <p role="alert" className="small">{error}</p>}
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
