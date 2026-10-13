import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EQUIP_LABEL, EXERCISES, MUSCLE_LABEL } from '../data/exercises'
import { ANATOMY, plateNo, REGIONS, roman } from '../data/anatomy'
import type { MuscleGroup } from '../types'

const GROUPS = REGIONS.flatMap((r) => r.groups)

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Atlas: índice remissivo por região do corpo; cada exercício é uma prancha numerada. */
export default function Library() {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<MuscleGroup | null>(null)

  const results = useMemo(() => {
    const nq = normalize(q.trim())
    return EXERCISES.filter((e) => {
      if (group && e.primary !== group) return false
      if (!nq) return true
      return (
        normalize(e.name).includes(nq) ||
        e.aliases.some((a) => normalize(a).includes(nq)) ||
        normalize(MUSCLE_LABEL[e.primary]).includes(nq) ||
        normalize(ANATOMY[e.primary].latin).includes(nq)
      )
    }).sort((a, b) => plateNo(a.id) - plateNo(b.id))
  }, [q, group])

  return (
    <div className="page fade-in">
      <div className="sheet-head"><span>Atlas</span><span className="num">{EXERCISES.length} pranchas</span></div>
      <h1>O corpo, <em>exercício por exercício.</em></h1>
      <label className="sr-only" htmlFor="atlas-q">Buscar no atlas</label>
      <input
        id="atlas-q" className="input" style={{ marginTop: 16 }}
        placeholder="Buscar exercício ou músculo"
        value={q} onChange={(e) => setQ(e.target.value)}
      />
      <div className="chips" style={{ marginTop: 10 }} role="tablist" aria-label="Filtrar por músculo">
        <button role="tab" aria-selected={group === null} className={`chip ${group === null ? 'on' : ''}`} onClick={() => setGroup(null)}>Todos</button>
        {GROUPS.map((g) => (
          <button key={g} role="tab" aria-selected={group === g} className={`chip ${group === g ? 'on' : ''}`}
            onClick={() => setGroup(group === g ? null : g)}>
            {MUSCLE_LABEL[g]}
          </button>
        ))}
      </div>

      {results.length === 0 && (
        <div className="empty" style={{ marginTop: 16 }}>
          <h3>Nenhuma prancha para “{q}”.</h3>
          <p className="small" style={{ marginTop: 6 }}>Tente outro nome, como “terra”, “extensora” ou “glúteo”.</p>
        </div>
      )}

      {REGIONS.map((region, ri) => {
        const groups = region.groups.filter((g) => results.some((e) => e.primary === g))
        if (groups.length === 0) return null
        return (
          <section key={region.title} style={{ marginTop: 10 }}>
            <div className="region-head">
              <h2>{region.title}</h2>
              <span>Parte {roman(ri + 1)}</span>
            </div>
            {groups.map((g) => (
              <div key={g} style={{ marginTop: 12 }}>
                <div className="between" style={{ alignItems: 'baseline' }}>
                  <h3>{MUSCLE_LABEL[g]}</h3>
                  <span className="latin small">{ANATOMY[g].latin}</span>
                </div>
                <ol className="toc" style={{ marginTop: 2 }}>
                  {results.filter((e) => e.primary === g).map((e) => (
                    <li key={e.id}>
                      <Link to={`/exercise/${e.id}`} className="toc-item">
                        <span className="n num">{plateNo(e.id)}</span>
                        <span className="t">{e.name}
                          <small>{e.equipment.length ? e.equipment.map((x) => EQUIP_LABEL[x]).join(' + ') : 'Peso corporal'}</small>
                        </span>
                        <span className="chev">›</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}
