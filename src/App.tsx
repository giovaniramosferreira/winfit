import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Preview from './pages/Preview'
import Home from './pages/Home'
import Player from './pages/Player'
import Summary from './pages/Summary'
import Progress from './pages/Progress'
import ExerciseDetail from './pages/ExerciseDetail'
import Library from './pages/Library'
import Profile from './pages/Profile'
import TabBar from './components/TabBar'
import MiniBar from './components/MiniBar'
import PwaToasts from './components/PwaToasts'
import AuthProvider from './components/AuthProvider'
import Training from './pages/Training'
import Nutrition from './pages/Nutrition'
import Pelvic from './pages/Pelvic'
import Routine from './pages/Routine'
import Assistant from './pages/Assistant'
import SessionDetail from './pages/SessionDetail'
import WorkoutStorageNotice from './components/WorkoutStorageNotice'

export default function App() {
  const profile = useStore((s) => s.profile)
  const plan = useStore((s) => s.plan)
  const hasActiveSession = useStore((s) => s.activeSession !== null)
  const loc = useLocation()

  const onboarded = profile !== null && plan !== null
  const inPlayer = loc.pathname === '/player'
  const inFlow = ['/', '/login', '/onboarding', '/preview'].includes(loc.pathname)
  const isLanding = loc.pathname === '/'

  return (
    <AuthProvider><div className={`app-shell${isLanding ? ' wide' : ' product-shell'}${loc.pathname === '/home' ? ' home-shell' : ''}${hasActiveSession ? ' with-active-session' : ''}`}>
      <PwaToasts />
      <WorkoutStorageNotice />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/home" element={onboarded ? <Home /> : <Navigate to="/" replace />} />
        <Route path="/training" element={onboarded ? <Training mode="gym" /> : <Navigate to="/" replace />} />
        <Route path="/calisthenics" element={onboarded ? <Training mode="home" /> : <Navigate to="/" replace />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/pelvic" element={<Pelvic />} />
        <Route path="/routine" element={<Routine />} />
        <Route path="/assistant" element={onboarded ? <Assistant /> : <Navigate to="/" replace />} />
        <Route path="/session/:id" element={<SessionDetail />} />
        <Route path="/player" element={<Player />} />
        <Route path="/summary/:id" element={<Summary />} />
        <Route path="/progress" element={onboarded ? <Progress /> : <Navigate to="/" replace />} />
        <Route path="/exercise/:id" element={<ExerciseDetail />} />
        <Route path="/library" element={onboarded ? <Library /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={onboarded ? <Profile /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {onboarded && !inPlayer && !inFlow && !loc.pathname.startsWith('/summary') && (
        <>
          {loc.pathname !== '/home' && <MiniBar />}
          <TabBar />
        </>
      )}
    </div></AuthProvider>
  )
}
