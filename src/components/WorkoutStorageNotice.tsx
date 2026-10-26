import { useState, useSyncExternalStore } from 'react'
import { workoutStorage } from '../lib/workoutStorage'
import { useStore } from '../lib/store'

export default function WorkoutStorageNotice() {
  const health = useSyncExternalStore(workoutStorage.subscribe, workoutStorage.health, workoutStorage.health)
  const [copied, setCopied] = useState(false)
  const [memoryCopied, setMemoryCopied] = useState(false)
  if (!health.error) return null
  const raw = workoutStorage.original()
  const download = () => {
    if (raw === null) return
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'winfit-treinos-original.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    setCopied(true)
  }
  return <section className="card" role="alert" style={{ margin: 12 }}><h2>Armazenamento dos treinos</h2><p>{health.error}</p>
    {raw !== null && <button className="btn" onClick={download}>Baixar conteúdo original salvo</button>}
    <button className="btn btn-ghost" onClick={() => {
      const url = URL.createObjectURL(new Blob([useStore.getState().exportData()], { type: 'application/json' }))
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'winfit-treinos-desta-sessao.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMemoryCopied(true)
    }}>Baixar treinos desta sessão (memória)</button>
    {health.blocked && raw !== null && <button className="btn btn-ghost" disabled={!copied || !memoryCopied} onClick={() => {
      if (window.confirm('Confirma que guardou a cópia original? Redefinir apaga somente os treinos locais deste aparelho.')) {
        if (workoutStorage.resetGuard()) useStore.getState().resetAll()
      }
    }}>Redefinir somente treinos locais</button>}
    <p className="small">Antes de redefinir os dados no Perfil, guarde o original e exporte os treinos novos que ainda estão na memória. Não feche o aplicativo se houver registros não salvos.</p>
  </section>
}
