import { NavLink, useLocation } from 'react-router-dom'
import Icon, { type IconName } from './Icon'

const tabs: { to: string; label: string; icon: IconName; also?: string[] }[] = [
  { to: '/home', label: 'Início', icon: 'home' },
  { to: '/training', label: 'Treinar', icon: 'dumbbell', also: ['/calisthenics', '/circuit'] },
  { to: '/progress', label: 'Progresso', icon: 'chart' },
  { to: '/library', label: 'Exercícios', icon: 'book', also: ['/exercise'] },
  { to: '/profile', label: 'Perfil', icon: 'user' },
]

export default function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {tabs.map((t) => {
        const on = pathname === t.to || !!t.also?.some((p) => pathname.startsWith(p))
        return <NavLink key={t.to} to={t.to} className={on ? 'active' : ''} aria-current={on ? 'page' : undefined}>
          <Icon name={t.icon} size={21} />
          {t.label}
        </NavLink>
      })}
    </nav>
  )
}
