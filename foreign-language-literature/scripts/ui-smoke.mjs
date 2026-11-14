// Optional browser regression suite. Install @playwright/test separately; see README.
import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { chromium, expect } = await import(
  process.env.PLAYWRIGHT_MODULE || '@playwright/test'
)
const base = process.env.READING_STUDIO_URL || 'http://127.0.0.1:5173'
const output =
  process.env.READING_STUDIO_SCREENSHOTS || '/tmp/reading-studio-phase1'
await mkdir(output, { recursive: true })
let email = 'editor@example.test'
try {
  const env = await readFile(path.join(root, '.env'), 'utf8')
  const match = env.match(/^VITE_EDITOR_EMAILS\s*=\s*["']?([^"'\n]+)/m)
  if (match) email = match[1].split(',')[0].trim()
} catch {
  /* Test account is only used in mocked authentication. */
}
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } })
page.setDefaultTimeout(8000)
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const log = (label) => console.log('PASS', label)
const panel = () => page.locator('#study-panel')
const editor = () => page.getByRole('region', { name: '教材編集', exact: true })
const chooseTab = async (name) =>
  page.getByRole('tab', { name, exact: true }).click()
try {
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request()
    const user = { id: '00000000-0000-4000-8000-000000000001', email }
    if (request.method() === 'OPTIONS')
      return route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*'
        }
      })
    const body = request.url().includes('/token')
      ? {
          access_token: 'ui-test-token',
          refresh_token: 'ui-test-refresh',
          user
        }
      : request.url().endsWith('/logout')
        ? {}
        : user
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
      headers: { 'access-control-allow-origin': '*' }
    })
  })
  await page.goto(base)
  await expect(page.locator('.reader-heading h1')).toContainText('ルパン')
  const initialData = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('rsl-react-data'))
  )
  await page.screenshot({ path: path.join(output, 'desktop-study.png') })
  await page.getByRole('button', { name: '次の文 →', exact: true }).click()
  await expect(page.locator('.reading-sentence .source')).toHaveText(
    initialData[0].sections[0].sentences[1].source
  )
  await page.locator('#reading-main').focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.reading-sentence .source')).toHaveText(
    initialData[0].sections[0].sentences[0].source
  )
  log('前後の文・キーボード移動・欠落のない原文')
  await chooseTab('構文')
  await page.getByRole('button', { name: '付け加える →' }).click()
  await expect(page.locator('.build-added').first()).toHaveText('meconnu.')
  await page.locator('.all-steps summary').click()
  await expect(page.locator('.all-steps li')).toHaveText(
    initialData[0].sections[0].sentences[0].buildUp
  )
  await chooseTab(/^文法/)
  await panel().locator('.grammar-entry summary').first().click()
  await expect(panel().getByText('対象語句: est')).toBeVisible()
  await chooseTab(/^語彙/)
  await panel().locator('.vocab-entry summary').first().click()
  await panel().getByRole('button', { name: '苦手に登録' }).click()
  await expect(
    panel().getByRole('button', { name: '苦手を解除' })
  ).toBeVisible()
  await page.getByRole('button', { name: '既読にする', exact: true }).click()
  log('構文の全ステップ・文法・語彙・苦手/既読フラグ')
  await chooseTab('翻訳')
  await panel().getByRole('button', { name: '英語 OFF' }).click()
  await expect(page.locator('.inline-translations [lang=en]')).toBeVisible()
  await panel().getByRole('button', { name: '日本語 ON' }).click()
  await expect(page.locator('.inline-translations [lang=ja]')).toHaveCount(0)
  await page.getByRole('button', { name: /^Reading/ }).click()
  await expect(panel()).toHaveCount(0)
  await expect(page.locator('.reading-sentence')).toHaveCount(2)
  await expect(page.locator('.inline-translations')).toHaveCount(0)
  await page.screenshot({ path: path.join(output, 'desktop-reading.png') })
  await page.locator('.reading-sentence .source').last().press('Enter')
  await expect(panel()).toBeVisible()
  await expect(page.locator('.reading-sentence.selected .source')).toHaveText(
    initialData[0].sections[0].sentences[1].source
  )
  log('翻訳の独立切替・Reading/Study・文から解説を開く')
  await page.getByRole('searchbox', { name: '作品横断検索' }).fill('рассмеялся')
  await page.locator('.search-hit').click()
  await expect(page.locator('.reader-heading h1')).toHaveText(
    'カラマーゾフの兄弟'
  )
  await page.getByRole('searchbox', { name: '作品横断検索' }).fill('')
  await page.locator('.work-card').first().click()
  await page.getByRole('button', { name: /^Study/ }).click()
  await expect(page.locator('.chapter-link.active')).toBeVisible()
  log('作品・章選択と作品横断検索')
  // Confirm that browsing does not rewrite the material.
  assert.deepEqual(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('rsl-react-data'))
    ),
    initialData
  )
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await page.getByLabel('メールアドレス').fill(email)
  await page
    .getByLabel('パスワード', { exact: true })
    .fill('test-only-password')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'ログイン', exact: true })
    .click()
  await expect(page.getByText('編集権限: あり')).toBeVisible()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '閉じる', exact: true })
    .click()
  await page.reload()
  assert.ok(
    (
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('rsl-react-progress')).weak
      )
    ).length > 0
  )
  await page.getByRole('button', { name: 'アカウント', exact: true }).click()
  await expect(page.getByText('編集権限: あり')).toBeVisible()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '閉じる', exact: true })
    .click()
  await page.getByRole('button', { name: '教材編集', exact: true }).click()
  await expect(editor()).toBeVisible()
  log('認証APIモックによるログイン・再読込後の認証維持・編集権限')
  await page.getByLabel('原文（フランス語・必須）').fill('未保存の下書き A')
  await page.locator('.sentence-list button').nth(1).click()
  await expect(page.getByLabel('原文（フランス語・必須）')).toHaveValue(
    initialData[0].sections[0].sentences[1].source
  )
  await page.getByLabel('原文（フランス語・必須）').fill('未保存の下書き B')
  await page.locator('.sentence-list button').first().click()
  await expect(page.getByLabel('原文（フランス語・必須）')).toHaveValue(
    '未保存の下書き A'
  )
  await page.reload()
  await page.getByRole('button', { name: '教材編集', exact: true }).click()
  await expect(page.getByLabel('原文（フランス語・必須）')).toHaveValue(
    '未保存の下書き A'
  )
  await page
    .getByLabel('原文（フランス語・必須）')
    .fill(initialData[0].sections[0].sentences[0].source)
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '変更を保存', exact: true }).click()
  await expect(
    page.getByText('本文・翻訳・構文・備考を保存しました。')
  ).toBeVisible()
  assert.deepEqual(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('rsl-react-data'))[0].sections[0]
          .sentences[0].tokens
    ),
    initialData[0].sections[0].sentences[0].tokens
  )
  await page.getByLabel('日本語訳', { exact: true }).fill('保存する訳')
  await page.getByRole('button', { name: '変更を保存', exact: true }).click()
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('rsl-react-data'))[0].sections[0]
          .sentences[0].japanese
    ),
    '保存する訳'
  )
  await chooseTab('語彙')
  await page.getByLabel('単語（必須）').fill('est')
  await page.getByLabel('English', { exact: true }).fill('is (edited)')
  await page.getByLabel('日本語', { exact: true }).fill('である')
  await page.getByRole('button', { name: '単語を保存', exact: true }).click()
  await expect(page.getByText('単語を保存しました。')).toBeVisible()
  await chooseTab('文法')
  await page.getByLabel('文法タイトル（必須）').fill('テスト活用')
  await page
    .getByLabel('活用表・文法表')
    .fill('人称 | 数 | être\n1 | 単 | suis\n2 | 単 | es')
  await page.getByRole('button', { name: '文法を保存', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'テスト活用', exact: false }).first()
  ).toBeVisible()
  await chooseTab('＋ 新規文')
  await page.getByLabel('新しい原文（必須）').fill('Test new sentence.')
  await page
    .getByRole('button', { name: '新しい文を追加', exact: true })
    .click()
  await expect(page.getByLabel('原文（フランス語・必須）')).toHaveValue(
    'Test new sentence.'
  )
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('rsl-react-data'))[0].sections[0]
          .sentences[1].source
    ),
    'Test new sentence.'
  )
  await page.screenshot({ path: path.join(output, 'desktop-editor.png') })
  log(
    '文別の下書き切替/再起動復元・本文/訳/辞書/文法の保存・注釈保持・直後への追加'
  )
  await page.getByRole('button', { name: '読書', exact: true }).click()
  await page
    .getByRole('button', { name: 'ダークモードにする', exact: true })
    .click()
  await page.screenshot({ path: path.join(output, 'desktop-dark.png') })
  await page
    .getByRole('button', { name: 'ライトモードにする', exact: true })
    .click()
  for (const width of [834, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.locator('#library')).toHaveCount(0)
    await expect(panel()).toHaveCount(0)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      width
    )
    await page.getByRole('button', { name: '解説を開く', exact: true }).click()
    await expect(panel()).toBeVisible()
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      width
    )
    await page.screenshot({ path: path.join(output, `${width}-panel.png`) })
    await page.keyboard.press('Escape')
    await page
      .getByRole('button', { name: 'ライブラリ', exact: false })
      .first()
      .click()
    await expect(page.locator('#library')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.screenshot({ path: path.join(output, `${width}-reader.png`) })
    await page.getByRole('button', { name: '教材編集', exact: true }).click()
    await chooseTab('語彙')
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      width
    )
    await page.screenshot({ path: path.join(output, `${width}-editor.png`) })
    await page.getByRole('button', { name: '読書', exact: true }).click()
  }
  log(
    '1440/834/390/320px・ダークモード・ドロワーと下部パネル・横スクロールなし'
  )
  const longPage = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  })
  const fixture = structuredClone(initialData)
  fixture[0].sections.push({
    id: 'qa-chapter',
    title: '検証用の章',
    description: 'テストブラウザ内のみに存在',
    sentences: Array.from({ length: 30 }, (_, i) => ({
      ...structuredClone(initialData[0].sections[0].sentences[0]),
      id: 'qa-' + i,
      label: '文 ' + i,
      source:
        'Sentence ' + i + '. ' + initialData[0].sections[0].sentences[0].source
    }))
  })
  await longPage.addInitScript((data) => {
    if (!localStorage.getItem('qa-initialized')) {
      localStorage.setItem('rsl-react-data', JSON.stringify(data))
      localStorage.setItem('qa-initialized', '1')
    }
  }, fixture)
  await longPage.goto(base)
  await longPage.locator('.chapter-link').last().click()
  await expect(longPage.locator('.reader-heading h2')).toHaveText('検証用の章')
  await longPage.getByRole('button', { name: /^Reading/ }).click()
  await expect(longPage.locator('.reading-sentence')).toHaveCount(30)
  await longPage.locator('#reading-main').evaluate((el) => {
    el.scrollTop = 1200
  })
  await longPage.waitForFunction(() =>
    Object.values(
      JSON.parse(localStorage.getItem('rsl-react-scroll') || '{}')
    ).some((value) => value > 1000)
  )
  await longPage.getByRole('button', { name: 'ダークモードにする' }).click()
  assert.ok(
    (await longPage.locator('#reading-main').evaluate((el) => el.scrollTop)) >
      1000
  )
  await longPage.reload()
  await expect(longPage.locator('.reader-heading h2')).toHaveText('検証用の章')
  await expect
    .poll(() =>
      longPage.locator('#reading-main').evaluate((el) => el.scrollTop)
    )
    .toBeGreaterThan(1000)
  await longPage.locator('.reading-sentence .source').nth(12).press('Enter')
  await expect(
    longPage.locator('.reading-sentence.selected .source')
  ).toContainText('Sentence 12.')
  await longPage.reload()
  await expect(
    longPage.locator('.reading-sentence.selected .source')
  ).toContainText('Sentence 12.')
  await longPage.close()
  log('複数章・30文の長文・テーマ変更時/再読込後の読書位置保持')
  assert.deepEqual(errors, [])
  log('ブラウザの未処理例外なし')
  console.log('Screenshots:', output)
} catch (error) {
  await page
    .screenshot({ path: path.join(output, 'failure.png') })
    .catch(() => {})
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
}
