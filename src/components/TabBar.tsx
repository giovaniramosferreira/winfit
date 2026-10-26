import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/home', label: 'Início', icon: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9' },
  { to: '/progress', label: 'Progresso', icon: 'M4 4v16h16M7 15l4-5 4 2 5-7' },
  { to: '/library', label: 'Biblioteca', icon: 'M4 4h6v16H4zM14 4h6v16h-6zM7 8v4M17 8v4' },
  { to: '/profile', label: 'Perfil', icon: 'M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 21v-2a8 8 0 0 1 16 0v2' },
]

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
