import { useState } from 'react'
import Switch from './Switch'
import { applicationSnapshot, applyApplicationBackup, downloadBackup, mergeApplications, parseApplicationBackup, type ApplicationBackup } from '../lib/applicationBackup'

export default function DataControls() {
  const [candidate, setCandidate] = useState<ApplicationBackup | null>(null)
  const [message, setMessage] = useState('')
  const [useBackupPlan, setUseBackupPlan] = useState(false)
  const [workoutOnly, setWorkoutOnly] = useState(false)
  return <section className="data-controls">
    <label className="btn btn-ghost file-btn" htmlFor="backup-import" style={{ marginTop: 10 }}>Importar backup</label>
    <input id="backup-import" className="sr-only" type="file" accept="application/json,.json" onChange={async (event) => {
      const file = event.target.files?.[0]; setCandidate(null); setMessage('')
      if (!file) return
      if (file.size > 20 * 1024 * 1024) { setMessage('O arquivo excede o limite de 20 MB.'); return }
      try { setCandidate(parseApplicationBackup(await file.text())) } catch { setMessage('Arquivo inválido ou versão não reconhecida. Seus dados foram preservados.') }
    }} />
    {candidate && <div className="note"><p>{candidate.sessions.length} treinos, {candidate.modules?.nutrition?.meals.length ?? 0} refeições. {candidate.activeSession ? 'Contém um treino em andamento.' : ''}</p>
      <Switch label="Usar plano do backup" hint={useBackupPlan ? 'O treino local em andamento vai para o histórico.' : 'Seu plano atual continua.'} checked={useBackupPlan} onChange={setUseBackupPlan} />
      <Switch label="Só treinos" hint="Não mexe em circuito, alimentação, saúde pélvica e rotina." checked={workoutOnly} onChange={setWorkoutOnly} />
      <p className="small muted">Registros iguais mantêm a versão deste aparelho.</p>
      <button className="btn btn-primary" onClick={() => { try { applyApplicationBackup(mergeApplications(applicationSnapshot(!workoutOnly), workoutOnly ? { ...candidate, modules:undefined } : candidate, { useBackupPlan }), candidate, { workoutOnly }); setCandidate(null); setMessage('Backup mesclado. Registros locais preservados.') } catch (error) { setMessage(`Não foi possível concluir: ${String(error)}. Confira a cópia de recuperação.`) } }}>Confirmar mesclagem</button>
      <button className="btn btn-quiet" onClick={() => setCandidate(null)}>Cancelar</button></div>}
    {localStorage.getItem('winfit-recovery-v2') && <button className="btn btn-quiet" onClick={() => { const raw = localStorage.getItem('winfit-recovery-v2'); if (raw) downloadBackup(JSON.parse(raw), 'winfit-recuperacao.json') }}>Baixar cópia anterior à última importação</button>}
    {message && <p role="status" className="small">{message}</p>}
  </section>
}
