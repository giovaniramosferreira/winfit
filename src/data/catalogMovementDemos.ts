import type { Exercise, SlotType } from '../types'
import type { MovementDemo, MovementPose } from './movementDemos'

// Poses originais por padrão, com adaptações explícitas para apoios e aparelhos.
const upright: MovementPose = {
  head: [149, 30], torso: '150,47 152,96', arm: '150,51 139,91 133,132', otherArm: '150,51 165,91 169,132',
  leg: '152,96 141,125 134,157', otherLeg: '152,96 171,126 180,157',
}
const sitting: MovementPose = {
  head: [121, 38], torso: '125,55 137,113', arm: '125,59 152,87 172,108', otherArm: '125,59 160,89 182,110',
  leg: '137,113 190,119 193,157', otherLeg: '137,113 200,119 207,157',
}
const lying: MovementPose = {
  head: [70, 112], torso: '91,125 172,125', arm: '91,125 106,92 119,64', otherArm: '91,125 119,96 134,68',
  leg: '172,125 217,128 233,157', otherLeg: '172,125 226,128 247,157',
}
const bent: MovementPose = {
  head: [97, 79], torso: '118,88 183,102', arm: '118,88 119,121 120,152', otherArm: '118,88 135,121 139,151',
  leg: '183,102 165,130 154,157', otherLeg: '183,102 198,129 214,157',
}
const squat: MovementPose = { ...upright, head: [126,65], torso: '136,82 175,113', arm: '136,85 124,121 120,149', otherArm: '136,85 143,120 145,149', leg: '175,113 132,120 134,157', otherLeg: '175,113 174,132 180,157' }
const overhead: MovementPose = { ...upright, arm: '150,51 130,26 140,8', otherArm: '150,51 173,27 168,8' }
const curl: MovementPose = { ...upright, arm: '150,51 139,91 107,64', otherArm: '150,51 165,91 135,61' }
const pressStart: MovementPose = { ...upright, arm: '150,51 115,75 115,40', otherArm: '150,51 185,75 185,40' }
const armsAhead: MovementPose = { ...upright, arm: '150,51 181,66 215,67', otherArm: '150,51 182,77 215,79' }
const rowEnd: MovementPose = { ...bent, arm: '118,88 162,89 150,110', otherArm: '118,88 175,95 163,115' }

const patterns: Partial<Record<SlotType, [MovementPose, MovementPose]>> = {
  push_h_comp: [lying, { ...lying, arm: '91,125 94,85 97,43', otherArm: '91,125 109,88 113,47' }],
  push_v_comp: [pressStart, overhead],
  pull_h_comp: [bent, rowEnd],
  pull_v_comp: [{ ...sitting, arm: '125,59 123,32 121,8', otherArm: '125,59 144,32 146,8' }, { ...sitting, arm: '125,59 103,93 119,67', otherArm: '125,59 142,96 148,72' }],
  knee_comp: [upright, squat],
  hip_comp: [upright, { ...bent, head: [96,89], torso: '117,101 183,96' }],
  lower_uni: [{ ...upright, leg: '152,96 127,127 104,157', otherLeg: '152,96 196,125 229,157' }, { ...upright, head: [149,57], torso: '150,74 152,123', arm: '150,78 139,114 133,150', otherArm: '150,78 165,114 169,150', leg: '152,123 105,119 104,157', otherLeg: '152,123 192,153 229,157' }],
  iso_peito: [{ ...upright, arm: '150,51 106,65 68,80', otherArm: '150,51 194,65 231,80' }, armsAhead],
  iso_ombro_lat: [upright, { ...upright, arm: '150,51 110,49 69,48', otherArm: '150,51 191,49 232,48' }],
  iso_ombro_post: [{ ...bent, arm: '118,88 121,120 124,151', otherArm: '118,88 135,121 142,151' }, { ...bent, arm: '118,88 86,98 52,108', otherArm: '118,88 153,71 188,53' }],
  iso_biceps: [upright, curl],
  iso_triceps: [curl, upright],
  iso_posterior: [{ ...lying, arm: '91,125 65,139 40,140', otherArm: '91,125 70,129 50,130', leg: '172,125 215,125 259,125', otherLeg: '172,125 222,125 266,125' }, { ...lying, arm: '91,125 65,139 40,140', otherArm: '91,125 70,129 50,130', leg: '172,125 215,125 233,82', otherLeg: '172,125 222,125 241,87' }],
  iso_quad: [sitting, { ...sitting, leg: '137,113 190,119 234,119', otherLeg: '137,113 200,119 246,119' }],
  iso_gluteo: [upright, { ...upright, otherLeg: '152,96 196,125 239,142' }],
  iso_panturrilha: [upright, { ...upright, toeSupport: 'both', head: [149,21], torso: '150,38 152,87', arm: '150,42 139,82 133,123', otherArm: '150,42 165,82 169,123', leg: '152,87 141,116 134,148', otherLeg: '152,87 171,117 180,148' }],
}

