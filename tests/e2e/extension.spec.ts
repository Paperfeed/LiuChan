import { createServer, Server } from 'node:http'
import path from 'node:path'

import { chromium, BrowserContext, expect, test } from '@playwright/test'

let context: BrowserContext
let extensionId: string
let server: Server
let pageUrl: string
let extensionWorker: any

test.beforeAll(async () => {
  const extensionPath = path.resolve('.output/chrome-mv3')
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  })
  server = createServer((_request, response) => {
    response.setHeader('content-type', 'text/html; charset=utf-8')
    response.end(
      '<main><span id="word">你好世界</span><input value="中文輸入" /><span id="right-word" style="position:absolute;right:0;top:80px">你好</span></main>'
    )
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('Test server did not start')
  pageUrl = `http://127.0.0.1:${address.port}`

  // MV3 workers start on demand. Loading an eligible page lets the content
  // script send its initialization message and wake the background worker.
  const bootstrapPage = await context.newPage()
  await bootstrapPage.goto(pageUrl)
  let worker = context.serviceWorkers()[0]
  worker ??= await context.waitForEvent('serviceworker')
  extensionWorker = worker
  extensionId = new URL(worker.url()).host
  await bootstrapPage.close()
})

test.afterAll(async () => {
  await context?.close()
  if (server)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
})

test('shows a dictionary popup over Chinese page text', async () => {
  const page = await context.newPage()
  await page.goto(pageUrl)
  await page.waitForFunction(() =>
    Boolean(
      document
        .querySelector('liuchan-popup')
        ?.shadowRoot?.querySelector('#liuchan-popup')
    )
  )
  const word = page.locator('#word')
  await word.hover({ position: { x: 3, y: 8 } })
  const popup = page.locator('liuchan-popup').locator('.liuchan')
  await expect(popup).toContainText(/hello|you/i, { timeout: 15_000 })
  const entries = page.locator('liuchan-popup').locator('.entry')
  await expect(entries).not.toHaveCount(1)
  const [popupBox, entryBox] = await Promise.all([
    page.locator('liuchan-popup').locator('.liuchan').boundingBox(),
    entries.first().boundingBox(),
  ])
  expect(
    Math.abs((popupBox?.width ?? 0) - (entryBox?.width ?? 0))
  ).toBeLessThanOrEqual(4)
  await extensionWorker.evaluate(() => {
    ;(globalThis as any).__liuchanSpoken = []
    ;(globalThis as any).chrome.tts.speak = (text: string, options?: any) => {
      ;(globalThis as any).__liuchanSpoken.push(text)
      options?.onEvent?.({ charIndex: text.length, type: 'end' })
    }
  })
  await page.keyboard.press('t')
  await expect
    .poll(() =>
      extensionWorker.evaluate(() => (globalThis as any).__liuchanSpoken)
    )
    .toContain('你好')

  const popupPositioner = popup.locator('..')
  await page.keyboard.press('y')
  await expect
    .poll(() => popupPositioner.evaluate((element) => element.style.transform))
    .toContain('translateY(20px)')
  await page.locator('#right-word').hover({ position: { x: 3, y: 8 } })
  await expect
    .poll(() => popupPositioner.evaluate((element) => element.style.transform))
    .toContain('translateY(0px)')
})

test('keeps the popup inside a narrow viewport without page overflow', async () => {
  const page = await context.newPage()
  await page.setViewportSize({ height: 600, width: 320 })
  await page.goto(pageUrl)
  await page.waitForFunction(() =>
    Boolean(document.querySelector('liuchan-popup')?.shadowRoot)
  )
  await page.locator('#right-word').hover({ position: { x: 3, y: 8 } })
  const popup = page.locator('liuchan-popup').locator('.liuchan')
  await expect(popup).toBeVisible({ timeout: 15_000 })
  const box = await popup.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(320)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(320)
})

test('opens the complete options page', async () => {
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/options.html`)
  await expect(
    page.getByRole('heading', { name: 'LiuChan settings' })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Check for updates' })
  ).toBeVisible()
  await expect(page.getByText('Show popup modifier:')).toBeVisible()
  await expect(page.getByLabel('Theme:').locator('option')).toHaveText([
    'Charcoal',
    'Liuchan',
    'Paper',
    'Pleco',
    'Sepia',
  ])
  await expect(page.getByText('LiuChan Popup Dictionary')).toBeVisible()
  await expect(page.getByText('flowing (of speech, writing)')).toBeVisible()
  await expect(page.getByText('pop-up window (computing)')).toBeVisible()
  await expect(
    page.getByText('dictionary (of Chinese compound words)')
  ).toBeVisible()
  await expect(page.getByText('Alternate popup location')).toBeVisible()
  const tonePicker = page.getByRole('button', { name: 'Choose tone 1' })
  await tonePicker.hover()
  await expect(page.getByRole('button', { name: 'Reset' })).toBeHidden()
  await tonePicker.click()
  await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible()
})

test('downloads and activates current upstream dictionary data', async () => {
  test.setTimeout(120_000)
  test.skip(
    !process.env.LIUCHAN_TEST_LIVE_UPDATE,
    'Runs only during an explicit live-source check'
  )
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/options.html`)
  await page.getByRole('button', { name: 'Check for updates' }).click()
  await expect(page.getByRole('status')).toContainText('updated successfully', {
    timeout: 90_000,
  })
})
