import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/home', label: 'Hoje' },
  { to: '/progress', label: 'Progresso' },
  { to: '/library', label: 'Atlas' },
  { to: '/profile', label: 'Perfil' },
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
