import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { PROGRAMS, type Program } from '../data/programs'
import { previewFit, type ProgramFit } from '../lib/program'
import { byId, EQUIP_LABEL } from '../data/exercises'
import { estimateDayMin } from '../lib/generator'
import ExerciseAnim from '../components/ExerciseAnim'
import type { Equipment } from '../types'

export default function Programs() {
  const nav = useNavigate()
  const profile = useStore((s) => s.profile)!
  const plan = useStore((s) => s.plan)
  const activateProgram = useStore((s) => s.activateProgram)
  const [open, setOpen] = useState<Program | null>(null)
  const [confirm, setConfirm] = useState<Program | null>(null)

  const activeId = plan?.splitType.startsWith('program:') ? plan.splitType.slice(8) : null

  return (
    <div className="page fade-in">
      <button className="btn-quiet" onClick={() => nav(-1)} style={{ padding: '4px 0' }}>← Voltar</button>
      <h1 style={{ marginTop: 8 }}>Programas prontos</h1>
      <p className="muted small" style={{ marginTop: 6 }}>
        Planos fechados, montados exercício por exercício. Ao ativar um, ele substitui seu plano atual —
        o anterior fica guardado e seu histórico continua intacto.
      </p>

      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {PROGRAMS.map((p) => (
          <ProgramCard key={p.id} program={p} active={p.id === activeId}
            fit={previewFit(p, profile)} onOpen={() => setOpen(p)} />
        ))}
      </div>

      {open && (
        <ProgramSheet
          program={open}
          active={open.id === activeId}
          onClose={() => setOpen(null)}
          onActivate={() => { setConfirm(open); setOpen(null) }}
        />
      )}

      {confirm && (
        <div className="modal-back" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Ativar {confirm.name}?</h2>
            <p className="muted small" style={{ marginTop: 8 }}>
              Seu plano atual vai para o arquivo e este vira o treino da semana. Cargas e recordes continuam salvos.
            </p>
            {(() => {
              const fit = previewFit(confirm, profile)
              if (fit.swaps.length === 0 && fit.dropped.length === 0) return null
              return (
                <div className="card" style={{ marginTop: 12 }}>
                  {fit.swaps.length > 0 && (
                    <>
                      <h3 className="small">{fit.swaps.length} troca{fit.swaps.length > 1 ? 's' : ''} pelo seu equipamento</h3>
                      <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                        {fit.swaps.slice(0, 5).map((s, i) => (
                          <div key={i} className="tiny faint">
                            {byId.get(s.from)?.name} → <span className="accent-text">{byId.get(s.to)?.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {fit.dropped.length > 0 && (
                    <p className="tiny gold" style={{ marginTop: fit.swaps.length > 0 ? 10 : 0 }}>
                      {fit.dropped.length} exercício{fit.dropped.length > 1 ? 's ficam' : ' fica'} de fora: não há
                      equivalente possível com o equipamento que você cadastrou.
                    </p>
                  )}
                </div>
              )
            })()}
            <button className="btn btn-primary" style={{ marginTop: 16 }}
              onClick={() => { activateProgram(confirm.id); setConfirm(null); nav('/home') }}>
              Ativar programa
            </button>
            <button className="btn btn-quiet" onClick={() => setConfirm(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProgramCard({ program, active, fit, onOpen }: {
  program: Program
  active: boolean
  fit: ProgramFit
  onOpen: () => void
}) {
  const hero = program.days[0].items[0].exerciseId
  const intact = fit.swaps.length === 0 && fit.dropped.length === 0
  return (
    <button className="program-card" onClick={onOpen}>
      <div className="program-card-art">
        <ExerciseAnim exerciseId={hero} ratio={1.6} />
      </div>
      <div className="program-card-body">
        <div className="between">
          <span className="eyebrow">{program.daysPerWeek}× por semana</span>
          {active ? <span className="pill accent">Ativo</span>
            : intact ? <span className="pill green-pill">Cabe no seu equipamento</span>
            : <span className="pill gold">{fit.swaps.length + fit.dropped.length} ajustes</span>}
        </div>
        <h2 style={{ marginTop: 6, fontSize: 20 }}>{program.name}</h2>
        <p className="small muted" style={{ marginTop: 4 }}>{program.tagline}</p>
        <div style={{ marginTop: 10 }}>
          <span className="muscle-tag">{program.level}</span>
          <span className="muscle-tag num">~{program.estMin} min</span>
          <span className="muscle-tag num">{program.days.length} treinos</span>
        </div>
      </div>
    </button>
  )
}

function ProgramSheet({ program, active, onClose, onActivate }: {
  program: Program
  active: boolean
  onClose: () => void
  onActivate: () => void
}) {
  const profile = useStore((s) => s.profile)!
  const [day, setDay] = useState(0)
  const fit = previewFit(program, profile)
  const d = program.days[day]

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90dvh' }}>
        <div className="between">
          <h2>{program.name}</h2>
          <button className="btn-quiet" onClick={onClose}>Fechar</button>
        </div>
        <p className="small muted" style={{ marginTop: 2 }}>{program.tagline}</p>

        <div className="card" style={{ marginTop: 14 }}>
          <h3>Por que este programa funciona</h3>
          <ul className="small muted" style={{ marginTop: 8, paddingLeft: 18, display: 'grid', gap: 8 }}>
            {program.rationale.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>

        {fit.missing.length > 0 && (
          <div className="card" style={{ marginTop: 12, borderColor: 'rgba(245,185,66,0.35)' }}>
            <h3 className="gold">Equipamento que falta</h3>
            <p className="small muted" style={{ marginTop: 6 }}>
              O programa foi escrito para {program.requires.map((e) => EQUIP_LABEL[e as Equipment]).join(', ')}.
              Sem {fit.missing.map((e) => EQUIP_LABEL[e as Equipment]).join(', ')}, {fit.swaps.length} exercício
              {fit.swaps.length > 1 ? 's serão substituídos' : ' será substituído'} por equivalentes.
            </p>
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {program.days.map((dd, i) => (
            <button key={dd.label} className={`pill ${i === day ? 'accent' : ''}`} style={{ whiteSpace: 'nowrap' }}
              onClick={() => setDay(i)}>
              {dd.label.split('—')[0].trim()}
            </button>
          ))}
        </div>

        <div className="card" style={{ marginTop: 10, padding: '4px 14px' }}>
          <div className="between" style={{ padding: '10px 0 6px' }}>
            <span className="tiny faint">{d.focus}</span>
            <span className="tiny faint num">
              ~{estimateDayMin(d.items.map((i) => ({
                id: '', exerciseId: i.exerciseId, slotType: i.slot, sets: i.sets,
                repMin: i.repMin, repMax: i.repMax, restSec: i.restSec, optional: !!i.optional,
              })))} min
            </span>
          </div>
          {d.items.map((item, i) => {
            const ex = byId.get(item.exerciseId)
            return (
              <div key={i} className="program-row">
                <ExerciseAnim exerciseId={item.exerciseId} slot={item.slot} ratio={1.3} still className="program-thumb" />
                <div className="grow">
                  <h3 style={{ fontSize: 14 }}>{ex?.name ?? item.exerciseId}</h3>
                  <span className="tiny faint num">
                    {item.sets} × {item.repMin}–{item.repMax} · {item.restSec}s descanso
                    {item.optional ? ' · opcional' : ''}
                  </span>
                  {item.note && <p className="tiny faint" style={{ marginTop: 4 }}>{item.note}</p>}
                </div>
              </div>
            )
          })}
        </div>

        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onActivate} disabled={active}>
          {active ? 'Este já é o seu plano' : 'Usar este programa'}
        </button>
      </div>
    </div>
  )
}
