import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { historyRows } from '../lib/sessionHistory'
import { byId } from '../data/exercises'
import PageTop from '../components/PageTop'

export default function SessionDetail() {
  const { id } = useParams()
  const session = useStore((s) => s.sessions.find((item) => item.id === id))
  if (!session) return <div className="page product-shell account-screen session-detail-screen"><h1>Treino não encontrado</h1><Link to="/progress">Voltar ao histórico</Link></div>
  return <div className="page product-shell account-screen session-detail-screen"><PageTop title={session.dayLabel} back="/progress" tagline={`${new Date(session.startedAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} · ${new Date(session.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}${session.status === 'completed' ? '' : ' · parcial'}`} />
    {historyRows(session).map((row, index) => <section className="card" key={`${row.planExerciseId}-${index}`}>
      <div className="between"><h2>{row.name}</h2><span className="account-set-count">{row.logs.length === 1 ? '1 série' : `${row.logs.length} séries`}</span></div>{row.skipped && <p>Exercício pulado</p>}
      {row.substitutedFrom && <p>Substituiu: {byId.get(row.substitutedFrom)?.name ?? row.substitutedFrom}</p>}
      {row.legacy && <p className="muted">Registro legado: planejamento original não disponível.</p>}
      {row.logs.length ? <ul>{row.logs.map((log) => <li key={log.id}>Série {log.setNumber ?? '—'}: {log.weight > 0 ? `${log.weight.toLocaleString('pt-BR')} kg · ` : ''}{log.reps} {log.unit}</li>)}</ul> : <p>Nenhuma série registrada.</p>}
    </section>)}
  </div>
}
