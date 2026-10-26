import { useSyncExternalStore } from 'react'
import { workoutStorage } from '../lib/workoutStorage'

export default function WorkoutStorageNotice() {
  const health = useSyncExternalStore(workoutStorage.subscribe, workoutStorage.health, workoutStorage.health)
  if (!health.error) return null
  const raw = workoutStorage.original()
  const download = () => {
    if (raw === null) return
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'winfit-treinos-original.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="card" role="alert" style={{ margin: 12 }}><h2>Armazenamento dos treinos</h2><p>{health.error}</p>
    {raw !== null && <button className="btn" onClick={download}>Baixar conteúdo original salvo</button>}
    <p className="small">Antes de redefinir os dados no Perfil, guarde o original e exporte os treinos novos que ainda estão na memória. Não feche o aplicativo se houver registros não salvos.</p>
  </section>
}
