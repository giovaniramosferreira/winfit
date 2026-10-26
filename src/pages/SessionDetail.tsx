import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { historyRows } from '../lib/sessionHistory'
import { byId } from '../data/exercises'

export default function SessionDetail() {
  const { id } = useParams()
  const session = useStore((s) => s.sessions.find((item) => item.id === id))
  if (!session) return <div className="page"><h1>Treino não encontrado</h1><Link to="/progress">Voltar ao histórico</Link></div>
  return <div className="page"><Link to="/progress">← Histórico</Link><h1>{session.dayLabel}</h1>
    <p>{new Date(session.startedAt).toLocaleString('pt-BR')} · {session.status === 'completed' ? 'Concluído' : 'Parcial'}</p>
    {historyRows(session).map((row, index) => <section className="card" key={`${row.planExerciseId}-${index}`}>
      <h2>{row.name}</h2>{row.skipped && <p>Exercício pulado</p>}
      {row.substitutedFrom && <p>Substituiu: {byId.get(row.substitutedFrom)?.name ?? row.substitutedFrom}</p>}
      {row.legacy && <p className="muted">Registro legado: planejamento original não disponível.</p>}
      {row.logs.length ? <ul>{row.logs.map((log) => <li key={log.id}>Série {log.setNumber ?? '—'}: {log.weight > 0 ? `${log.weight.toLocaleString('pt-BR')} kg · ` : ''}{log.reps} {log.unit}</li>)}</ul> : <p>Nenhuma série registrada.</p>}
    </section>)}
  </div>
}
