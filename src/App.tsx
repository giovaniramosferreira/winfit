import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import Intro from './pages/Intro'
import Onboarding from './pages/Onboarding'
import Preview from './pages/Preview'
import Home from './pages/Home'
import Player from './pages/Player'
import Summary from './pages/Summary'
import Progress from './pages/Progress'
import ExerciseDetail from './pages/ExerciseDetail'
import Library from './pages/Library'
import Profile from './pages/Profile'
import Programs from './pages/Programs'
import TabBar from './components/TabBar'
import MiniBar from './components/MiniBar'

export default function App() {
  const profile = useStore((s) => s.profile)
  const plan = useStore((s) => s.plan)
  const quickStart = useStore((s) => s.quickStart)
  const loc = useLocation()

  const onboarded = profile !== null && plan !== null

  // Abrir o app cai direto no treino do dia: sem plano, semeia o programa padrão.
  // O onboarding continua em /onboarding para recalibrar o perfil quando quiser.
  useEffect(() => {
    if (!onboarded) quickStart()
  }, [onboarded, quickStart])

  const inPlayer = loc.pathname === '/player'
  const inFlow = ['/intro', '/onboarding', '/preview'].includes(loc.pathname)

  if (!onboarded) return <div className="app-shell" />

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/intro" element={<Intro />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/home" element={<Home />} />
        <Route path="/player" element={<Player />} />
        <Route path="/summary/:id" element={<Summary />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/exercise/:id" element={<ExerciseDetail />} />
        <Route path="/library" element={<Library />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      {!inPlayer && !inFlow && !loc.pathname.startsWith('/summary') && (
        <>
          <MiniBar />
          <TabBar />
        </>
      )}
    </div>
  )
}
