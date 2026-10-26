const assert = require('node:assert/strict')
const { chromium } = require(process.env.WINFIT_PLAYWRIGHT || 'playwright')

async function run() {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const errors = []
    await page.addInitScript(() => {
      window.__qaPath = (path) => performance.getEntriesByType('resource').filter((resource) => new URL(resource.name).pathname === path).at(-1)?.name || path
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(process.env.WINFIT_URL || 'http://127.0.0.1:5173/')
    await page.locator('.app-shell').waitFor()
    await page.evaluate(async () => {
      const { useStore } = await import(window.__qaPath('/src/lib/store.ts'))
      useStore.getState().completeOnboarding({
        goal: 'hypertrophy', experience: 'intermediate', currentState: 'active',
        location: 'gym_full', equipment: [], frequency: 4, sessionTimeMin: 45,
        limitations: [], biometrics: {}, version: 1,
      })
      useStore.getState().startSession(useStore.getState().plan.days[0].id)
    })
    await page.goto(`${process.env.WINFIT_URL || 'http://127.0.0.1:5173/'}#/player`)
    await page.locator('.player').waitFor({ timeout: 5000 }).catch(async (error) => {
      console.error(await page.locator('body').innerText())
      console.error(errors)
      throw error
    })
    await page.locator('.set-row.current .set-cell').first().click()
    const weight = page.getByLabel('Carga (kg)', { exact: true })
    const reps = page.getByLabel('Repetições', { exact: true })
    const track = page.getByRole('spinbutton', { name: 'Ajustar Carga (kg)', exact: true })
    const weightValue = async (expected) => {
      await page.waitForFunction(({ id, expected }) => document.getElementById(id)?.value === expected,
        { id: await weight.getAttribute('id'), expected })
    }
    await weight.fill('7.25')
    await reps.fill('12')
    await track.focus()
    await page.keyboard.press('ArrowRight')
    await weightValue('7.35')
    assert.equal(await weight.inputValue(), '7.35', 'Keyboard supports fine adjustment')
    await page.keyboard.press('ArrowLeft')
    await weightValue('7.25')
    assert.equal(await weight.inputValue(), '7.25')

    const box = await track.boundingBox()
    const cdp = await page.context().newCDPSession(page)
    const touch = async (type, x) => cdp.send('Input.dispatchTouchEvent', {
      type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: box.y + 25 }],
    })
    const x = box.x + box.width / 2
    await touch('touchStart', x)
    for (let i = 1; i <= 8; i++) {
      await page.waitForTimeout(40)
      await touch('touchMove', x + i)
    }
    await touch('touchEnd', x + 8)
    await weightValue('7.35')
    assert.equal(Number(await weight.inputValue()), 7.35, 'Slow touch drag adds only 0.1 kg')
    // Swipe beyond the control to exercise pointer capture, then release.
    await touch('touchStart', x)
    await touch('touchMove', box.x + box.width + 20)
    await touch('touchEnd', box.x + box.width + 20)
    assert.ok(Number(await weight.inputValue()) > 7.35)

    await weight.fill('7.255')
    await reps.focus()
    await weightValue('7.26')
    await weight.fill('7.25')
    await reps.fill('12.5')
    await page.getByRole('button', { name: 'Registrar série', exact: true }).click()
    assert.equal(await page.locator('form.modal').count(), 1, 'Fractional reps cannot be submitted')
    await reps.fill('12')
    await weight.fill('')
    await page.getByRole('button', { name: 'Registrar série', exact: true }).click()
    assert.equal(await page.locator('form.modal').count(), 1, 'Empty weight cannot be submitted')
    await weight.fill('7.25')
    await reps.focus()
    await page.getByRole('heading', { name: 'Série 1', exact: true }).click()
    if (process.env.WINFIT_SCREENSHOT) await page.screenshot({ path: process.env.WINFIT_SCREENSHOT })
    await page.getByRole('button', { name: 'Registrar série', exact: true }).click()
    const logged = await page.evaluate(async () => {
      const { useStore } = await import(window.__qaPath('/src/lib/store.ts'))
      return useStore.getState().activeSession.logs[0]
    })
    assert.equal(logged.weight, 7.25)
    assert.equal(logged.reps, 12)
    await page.locator('.set-cell.done').first().click()
    await weight.fill('8.15')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    assert.equal(await page.locator('form.modal').count(), 0)
    const edited = await page.evaluate(async () => {
      const { useStore } = await import(window.__qaPath('/src/lib/store.ts'))
      return useStore.getState().activeSession.logs
    })
    assert.equal(edited.length, 1, 'Editing does not add another set')
    assert.equal(edited[0].weight, 8.15)
    await page.setViewportSize({ width: 320, height: 568 })
    await page.locator('.set-cell.done').first().click()
    await page.getByRole('button', { name: 'Salvar', exact: true }).scrollIntoViewIfNeeded()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow')
    await page.evaluate(async () => {
      const { useStore } = await import(window.__qaPath('/src/lib/store.ts'))
      const session = useStore.getState().activeSession
      useStore.setState({ activeSession: { ...session, currentIndex: 0, logs: [],
        exercises: [{ ...session.exercises[0], exerciseId: 'prancha' }] } })
    })
    await page.reload()
    await page.locator('.set-row.current .set-cell').first().click()
    assert.equal(await page.getByLabel('Carga (kg)', { exact: true }).count(), 0, 'Bodyweight has no load dial')
    const seconds = page.getByLabel('Segundos', { exact: true })
    await seconds.fill('41')
    await page.getByRole('button', { name: 'Registrar série', exact: true }).click()
    const timed = await page.evaluate(async () => {
      const { useStore } = await import(window.__qaPath('/src/lib/store.ts'))
      return useStore.getState().activeSession.logs[0]
    })
    assert.equal(timed.reps, 41, 'Timed exercise supports single-second precision')
    assert.deepEqual(errors, [])
    console.log('Browser: touch drag, capture, keyboard, exact input, validation, logging, editing and 320px layout OK')
  } finally {
    await browser.close()
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1 })
