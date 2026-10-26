# Fine workout dial — validation

## Request and behavior

Replace repeated plus/minus taps with a continuous gesture. Slow horizontal movement offers fine load adjustment; faster movement accelerates continuously. Direct number entry accepts hundredths such as 7.25 kg. Repetitions and timed seconds remain integers. Load cannot go below zero; reps/seconds cannot go below one.

The ruler supports pointer capture, cancellation, keyboard arrows (0.1 kg or one rep/second), Shift for larger keyboard changes, and Home for the minimum. Inputs are labeled and the form rejects empty, negative or fractional rep values. No production dependency added.

## Evidence

- RED checkpoint `7221c54`: `npm exec --yes --package=tsx -- tsx scripts/test-number-dial.ts` failed because the requested dial implementation did not yet exist.
- GREEN: the same test passes, including precise typed weights, fractional-motion accumulation, acceleration, nonfinite values, bounds and integer rounding.
- Coverage: `npm exec --yes --package=tsx --package=c8 -- c8 --include=src/lib/numberDial.ts --reporter=text tsx scripts/test-number-dial.ts` reported 100% statements, branches, functions and lines for the calculation module. This is not whole-app/component coverage.
- Browser: `node scripts/test-number-dial-browser.cjs` against local Vite passes with real Chrome and touch events via CDP at 390×844 and a 320×568 layout check. Set `WINFIT_PLAYWRIGHT` to a Playwright module path if not installed locally; `PW_CHANNEL` defaults to chrome. `WINFIT_SCREENSHOT` optionally saves a preview.
- Browser checks: keyboard fine increments; slow touch adds 0.1 kg; fast swipe travels farther and retains capture outside the track; 7.25 kg/12 reps saved; editing changes the same set; empty weight and fractional reps block saving; typed 7.255 normalizes visibly to 7.26; no horizontal overflow at 320px; bodyweight omits load; plank records 41 seconds; no page errors.
- `npm exec --yes --package=tsx -- tsx scripts/test-exercise-navigation.ts` passes.
- `npm run build` and `git diff --check` pass.

## Review and limits

Independent review identified typed values with more than two decimal places showing a different number than saved. Normalization on blur fixes it, with browser regression coverage. React review checked event/ref handling, functional editor updates, input labeling and keyboard support.

Preview visually inspected at 390px. No visual baseline exists, so this is not a visual regression pass. No physical iPhone/Safari, VoiceOver, or full WCAG audit performed. Existing moderate React Router audit findings remain outside this feature. Gesture feel should be tried on the user's actual phone after approval.

Self-evaluation: accuracy 4/5 (Chrome verified; Safari not tested), completeness 4/5 (device feel pending), clarity 4/5 (gesture and typing hints visible; validate wording in use), actionability 4/5 (PR ready for approval), conciseness 4/5 (small shared control; event code could be split if reused). Overall 4.0/5. Highest-value next check: hands-on iPhone gesture and keyboard behavior. These limits are explicit for the reviewer.
