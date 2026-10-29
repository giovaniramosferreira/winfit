import { EXERCISE_ILLUSTRATIONS } from '../data/exerciseIllustrations'
import { spriteMotion } from '../lib/spriteMotion'

type ModuleId = 'gym' | 'home' | 'pelvic' | 'nutrition'

const photographs: Record<ModuleId, string> = {
  gym: 'gym-photo',
  home: 'calisthenics-photo',
  pelvic: 'breathing-photo',
  nutrition: 'nutrition-plate',
}

/** Decorative photographs: adjacent link text supplies the accessible name. */
export default function HomeArtwork({ module }: { module: ModuleId }) {
  if (module === 'gym' || module === 'home') {
    const art = EXERCISE_ILLUSTRATIONS[module === 'gym' ? 'agachamento-barra' : 'flexao']
    const motion = art.motion ? spriteMotion(art.motion) : null
    return <div className={`home-module-art home-module-art-${module}`} aria-hidden="true">
      <span className="home-art-orbit" />
      {motion && <style>{motion.keyframes}</style>}
      <div className="home-exercise-motion" style={{
        aspectRatio: art.aspectRatio,
        backgroundImage: `url(${art.sprite})`,
        ...(motion ? { backgroundSize: motion.backgroundSize, animationName: motion.name, animationDuration: motion.duration } : {}),
      }} />
    </div>
  }
  return <div className={`home-module-art home-module-art-${module} home-module-art-photo`} aria-hidden="true">
    <img className="home-module-photo" src={`/media/home/${photographs[module]}.webp`} width="960" height="960" alt="" />
  </div>
}
