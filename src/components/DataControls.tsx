import { useState } from 'react'
import { applicationSnapshot, applyApplicationBackup, downloadBackup, mergeApplications, parseApplicationBackup, type ApplicationBackup } from '../lib/applicationBackup'

export default function DataControls() {
  const [candidate, setCandidate] = useState<ApplicationBackup | null>(null)
  const [message, setMessage] = useState('')
  const [useBackupPlan, setUseBackupPlan] = useState(false)
  const [workoutOnly, setWorkoutOnly] = useState(false)
  return <section className="card" style={{ marginTop: 12 }}><h3>Backup de todos os módulos</h3>
    <p className="small muted">Inclui treino ativo, descanso, histórico, alimentação, saúde pélvica e rotina. Guarde o arquivo em local privado. Fotos em rascunho não estão incluídas.</p>
    <button className="btn btn-ghost" onClick={() => { try { downloadBackup(applicationSnapshot()); setMessage('Backup exportado.') } catch (error) { setMessage(String(error)) } }}>Exportar backup completo</button>
    <label className="field" htmlFor="backup-import">Mesclar um backup JSON</label>
    <input id="backup-import" type="file" accept="application/json,.json" onChange={async (event) => {
      const file = event.target.files?.[0]; setCandidate(null); setMessage('')
      if (!file) return
      if (file.size > 20 * 1024 * 1024) { setMessage('O arquivo excede o limite de 20 MB.'); return }
      try { setCandidate(parseApplicationBackup(await file.text())) } catch { setMessage('Arquivo inválido ou versão não reconhecida. Seus dados foram preservados.') }
    }} />
    {candidate && <div className="note"><p>{candidate.sessions.length} treinos, {candidate.modules?.nutrition?.meals.length ?? 0} refeições. {candidate.activeSession ? 'Contém um treino em andamento.' : ''}</p>
      <label className="field"><span><input type="checkbox" checked={useBackupPlan} onChange={e => setUseBackupPlan(e.target.checked)} /> Usar plano do backup</span></label>
      <p>{useBackupPlan ? 'O perfil, plano e treino ativo virão do backup. O treino local em andamento será guardado no histórico.' : 'O plano e treino ativo locais serão preservados.'}</p>
      <label className="field"><span><input type="checkbox" checked={workoutOnly} onChange={e => setWorkoutOnly(e.target.checked)} /> Importar apenas plano e histórico de treino</span></label>
      <p>Esta opção preserva os dados locais de alimentação, saúde pélvica e rotina, inclusive se algum desses módulos estiver ilegível.</p>
      <p>IDs repetidos mantêm a versão deste aparelho; Uma cópia dos dois backups fica disponível para recuperação.</p>
      <button className="btn btn-primary" onClick={() => { try { applyApplicationBackup(mergeApplications(applicationSnapshot(!workoutOnly), workoutOnly ? { ...candidate, modules:undefined } : candidate, { useBackupPlan }), candidate, { workoutOnly }); setCandidate(null); setMessage('Backup mesclado. Registros locais preservados.') } catch (error) { setMessage(`Não foi possível concluir: ${String(error)}. Confira a cópia de recuperação.`) } }}>Confirmar mesclagem</button>
      <button className="btn btn-quiet" onClick={() => setCandidate(null)}>Cancelar</button></div>}
    <button className="btn btn-quiet" onClick={() => { const raw = localStorage.getItem('winfit-recovery-v2'); if (raw) downloadBackup(JSON.parse(raw), 'winfit-recuperacao.json'); else setMessage('Nenhuma mesclagem anterior para recuperar.') }}>Exportar cópia de recuperação</button>
    {message && <p role="status" className="small">{message}</p>}
  </section>
}
