import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EQUIP_LABEL, EXERCISES, MUSCLE_LABEL } from '../data/exercises'
import { ANATOMY, REGIONS } from '../data/anatomy'
import { useStore } from '../lib/store'
import { canPerform } from '../lib/generator'
import type { Exercise, MuscleGroup } from '../types'
import ExerciseThumb from '../components/ExerciseThumb'
import PageTop from '../components/PageTop'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'

const GROUPS = REGIONS.flatMap((r) => r.groups)
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function Row({ e }: { e: Exercise }) {
  return <li><Link to={`/exercise/${e.id}`} className="lib-row">
    <ExerciseThumb exerciseId={e.id} />
    <span className="lib-row-t">{e.name}<small>{e.equipment.length ? e.equipment.map((x) => EQUIP_LABEL[x]).join(' + ') : 'Peso corporal'}</small></span>
    <Icon name="chevron" size={18} />
  </Link></li>
}

export default function Library() {
  const profile = useStore((s) => s.profile)
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<MuscleGroup | null>(null)
  const [mine, setMine] = useState(false)
  const equipment = profile?.equipment.length ? [...profile.equipment, 'peso_corporal' as const] : ['peso_corporal' as const]

  const results = useMemo(() => {
    const nq = normalize(q.trim())
    return EXERCISES.filter((e) => {
      if (group && e.primary !== group) return false
      if (mine && !canPerform(e, profile?.location === 'gym_full' ? e.equipment : equipment, profile?.limitations ?? [])) return false
      if (!nq) return true
      return normalize(e.name).includes(nq) || e.aliases.some((a) => normalize(a).includes(nq))
        || normalize(MUSCLE_LABEL[e.primary]).includes(nq) || normalize(ANATOMY[e.primary].latin).includes(nq)
    }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [q, group, mine, profile])
  const filtering = !!q.trim() || group !== null

  return (
    <div className="page fade-in library-page">
      <PageTop title="Exercícios" back={false} />
      <label className="lib-search">
        <span className="sr-only">Buscar exercício</span>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input type="search" placeholder={`Buscar entre ${EXERCISES.length} exercícios`} value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="lib-chips" role="group" aria-label="Filtros">
        <button className={`lib-chip${mine ? ' on' : ''}`} aria-pressed={mine} onClick={() => setMine(!mine)}>Posso fazer</button>
        {GROUPS.map((g) => <button key={g} className={`lib-chip${group === g ? ' on' : ''}`} aria-pressed={group === g} onClick={() => setGroup(group === g ? null : g)}>{MUSCLE_LABEL[g]}</button>)}
      </div>

      {results.length === 0 && <EmptyState icon="book" title="Nada encontrado. Tente “terra” ou “glúteo”." action={<button className="btn btn-ghost btn-sm" onClick={() => { setQ(''); setGroup(null); setMine(false) }}>Limpar filtros</button>} />}

      {filtering ? <>
        <p className="small muted" style={{ margin: '4px 2px 8px' }}>{results.length} {results.length === 1 ? 'exercício' : 'exercícios'}</p>
        <ul className="lib-list card">{results.map((e) => <Row key={e.id} e={e} />)}</ul>
      </> : GROUPS.map((g) => {
        const items = results.filter((e) => e.primary === g)
        if (!items.length) return null
        return <details key={g} className="lib-group card">
          <summary><b>{MUSCLE_LABEL[g]}</b><span className="small muted num">{items.length}</span></summary>
          <ul className="lib-list">{items.map((e) => <Row key={e.id} e={e} />)}</ul>
        </details>
      })}
    </div>
  )
}
