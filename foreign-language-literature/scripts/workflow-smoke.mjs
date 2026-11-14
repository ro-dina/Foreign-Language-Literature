import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { chromium, expect } = await import(
  process.env.PLAYWRIGHT_MODULE || '@playwright/test'
)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.setDefaultTimeout(8000)
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
let email = 'editor@example.test'
try {
  const env = await readFile(path.join(root, '.env'), 'utf8')
  const m = env.match(/^VITE_EDITOR_EMAILS\s*=\s*["']?([^"'\n]+)/m)
  if (m) email = m[1].split(',')[0].trim()
} catch {}
const user = { id: '00000000-0000-4000-8000-000000000001', email }
const output = '/tmp/reading-studio-workflow'
await mkdir(output, { recursive: true })
let cloudDraft = null,
  cloudPublication = null
await page.route('**/auth/v1/**', async (route) => {
  const url = route.request().url()
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(
      url.includes('/token')
        ? { access_token: 'test-token', refresh_token: 'test-refresh', user }
        : url.endsWith('/logout')
          ? {}
          : user
    )
  })
})
await page.route('**/rest/v1/reading_studio_*', async (route) => {
  const req = route.request(),
    pub = req.url().includes('publications')
  let record = pub ? cloudPublication : cloudDraft
  if (req.method() === 'OPTIONS')
    return route.fulfill({
      status: 200,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS'
      }
    })
  if (req.method() !== 'GET') {
    const next = req.postDataJSON()
    if (
      req.method() === 'PATCH' &&
      !req.url().includes(`revision=eq.${record?.revision}`)
    )
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
        headers: { 'access-control-allow-origin': '*' }
      })
    assert.deepEqual(
      Object.keys(next).sort(),
      req.method() === 'POST' ? ['owner_id', 'payload'] : ['payload']
    )
    record = {
      ...next,
      owner_id: next.owner_id || record.owner_id,
      revision: (record?.revision || 0) + 1,
      updated_at: new Date().toISOString()
    }
    if (pub) cloudPublication = record
    else cloudDraft = record
  }
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(record ? [record] : []),
    headers: { 'access-control-allow-origin': '*' }
  })
})
page.on('dialog', (d) => d.accept())
const log = (s) => console.log('PASS', s)
const tab = async (name) => page.getByRole('tab', { name, exact: true }).click()
const data = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('rsl-react-data')))
const manager = () =>
  page.getByRole('dialog', { name: '作品・章の管理', exact: true })