export function catalogMovementDemo(exercise: Exercise): MovementDemo {
  const pair = patterns[exercise.slotTypes[0]] ?? [armsAhead, upright]
  let start = pair[0], end = pair[1]
  const equipment: NonNullable<MovementDemo['equipment']> = {}
  if (exercise.equipment.includes('barra')) equipment.load = 'barbell'
  if (exercise.equipment.includes('halteres')) equipment.load = 'dumbbells'
  if (exercise.equipment.includes('kettlebell')) equipment.load = 'kettlebell'
  if (exercise.equipment.includes('maquinas')) equipment.machine = true
  if (exercise.equipment.includes('banco')) equipment.bench = [56, 142, 156]
  if (exercise.equipment.includes('elasticos')) { equipment.band = true; equipment.anchor = [148, 160] }
  if (exercise.equipment.includes('polia')) { equipment.anchor = [284, 18]; equipment.machine = true }
  const demo: MovementDemo = { start, end, cue: exercise.instructions[1] ?? exercise.instructions[0], view: 'Vista do movimento', equipment }

  switch (exercise.id) {
    case 'agachamento-barra':
      equipment.at = 'shoulders'
      start = { ...upright, arm: '150,51 138,72 133,51', otherArm: '150,51 176,72 170,51' }
      end = { ...squat, arm: '136,85 124,107 119,85', otherArm: '136,85 162,107 156,85' }
      break
    case 'agachamento-goblet': case 'agachamento-kettlebell':
      equipment.singleLoad = true
      start = { ...upright, arm: '150,51 122,78 143,68', otherArm: '150,51 132,84 150,71' }
      end = { ...squat, arm: '136,85 108,111 129,101', otherArm: '136,85 119,115 137,103' }
      break
    case 'supino-maquina': case 'supino-elastico':
      start = { ...sitting, arm: '125,59 113,97 147,77', otherArm: '125,59 135,101 157,81' }
      end = { ...sitting, arm: '125,59 165,65 206,73', otherArm: '125,59 173,72 215,81' }
      equipment.bench = [107, 125, 64]
      if (equipment.band) equipment.anchor = [105, 72]
      if (exercise.id === 'supino-elastico') {
        start = { ...upright, arm: '150,51 133,86 166,68', otherArm: '150,51 153,91 178,77' }
        end = armsAhead; equipment.bench = undefined; equipment.anchor = [139, 60]
      }
      break
    case 'desenvolvimento-maquina': equipment.bench = [117, 110, 68]; break
    case 'remada-maquina': case 'remada-baixa-polia': case 'remada-elastico':
      start = { ...sitting, arm: '125,59 166,76 208,91', otherArm: '125,59 172,83 218,97' }
      end = { ...sitting, arm: '125,59 115,104 149,101', otherArm: '125,59 136,110 163,108' }
      equipment.bench = [105, 125, 80]; equipment.anchor = [278, 91]
      if (exercise.id === 'remada-elastico') {
        const base = { head: [105,60] as [number, number], torso: '112,77 133,148', leg: '133,148 192,148 248,154', otherLeg: '133,148 200,153 259,157' }
        start = { ...start, ...base, arm: '112,81 154,98 195,114', otherArm: '112,81 164,105 207,122' }
        end = { ...start, arm: '112,81 103,117 143,127', otherArm: '112,81 117,125 153,133' }
        equipment.bench = undefined; equipment.anchor = [253, 155]
      }
      break
    case 'remada-serrote':
      start = { ...bent, otherArm: '118,88 154,108 180,130', otherLeg: '183,102 225,130 263,130' }
      end = { ...start, arm: rowEnd.arm }
      equipment.bench = [167, 137, 105]; equipment.singleLoad = true
      break
    case 'barra-fixa': case 'elevacao-pernas-barra':
      start = { ...upright, head: [149,65], torso: '150,82 152,123', arm: '150,82 127,43 115,15', otherArm: '150,82 175,43 185,15', leg: '152,123 145,145 145,161', otherLeg: '152,123 163,145 165,161' }
      end = exercise.id === 'barra-fixa'
        ? { ...start, head: [149,21], torso: '150,38 152,88', arm: '150,38 116,64 115,15', otherArm: '150,38 184,64 185,15', leg: '152,88 145,117 145,145', otherLeg: '152,88 163,117 165,145' }
        : { ...start, leg: '152,123 190,113 228,104', otherLeg: '152,123 197,118 235,110' }
      equipment.bar = true
      break
    case 'puxada-elastico': equipment.anchor = [128, 7]; break
    case 'leg-press':
      start = { ...lying, arm: '91,125 117,137 143,140', otherArm: '91,125 125,132 149,135', leg: '172,125 158,81 211,67', otherLeg: '172,125 168,88 221,74' }
      end = { ...start, leg: '172,125 200,87 231,47', otherLeg: '172,125 210,94 241,54' }
      equipment.bench = [60, 142, 128]
      break
    case 'crucifixo-halteres':
      start = { ...lying, arm: '91,125 117,137 158,131', otherArm: '91,125 66,137 29,131' }
      end = { ...lying, arm: '91,125 97,86 104,49', otherArm: '91,125 107,87 116,51' }
      break
    case 'crucifixo-elastico': equipment.anchor = [128, 57]; break
    case 'crossover-polia': equipment.anchor = [35, 25]; break
    case 'face-pull':
      start = armsAhead
      end = { ...upright, arm: '150,51 181,50 162,29', otherArm: '150,51 192,59 174,35' }
      equipment.anchor = [279, 45]
      break
    case 'band-pull-apart':
      start = armsAhead; end = patterns.iso_ombro_lat![1]; equipment.anchor = undefined; equipment.loopAt = 'hands'
      break
    case 'triceps-elastico': equipment.anchor = [120, 9]; break
    case 'rosca-polia': case 'elevacao-lateral-polia': equipment.anchor = [275, 157]; break
    case 'rosca-alternada': end = { ...curl, otherArm: upright.otherArm }; break
    case 'rosca-martelo': equipment.loadRotation = 90; break
    case 'triceps-frances-halter':
      start = { ...overhead, arm: '150,51 143,17 121,41', otherArm: '150,51 165,17 141,41' }; end = overhead
      equipment.singleLoad = true
      break
    case 'hip-thrust-barra':
      start = { ...lying, torso: '91,108 172,145', head: [70,94], arm: '91,108 128,123 172,145', otherArm: '91,108 134,116 181,141', leg: '172,145 217,119 233,157', otherLeg: '172,145 226,119 247,157' }
      end = { ...start, torso: '91,108 172,105', arm: '91,108 130,97 172,105', otherArm: '91,108 135,91 181,101', leg: '172,105 217,119 233,157', otherLeg: '172,105 226,119 247,157' }
      equipment.at = 'hip'; equipment.bench = [58, 122, 50]
      break
    case 'swing-kettlebell': start = bent; end = armsAhead; break
    case 'bulgaro':
      start = { ...start, otherLeg: '152,96 195,120 230,124' }; end = { ...end, otherLeg: '152,123 195,146 230,124' }
      equipment.bench = [218, 130, 70]
      break
    case 'step-up':
      start = { ...upright, leg: '152,96 111,98 112,125' }
      end = { ...upright, head: [119,18], torso: '120,35 121,76', leg: '121,76 115,101 112,125', otherLeg: '121,76 157,102 173,130' }
      equipment.bench = [85, 133, 64]
      break
    case 'triceps-banco':
      start = { ...sitting, head: [128,55], torso: '131,72 149,123', arm: '131,72 107,99 91,124', otherArm: '131,72 118,99 103,124', leg: '149,123 196,143 242,157', otherLeg: '149,123 203,143 251,157' }
      end = { ...start, head: [128,82], torso: '131,99 149,150', arm: '131,99 112,128 91,124', otherArm: '131,99 128,127 103,124', leg: '149,150 196,153 242,157', otherLeg: '149,150 203,153 251,157' }
      equipment.bench = [48, 133, 63]
      break
    case 'flexora-deslizante':
      start = { ...lying, arm: '91,125 125,145 157,154', otherArm: '91,125 130,140 162,150', leg: '172,125 216,143 259,155', otherLeg: '172,125 224,143 269,155' }
      end = { ...start, torso: '91,125 161,108', leg: '161,108 191,110 218,155', otherLeg: '161,108 202,110 230,155' }; equipment.bench = undefined
      break
    case 'mesa-flexora': equipment.bench = [54, 140, 208]; break
    case 'cadeira-extensora': equipment.bench = [111, 126, 60]; break
    case 'flexora-elastico':
      start = upright; end = { ...upright, otherLeg: '152,96 171,126 205,105' }
      equipment.anchor = [279, 153]; equipment.anchorAt = 'feet'
      break
    case 'abducao-maquina':
      start = sitting; end = { ...sitting, leg: '137,113 104,128 88,157', otherLeg: '137,113 203,128 222,157' }; equipment.bench = [110, 125, 60]
      break
    case 'abducao-elastico':
      start = { ...upright, head: [149,50], torso: '150,67 152,116', arm: '150,71 126,92 150,90', otherArm: '150,71 170,92 156,90', leg: '152,116 129,136 123,157', otherLeg: '152,116 174,136 182,157' }
      end = { ...start, otherLeg: '152,116 196,136 224,157' }; equipment.anchor = undefined; equipment.loopAt = 'knees'
      break
    case 'coice-polia': start = upright; end = { ...upright, otherLeg: '152,96 205,107 252,123' }; equipment.anchor = [55, 153]; equipment.anchorAt = 'feet'; break
    case 'panturrilha-corporal':
      start = { ...upright, otherLeg: '152,96 171,126 192,101', arm: '150,51 120,62 90,62' }
      end = { ...patterns.iso_panturrilha![1], toeSupport: 'leg', otherLeg: '152,87 171,117 192,92', arm: '150,42 119,52 90,62' }
      equipment.anchor = undefined; equipment.bench = [125, 163, 28]; equipment.handSupport = [90, 62]
      break
    case 'panturrilha-halteres': equipment.bench = [125, 163, 70]; break
    case 'pallof-press':
      start = { ...upright, arm: '150,51 128,77 157,72', otherArm: '150,51 139,84 165,79' }; end = armsAhead; equipment.anchor = [45, 70]
      break
    case 'flexao-inclinada':
      start = { head: [101,58], torso: '121,72 190,105', arm: '121,72 114,99 106,125', otherArm: '121,72 128,99 120,125', leg: '190,105 222,131 252,157', otherLeg: '190,105 230,131 263,157' }
      end = { ...start, head: [93,97], torso: '113,111 184,130', arm: '113,111 135,115 106,125', otherArm: '113,111 146,119 120,125', leg: '184,130 220,143 252,157', otherLeg: '184,130 228,143 263,157' }; equipment.bench = [74, 134, 72]
      break
    case 'flexao-declinada':
      start = { head: [81,71], torso: '103,84 181,80', arm: '103,84 108,120 112,157', otherArm: '103,84 123,122 128,157', leg: '181,80 219,97 257,114', otherLeg: '181,80 225,97 267,114' }
      end = { ...start, head: [89,119], torso: '110,132 183,112', arm: '110,132 135,144 112,157', otherArm: '110,132 148,145 128,157', leg: '183,112 219,113 257,114', otherLeg: '183,112 225,113 267,114' }; equipment.bench = [241, 124, 60]
      break
    case 'remada-toalha':
      start = { ...upright, head: [151,42], torso: '161,60 200,106', arm: '161,60 119,68 77,76', otherArm: '161,60 126,80 87,84', leg: '200,106 227,132 252,157', otherLeg: '200,106 238,132 264,157' }
      end = { ...start, head: [117,24], torso: '128,42 178,85', arm: '128,42 104,69 77,76', otherArm: '128,42 115,80 87,84', leg: '178,85 218,122 252,157', otherLeg: '178,85 230,122 264,157' }; equipment.anchor = [40, 65]; equipment.band = true
      break
  }
  return { ...demo, start, end }
}
