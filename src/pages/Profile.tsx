import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId, EQUIP_LABEL } from '../data/exercises'
import type { Equipment, Goal, TrainingProfile } from '../types'
import InstallCard from '../components/InstallCard'
import WatchModal from '../components/WatchModal'
import { useOnline, useServiceWorker } from '../lib/pwa'
import AccountCard from '../components/AccountCard'
import DataControls from '../components/DataControls'
import { applicationSnapshot, downloadBackup, resetApplicationData } from '../lib/applicationBackup'
import { useAuth } from '../components/AuthProvider'
import { privacy } from '../lib/privacy'
import PageTop from '../components/PageTop'
import Icon from '../components/Icon'

const GOAL_LABEL: Record<Goal, string> = {
  hypertrophy: 'Ganhar músculo',
  fat_loss: 'Perder gordura',
  strength: 'Ficar mais forte',
  return_fitness: 'Voltar à forma',
  health: 'Saúde e disposição',
}

export default function Profile() {
  const nav = useNavigate()
  const profile = useStore((s) => s.profile)!
  const plan = useStore((s) => s.plan)!
  const regenerate = useStore((s) => s.regenerate)
  const { logout } = useAuth()
  const [dataError, setDataError] = useState('')
  const setDraft = useStore((s) => s.setDraft)
  const online = useOnline()
  const { needRefresh, update } = useServiceWorker()
  const [adjust, setAdjust] = useState(false)
  const [watchModal, setWatchModal] = useState(false)
  const [freq, setFreq] = useState(profile.frequency)
  const [time, setTime] = useState(profile.sessionTimeMin)
  const [goal, setGoal] = useState(profile.goal)
  const [equip, setEquip] = useState<Equipment[]>(profile.equipment)
  const [showPlan, setShowPlan] = useState(false)

  const doExport = () => {
    try { downloadBackup(applicationSnapshot()); setDataError('') }
    catch (error) { setDataError(`Não foi possível exportar: ${String(error)}`) }
  }

  const applyAdjust = () => {
    const next: TrainingProfile = { ...profile, frequency: freq, sessionTimeMin: time, goal, equipment: profile.location === 'gym_basic' || profile.location === 'home_equipment' ? equip : profile.equipment }
    regenerate(next)
    setAdjust(false)
  }

  const redoOnboarding = () => {
    setDraft({ step: 1 })
    nav('/onboarding')
  }

  const equipmentText = profile.location === 'gym_full'
    ? 'Academia completa'
    : profile.equipment.length > 0 ? profile.equipment.map((e: Equipment) => EQUIP_LABEL[e]).join(', ') : 'Só peso do corpo'

  return (
    <div className="page product-shell account-screen profile-screen fade-in">
      <PageTop title="Perfil" back={false} />
      {needRefresh && <div className="note" role="status" style={{ marginBottom: 12 }}>
        <b>Nova versão pronta.</b>
        <button className="btn btn-primary btn-sm" style={{ display: 'block', marginTop: 10 }} onClick={update}>Atualizar agora</button>
      </div>}
      {!online && <p className="small muted" style={{ marginBottom: 12 }}>Sem conexão. O app continua funcionando.</p>}

      <section className="card account-plan-card">
        <h2 className="field-title" style={{ fontSize: 18 }}>{plan.splitLabel}</h2>
        <dl className="kv">
          <dt>Objetivo</dt><dd>{GOAL_LABEL[profile.goal]}</dd>
          <dt>Frequência</dt><dd className="num">{profile.frequency}x por semana</dd>
          <dt>Duração</dt><dd className="num">~{profile.sessionTimeMin} min</dd>
          <dt>Equipamento</dt><dd>{equipmentText}</dd>
        </dl>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setAdjust(true)}>Editar plano</button>
        <button className="btn btn-quiet" onClick={() => setShowPlan(!showPlan)}>{showPlan ? 'Ocultar treinos' : 'Ver treinos do plano'}</button>
        {showPlan && (
          <div style={{ marginTop: 4 }}>
            {plan.days.map((d) => (
              <div key={d.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: 15 }}>{d.label} <span className="small muted num">~{d.estMin} min</span></h3>
                {d.exercises.map((pe) => (
                  <div key={pe.id} className="between" style={{ marginTop: 4 }}>
                    <span className="small muted">{byId.get(pe.exerciseId)?.name}</span>
                    <span className="small muted num">{pe.sets}×{pe.repMin}–{pe.repMax}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <h2 className="hub-section">Ajustes</h2>
      <button className="hub-row settings-row" style={{ marginTop: 0, width: '100%' }} onClick={() => setWatchModal(true)}>
        <span className="hub-row-icon"><Icon name="timer" /></span>
        <span className="hub-row-copy"><b>Apple Watch</b><small>Registrar séries pelo relógio</small></span>
        <Icon name="chevron" />
      </button>
      <div style={{ marginTop: 12 }}><InstallCard variant="settings" /></div>
      <div style={{ marginTop: 12 }}><AccountCard /></div>

      <details className="card more-card" style={{ marginTop: 12 }}>
        <summary>Dados e backup</summary>
        <p className="small muted" style={{ marginTop: 6 }}>Seus registros ficam neste aparelho.</p>
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={doExport}>Exportar meus dados</button>
        <DataControls />
        <button className="btn btn-danger" style={{ marginTop: 12 }}
          onClick={() => {
            if (confirm('Apagar todos os dados deste aparelho? Exporte um backup antes. Backups na nuvem não são apagados.')) {
              try { resetApplicationData(); privacy.setWatchDestination(null); logout(); nav('/') }
              catch (error) { setDataError(String(error)) }
            }
          }}>
          Apagar dados deste aparelho
        </button>
        {dataError && <p role="alert" className="small">{dataError}</p>}
      </details>

      <details className="card more-card" style={{ marginTop: 12 }}>
        <summary>Sobre o WinFit</summary>
        <p className="small muted" style={{ marginTop: 6 }}>O WinFit não substitui avaliação médica ou de um profissional de educação física. Sentiu dor persistente? Procure ajuda.</p>
        <p className="small muted" style={{ marginTop: 8 }}>
          Interface e ícones adaptados do <a href="https://www.figma.com/community/file/1091263687486055207/free-fitness-app-ui-kit" target="_blank" rel="noreferrer">Pump House / Free Fitness App UI Kit, por Figma Pro</a>, sob <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.
        </p>
      </details>

      {adjust && (
        <div className="modal-back" onClick={() => setAdjust(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="adjust-title">
            <h2 id="adjust-title">Editar plano</h2>
            <p className="small muted" style={{ marginTop: 4 }}>Um novo plano é gerado. Histórico e recordes continuam.</p>
            <h3 className="field-title" style={{ marginTop: 16 }}>Objetivo</h3>
            <div className="lib-chips" style={{ flexWrap: 'wrap', margin: 0, padding: 0 }}>
              {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
                <button key={g} className={`lib-chip${goal === g ? ' on' : ''}`} aria-pressed={goal === g} onClick={() => setGoal(g)}>{GOAL_LABEL[g]}</button>
              ))}
            </div>
            <h3 className="field-title" style={{ marginTop: 16 }}>Dias por semana</h3>
            <div className="seg">{[2, 3, 4, 5, 6].map((f) => <button key={f} className="num" aria-pressed={freq === f} onClick={() => setFreq(f)}>{f}</button>)}</div>
            <h3 className="field-title">Tempo por treino</h3>
            <div className="seg">{[30, 45, 60, 75].map((t) => <button key={t} className="num" aria-pressed={time === t} onClick={() => setTime(t)}>{t}′</button>)}</div>
            {(profile.location === 'gym_basic' || profile.location === 'home_equipment') && <>
              <h3 className="field-title">Equipamento</h3>
              <div className="lib-chips" style={{ flexWrap: 'wrap', margin: '0 0 16px', padding: 0 }}>
                {(Object.keys(EQUIP_LABEL) as Equipment[]).filter((e) => e !== 'peso_corporal').map((e) => (
                  <button key={e} className={`lib-chip${equip.includes(e) ? ' on' : ''}`} aria-pressed={equip.includes(e)} onClick={() => setEquip(equip.includes(e) ? equip.filter((x) => x !== e) : [...equip, e])}>{EQUIP_LABEL[e]}</button>
                ))}
              </div>
            </>}
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={applyAdjust}>Gerar novo plano</button>
            <button className="btn btn-quiet" onClick={redoOnboarding}>Mudar local ou limitações</button>
          </div>
        </div>
      )}
      {watchModal && <WatchModal onClose={() => setWatchModal(false)} />}
    </div>
  )
}
