import { spawnSync } from 'node:child_process'

const suites = [
  'test-google-oauth.ts', 'test-sprite-motion.ts', 'test-precache-integrity.ts', 'test-illustration-pilots.ts', 'test-illustrations.ts',
  'test-generator.ts', 'test-home-workout.ts', 'test-calisthenics.ts', 'test-watch-sync.ts',
  'test-exercise-navigation.ts', 'test-number-dial.ts', 'test-undo-set.ts',
  'test-backup.ts', 'test-application-backup.ts', 'test-cloud-sync.ts', 'test-workout-storage.ts', 'test-privacy.cjs',
  'test-pelvic-timer.ts', 'test-pelvic-store.ts', 'test-session-modules.tsx',
  'test-routine.ts', 'test-session-history.ts', 'test-bodyweight-progress.ts',
  'test-assistant-context.ts', 'test-nutrition.cjs', 'test-meal-analysis.cjs', 'test-assistant-api.cjs',
]
let failures = 0
for (const suite of suites) {
  process.stdout.write(`\n${suite}\n`)
  const result = spawnSync(process.execPath, [...(suite.endsWith('.cjs') ? [] : ['--import', 'tsx']), `scripts/${suite}`], { stdio: 'inherit' })
  if (result.status !== 0) failures++
}
process.stdout.write(`\n${suites.length - failures}/${suites.length} suites passed\n`)
process.exitCode = failures ? 1 : 0
