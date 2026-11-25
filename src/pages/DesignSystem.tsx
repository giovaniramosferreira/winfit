import { useEffect, useMemo, useState } from 'react'
import '../design/tokens.css'
import '../design/design-system.css'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import Switch from '../components/Switch'
import { Alert, Badge, Button, Card, Field } from '../components/ui'

const COLORS: Array<[string, string]> = [
  ['Fundo', '--ds-bg'], ['Superfície', '--ds-surface'], ['Superfície 2', '--ds-surface-2'],
  ['Linha', '--ds-line'], ['Linha forte', '--ds-line-strong'],
  ['Texto', '--ds-text'], ['Texto apoio', '--ds-text-dim'], ['Texto leve', '--ds-text-faint'],
  ['Marca', '--ds-brand'], ['Marca profunda', '--ds-brand-deep'], ['Marca suave', '--ds-brand-soft'],
  ['Sucesso', '--ds-success'], ['Aviso', '--ds-warning'], ['Erro', '--ds-danger'],
]
const TYPE: Array<[string, string, string]> = [
  ['2xl · 34', '--ds-text-2xl', 'Destaque 1.250'],
  ['xl · 26', '--ds-text-xl', 'Título de tela'],
  ['lg · 20', '--ds-text-lg', 'Título de bloco'],
  ['md · 16', '--ds-text-md', 'Texto corrido do aplicativo'],
  ['sm · 14', '--ds-text-sm', 'Texto de apoio e rótulos'],
  ['xs · 12', '--ds-text-xs', 'Legendas e notas'],
]
const SPACES = [1, 2, 3, 4, 5, 6, 7]
const RADII: Array<[string, string]> = [['sm · 8', '--ds-radius-sm'], ['md · 12', '--ds-radius-md'], ['lg · 16', '--ds-radius-lg'], ['xl · 24', '--ds-radius-xl'], ['pill', '--ds-radius-pill']]
const ICONS = ['play', 'timer', 'breath', 'meal', 'calendar', 'spark', 'dumbbell', 'home', 'chart', 'book', 'user', 'plus', 'check', 'flame', 'bolt', 'refresh'] as const

/** Razão de contraste WCAG entre duas cores #rrggbb (as demais são ignoradas). */
function lum(hex: string) {
  const c = hex.replace('#', '')
  if (c.length !== 6) return null
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function ratio(a: string, b: string) {
  const x = lum(a), y = lum(b)
  if (x === null || y === null) return null
  const [hi, lo] = x > y ? [x, y] : [y, x]
  return (hi + 0.05) / (lo + 0.05)
}

export default function DesignSystem() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const [on, setOn] = useState(true)
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const css = getComputedStyle(document.documentElement)
    setValues(Object.fromEntries(COLORS.map(([, v]) => [v, css.getPropertyValue(v).trim()])))
    return () => { delete document.documentElement.dataset.theme }
  }, [theme])

  const pairs = useMemo(() => [
    ['Texto sobre fundo', '--ds-text', '--ds-bg'],
    ['Texto de apoio sobre superfície', '--ds-text-dim', '--ds-surface'],
    ['Texto leve sobre fundo', '--ds-text-faint', '--ds-bg'],
    ['Texto da marca sobre superfície', '--ds-brand-deep', '--ds-surface'],
    ['Erro sobre superfície', '--ds-danger', '--ds-surface'],
  ].map(([label, fg, bg]) => ({ label, r: ratio(values[fg] ?? '', values[bg] ?? '') })), [values])

  return <div className="ds-page">
    <header className="ds-head">
      <div><h1>Design system</h1><p>WinFit · tokens e componentes</p></div>
      <button type="button" className="ds-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Escuro' : 'Claro'}</button>
    </header>

    <h2>Cores</h2>
    <div className="ds-grid">{COLORS.map(([name, v]) => <div className="ds-swatch" key={v}><i style={{ background: `var(${v})` }} /><b>{name}</b><code>{v.replace('--ds-', '')} {values[v]}</code></div>)}</div>
    <h3>Contraste (mínimo 4,5:1)</h3>
    <div className="ds-card">{pairs.map((p) => <div className="ds-contrast" key={p.label}><span>{p.label}</span><b>{p.r === null ? '—' : `${p.r.toFixed(1)}:1 ${p.r >= 4.5 ? '✓' : '✗'}`}</b></div>)}</div>

    <h2>Tipografia</h2>
    <div className="ds-type">{TYPE.map(([label, v, sample]) => <div key={v}><code>{label}</code><span style={{ fontSize: `var(${v})`, lineHeight: 1.2, fontWeight: 600 }}>{sample}</span></div>)}</div>

    <h2>Espaço, raios e sombras</h2>
    <h3>Espaço · grade de 4 px</h3>
    {SPACES.map((n) => <div className="ds-space" key={n}><span className="ds-note">space-{n}</span><i style={{ width: `var(--ds-space-${n})` }} /></div>)}
    <h3>Raios</h3>
    <div className="ds-row">{RADII.map(([l, v]) => <div key={v} className="ds-radius" style={{ borderRadius: `var(${v})` }}>{l}</div>)}</div>
    <h3>Sombras</h3>
    <div className="ds-row">{['sm', 'md', 'lg'].map((s) => <div key={s} className="ds-shadow" style={{ boxShadow: `var(--ds-shadow-${s})` }}>{s}</div>)}</div>

    <h2>Botões</h2>
    <div className="ds-row">
      <Button style={{ width: 'auto' }}>Primário</Button>
      <Button variant="secondary" style={{ width: 'auto' }}>Secundário</Button>
      <Button variant="quiet" style={{ width: 'auto' }}>Discreto</Button>
      <Button variant="danger" style={{ width: 'auto' }}>Perigo</Button>
      <Button icon="plus" style={{ width: 'auto' }}>Com ícone</Button>
      <Button small style={{ width: 'auto' }}>Pequeno</Button>
      <Button disabled style={{ width: 'auto' }}>Desativado</Button>
    </div>
    <p style={{ marginTop: 8 }}>Componente <code>Button</code> (<code>src/components/ui</code>). Uma ação primária por tela. Alvo mínimo de toque: 44 px.</p>

    <h2>Selos e avisos</h2>
    <div className="ds-row">
      <Badge>Neutro</Badge><Badge tone="brand">Novo</Badge><Badge tone="success">Concluído</Badge><Badge tone="warning">Pendente</Badge><Badge tone="danger">Falhou</Badge>
    </div>
    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
      <Alert>Seus dados ficam neste aparelho.</Alert>
      <Alert tone="warning">Total parcial: 1 item sem calorias.</Alert>
      <Alert tone="danger">Não foi possível salvar. Tente de novo.</Alert>
    </div>

    <h2>Campos</h2>
    <div style={{ display: 'grid', gap: 4, maxWidth: 360 }}>
      <Field label="Alimento" placeholder="Ex.: arroz e feijão" hint="Dica opcional em texto de apoio." />
      <Field label="Peso (kg)" defaultValue="-3" error="Informe um valor maior que zero." />
    </div>
    <Card style={{ marginTop: 12 }}><Switch label="Lembrete de treino" hint="Aviso na tela Rotina" checked={on} onChange={setOn} /></Card>

    <h2>Cartão e estado vazio</h2>
    <Card><EmptyState icon="meal" title="Nenhuma refeição neste dia." /></Card>

    <h2>Ícones</h2>
    <div className="ds-row">{ICONS.map((n) => <span key={n} title={n} style={{ color: 'var(--ds-brand-deep)' }}><Icon name={n} /></span>)}</div>
  </div>
}