try {
  await page.goto(process.env.READING_STUDIO_URL || 'http://127.0.0.1:5173')
  const baseline = await data()
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード', { exact: true }).fill('test-only')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'ログイン', exact: true })
    .click()
  await expect(page.getByText('編集権限: あり')).toBeVisible()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '閉じる', exact: true })
    .click()
  await page.getByRole('button', { name: '教材編集', exact: true }).click()
  await expect(page.getByLabel('日本語訳', { exact: true })).toBeVisible()
  await expect(page.getByLabel('英語訳', { exact: true })).toBeVisible()
  await page
    .getByRole('button', { name: 'ecrivainを語彙編集', exact: true })
    .click()
  await expect(page.getByLabel('単語（必須）')).toHaveValue('ecrivain')
  await expect(page.getByLabel('English', { exact: true })).toHaveValue(
    'writer'
  )
  await page.getByLabel('日本語訳', { exact: true }).fill('翻訳の下書き')
  await page
    .getByRole('region', { name: '教材編集', exact: true })
    .getByRole('button', { name: '次の文 →', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'tresを語彙編集', exact: true })
    .click()
  await expect(page.getByLabel('English', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('日本語', { exact: true })).toHaveValue('')
  await page.getByLabel('日本語', { exact: true }).fill('とても')
  await page.getByLabel('品詞（任意）').fill('副詞')
  await page.getByRole('button', { name: '単語を保存', exact: true }).click()
  await expect(page.getByText('単語を保存しました。')).toBeVisible()
  await page
    .getByRole('region', { name: '教材編集', exact: true })
    .getByRole('button', { name: '← 前の文', exact: true })
    .click()
  await expect(page.getByLabel('日本語訳', { exact: true })).toHaveValue(
    '翻訳の下書き'
  )
  await page.reload()
  await page.getByRole('button', { name: '教材編集', exact: true }).click()
  await expect(page.getByLabel('日本語訳', { exact: true })).toHaveValue(
    '翻訳の下書き'
  )
  await page.getByRole('button', { name: '変更を保存', exact: true }).click()
  assert.equal(
    (await data())[0].sections[0].sentences[0].japanese,
    '翻訳の下書き'
  )
  await tab('文法')
  await expect(page.locator('.editor-original')).toBeVisible()
  await page.getByLabel('文法タイトル（必須）').fill('制作テスト')
  await page.getByLabel('詳細解説').fill('説明')
  await page.getByRole('button', { name: '文法を保存', exact: true }).click()
  await tab('構文')
  await page
    .getByLabel('構文ステップ', { exact: true })
    .fill('Maurice est un ecrivain.\nMaurice est un ecrivain meconnu.')
  await page
    .getByRole('button', { name: '変更を保存', exact: true })
    .first()
    .click()
  await page.screenshot({ path: output + '/editor-desktop.png' })
  log(
    '原文常時表示・既存/未登録語の直接登録・訳のインライン編集・文移動/再読込の下書き・構文/文法保存'
  )
  await page.locator('.editor-source-text').evaluate((el) => {
    const words = el.querySelectorAll('button')
    const first = words[0].firstChild,
      last = words[1].firstChild
    const range = document.createRange()
    range.setStart(first, 0)
    range.setEnd(last, last.textContent.length)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
  })
  await page
    .getByRole('button', { name: '選択した語句を登録', exact: true })
    .click()
  await expect(page.getByLabel('単語（必須）')).toHaveValue('Maurice Leblanc')
  await expect(page.getByLabel('日本語', { exact: true })).toHaveValue('')
  await page.getByLabel('日本語', { exact: true }).fill('モーリス・ルブラン')
  await page.getByRole('button', { name: '単語を保存', exact: true }).click()
  assert.ok(
    (await data())[0].sections[0].sentences[0].tokens.some(
      (t) => t.text === 'Maurice Leblanc'
    )
  )
  await page
    .getByRole('button', { name: '新規入力・クリア', exact: true })
    .click()
  await page.getByLabel('単語（必須）').fill('être')
  await page.getByLabel('日本語', { exact: true }).fill('である')
  await page.getByLabel('English', { exact: true }).fill('be')
  await page.getByLabel('品詞（任意）').fill('動詞')
  await page.getByRole('button', { name: '単語を保存', exact: true }).click()
  await page.getByRole('button', { name: 'estを語彙編集', exact: true }).click()
  await page.getByLabel('辞書形（任意）').fill('être')
  await page.getByLabel('日本語', { exact: true }).fill('')
  await page.getByLabel('English', { exact: true }).fill('')
  await page.getByRole('button', { name: '単語を保存', exact: true }).click()
  await page.getByRole('button', { name: '読書', exact: true }).click()
  await page.locator('.word').filter({ hasText: /^est$/ }).hover()
  await expect(page.getByRole('tooltip')).toContainText('である')
  await page.getByRole('button', { name: '教材編集', exact: true }).click()
  log(
    '範囲選択で複数語を登録・語句参照を保持・明示した辞書形の意味を読書側で参照'
  )

  await page
    .getByRole('button', { name: '作品・章を管理', exact: true })
    .click()
  await manager().getByLabel('作品名', { exact: true }).fill('制作テストの作品')
  await manager().getByLabel('著者名').fill('作者')
  await manager().getByLabel('原文言語').fill('フランス語')
  await manager()
    .getByRole('button', { name: '作品を作成', exact: true })
    .click()
  await expect(
    manager().getByRole('tab', { name: '章', exact: true })
  ).toHaveAttribute('aria-selected', 'true')
  await manager().getByLabel('章タイトル', { exact: true }).fill('空の章')
  await manager().getByRole('button', { name: '章を作成', exact: true }).click()
  await expect(
    page.locator('.chapter-link').filter({ hasText: '空の章' })
  ).toHaveCount(1)
  await tab('本文一括登録')
  await manager()
    .getByLabel('新しい章タイトル', { exact: true })
    .fill('本文の章')
  await manager()
    .getByLabel('3. 長い原文を貼り付け')
    .fill(
      'M. Leblanc est ici. « Bonjour ! » dit-il. Il part… puis revient. Fin.'
    )
  await manager()
    .getByRole('button', { name: '文に分割してプレビュー' })
    .click()
  await expect(manager().locator('.bulk-row')).toHaveCount(4)
  await manager()
    .getByRole('button', { name: '次の文と結合', exact: true })
    .first()
    .click()
  await expect(manager().locator('.bulk-row')).toHaveCount(3)
  const preview = manager().getByLabel('分割文 1', { exact: true })
  await preview.evaluate((el) => {
    el.setSelectionRange(22, 22)
  })
  await manager()
    .getByRole('button', { name: 'カーソル位置で分割', exact: true })
    .first()
    .click()
  await expect(manager().locator('.bulk-row')).toHaveCount(4)
  await manager()
    .getByRole('button', { name: '確定して登録', exact: true })
    .click()
  await expect(
    manager().getByRole('button', { name: '登録済み', exact: true })
  ).toBeDisabled()
  const created = (await data()).find((w) => w.title === '制作テストの作品')
  assert.equal(created.author, '作者')
  assert.equal(created.sections.length, 2)
  assert.equal(created.sections[1].sentences.length, 4)
  assert.equal(new Set(created.sections[1].sentences.map((x) => x.id)).size, 4)
  await manager().getByRole('button', { name: '閉じる', exact: true }).click()
  await expect(
    page.locator('.chapter-link').filter({ hasText: '本文の章' })
  ).toHaveCount(1)
  log(
    '新規作品/著者/章・空の章・本文一括登録・結合/再分割・固定ID・二重登録防止・ライブラリ反映'
  )
  await page
    .getByRole('button', { name: '作品・章を管理', exact: true })
    .click()
  await tab('作品')
  await manager()
    .getByRole('button', { name: '制作テストの作品を上へ', exact: true })
    .click()
  assert.equal((await data())[1].title, '制作テストの作品')
  await tab('章')
  await manager()
    .getByRole('button', { name: '本文の章を上へ', exact: true })
    .click()
  assert.equal(
    (await data()).find((w) => w.title === '制作テストの作品').sections[0]
      .title,
    '本文の章'
  )
  const firstLi = manager().locator('.manager-list li').first()
  await firstLi.getByRole('button', { name: '削除', exact: true }).click()
  assert.equal(
    (await data()).find((w) => w.title === '制作テストの作品').sections.length,
    1
  )
  await tab('データ保護')
  await manager()
    .getByRole('button', { name: '直前の保護コピーから復元', exact: true })
    .click()
  assert.equal(
    (await data()).find((w) => w.title === '制作テストの作品').sections.length,
    2
  )
  await manager().getByRole('button', { name: '閉じる', exact: true }).click()
  log('作品/章の並び替え・確認付き削除・保護コピーからの復元')
  await page.getByRole('button', { name: '保存と共有', exact: true }).click()
  const cloud = page.getByRole('dialog', { name: '保存と共有', exact: true })
  await cloud
    .getByRole('button', { name: 'Supabaseの状態を確認', exact: true })
    .click()
  await expect(
    cloud.getByText(
      'クラウドの状態を取得しました。ローカルの教材は変更していません。'
    )
  ).toBeVisible()
  await cloud
    .getByRole('button', { name: 'Supabaseに保存（非公開）', exact: true })
    .click()
  await expect(cloud.getByText(/Supabaseへ非公開で保存しました/)).toBeVisible()
  assert.ok(cloudDraft)
  assert.equal(cloudPublication, null)
  await cloud
    .getByRole('button', { name: '保存済みの版を共有する', exact: true })
    .click()
  await expect(cloud.getByText(/共有版を更新しました/)).toBeVisible()
  assert.deepEqual(cloudPublication.payload, cloudDraft.payload)
  cloudDraft = { ...cloudDraft, revision: cloudDraft.revision + 1 }
  await cloud
    .getByRole('button', { name: 'Supabaseに保存（非公開）', exact: true })
    .click()
  await expect(cloud.getByRole('alert')).toContainText('内容が変更された')
  assert.equal(cloudDraft.revision, 2)
  await cloud.getByRole('button', { name: '閉じる', exact: true }).click()
  log('モックAPIで非公開保存と共有版を分離・明示共有・版競合の上書き防止')
  await page.getByRole('button', { name: 'アカウント', exact: true }).click()
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '閉じる', exact: true })
    .click()
  await expect(page.locator('.reader-heading h1')).toBeVisible()
  const after = await data()
  assert.equal(after.length, 3)
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード', { exact: true }).fill('test')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'ログイン', exact: true })
    .click()
  await expect(page.getByText('編集権限: あり')).toBeVisible()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '閉じる', exact: true })
    .click()
  await page.getByRole('button', { name: '教材編集', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 900 })
  await page.screenshot({ path: output + '/editor-mobile.png' })
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    390
  )
  await page
    .getByRole('button', { name: 'ライブラリ', exact: false })
    .first()
    .click()
  await page
    .getByRole('button', { name: '作品・章を管理', exact: true })
    .click()
  await page.screenshot({ path: output + '/manager-mobile.png' })
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    390
  )
  assert.equal((await data())[0].id, baseline[0].id)
  assert.deepEqual(errors, [])
  log(
    'ログアウト/再ログイン後も教材維持・既存ID互換・スマートフォン編集/管理・未処理例外なし'
  )
  await manager().getByRole('button', { name: '閉じる', exact: true }).click()
  const beforeBackup = await data()
  const beforeDrafts = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('rsl-react-editor-drafts'))
  )
  await page.locator('#library .backup-menu summary').click()
  const downloadPromise = page.waitForEvent('download')
  await page
    .locator('#library')
    .getByRole('button', { name: '書き出し', exact: true })
    .click()
  const download = await downloadPromise
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'))
  assert.deepEqual(backup.data, beforeBackup)
  assert.ok(backup.drafts)
  assert.equal(backup.auth, undefined)
  assert.equal(JSON.stringify(backup).includes('test-token'), false)
  const legacy = structuredClone(backup)
  delete legacy.drafts
  delete legacy.vocabularyDrafts
  delete legacy.bulkDraft
  legacy.data[0].title = '復元の互換性検証'
  await page.locator('#library input[type=file]').setInputFiles({
    name: 'legacy-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy))
  })
  await expect
    .poll(async () => (await data())[0].title)
    .toBe('復元の互換性検証')
  assert.deepEqual(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('rsl-react-editor-drafts'))
    ),
    beforeDrafts
  )
  await page
    .getByRole('button', { name: '作品・章を管理', exact: true })
    .click()
  await tab('データ保護')
  await manager()
    .getByRole('button', { name: '直前の保護コピーから復元', exact: true })
    .click()
  assert.deepEqual(await data(), beforeBackup)
  await manager().getByRole('button', { name: '閉じる', exact: true }).click()
  log(
    '下書きを含むJSONバックアップ・旧形式の復元・既存下書き保持・復元前の保護コピー'
  )
  console.log('Screenshots:', output)
} catch (e) {
  console.error(e)
  await page.screenshot({ path: output + '/failure.png' }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
