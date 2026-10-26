const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename)
const disk = new Map()
let blocked = false
let storageEvent
global.window = { addEventListener: (type, listener) => { if (type === 'storage') storageEvent = listener } }
global.localStorage = { getItem: (key) => disk.get(key) ?? null, setItem: (key, value) => { if (blocked) throw Error('quota'); disk.set(key, value) }, removeItem: (key) => disk.delete(key) }
const { privacy, watchAllowed } = require('../src/lib/privacy.ts')
const relay = 'https://relay.invalid'
assert.equal(watchAllowed(relay), false)
privacy.setWatchDestination(relay)
assert.equal(watchAllowed(relay), true)
let notifications = 0
privacy.subscribe(() => notifications++)
storageEvent({ key: 'winfit-privacy-v1', newValue: JSON.stringify({ watchDestination: null }) })
assert.equal(watchAllowed(relay), false, 'Revocation in another tab is honored')
privacy.setWatchDestination(relay)
blocked = true
privacy.setWatchDestination(null)
assert.equal(disk.has('winfit-privacy-v1'), false, 'Quota fallback removes persisted consent')
assert.equal(watchAllowed(relay), false)
assert.ok(notifications >= 3)
console.log('Privacy: default off, cross-tab revocation and quota fallback OK')
