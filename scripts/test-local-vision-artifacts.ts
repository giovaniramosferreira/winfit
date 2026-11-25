import assert from 'node:assert/strict'
import * as artifacts from '../src/lib/mealVisionArtifacts'
assert.equal(typeof artifacts.validateResearchArtifacts,'function','Research artifacts must be pinned before running local code')
await assert.rejects(()=>artifacts.validateResearchArtifacts(new Uint8Array([1]).buffer,new TextEncoder().encode('{}').buffer),/modelo|Modelo/)
assert.deepEqual(artifacts.rgbFromRgba(new Uint8ClampedArray([1,2,3,255,4,5,6,0]),2,1),new Uint8Array([1,2,3,4,5,6]))
assert.throws(()=>artifacts.rgbFromRgba(new Uint8ClampedArray([1,2,3]),1,1))
assert.throws(()=>artifacts.rgbFromRgba(new Uint8ClampedArray(0),0,1))
assert.equal(await artifacts.photoReviewId(new Blob(['same pixels'])),await artifacts.photoReviewId(new Blob(['same pixels'])))
assert.notEqual(await artifacts.photoReviewId(new Blob(['same pixels'])),await artifacts.photoReviewId(new Blob(['other pixels'])))
console.log('Local vision: artifact rejection and RGB tensor packing PASS')
