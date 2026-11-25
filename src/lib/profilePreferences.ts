import { EQUIP_LABEL } from '../data/exercises'
import type { Equipment, TrainingProfile } from '../types'

/** Rebuild only equipment preferences; never discard goals, limitations or biometrics. */
export function profileWithEquipment(profile: TrainingProfile, location: TrainingProfile['location'], selected: Equipment[]): TrainingProfile {
  const equipment: Equipment[] = location === 'gym_full' ? Object.keys(EQUIP_LABEL) as Equipment[] : location === 'home_none' ? ['peso_corporal'] : [...new Set([...selected, 'peso_corporal' as Equipment])]
  return { ...profile, location, equipment }
}
