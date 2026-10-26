# Exercise navigation validation

Journeys derived from the request: navigate directly and backward/forward during a workout without losing sets or rest; resume a skipped exercise by recording a set; ignore invalid indices.

Command: `npm exec --yes --package=tsx -- tsx scripts/test-exercise-navigation.ts`.

- RED checkpoint `251af03`: test executed and failed with `true !== false` on resuming a skipped exercise. Navigation preservation and invalid-index assertions passed before that assertion.
- GREEN: the same command passed after `logSet` cleared the registered exercise's skipped flag. Output: `Exercise navigation: sets, rest, boundaries and skipped exercise return OK`.
- `npm run build` passed; `git diff --check` passed.

The regression checks first/last/arbitrary indices, round trips, unchanged logs and rest deadline, negative/out-of-range/fractional/nonfinite indices, and recording a set after returning to a skipped exercise.

Limits: no automated coverage percentage measured; no visual browser/mobile validation. `npm audit --omit=dev` found two existing moderate React Router vulnerabilities. Dependency updates are outside this patch.
