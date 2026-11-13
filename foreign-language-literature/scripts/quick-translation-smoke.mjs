import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
const { chromium, expect } = await import(
  process.env.PLAYWRIGHT_MODULE || '@playwright/test'
)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const base = process.env.READING_STUDIO_URL || 'http://127.0.0.1:5173'
const output = '/tmp/reading-studio-quick-translation'
await mkdir(output, { recursive: true })
const errors = []
const sentence = {
  id: 'q1',
  label: 'クイック翻訳の検証',
  source:
    'Maurice Leblanc était connu pour prendre soin de ses livres inconnus.',
  english: 'Test sentence.',
  japanese: 'テスト用の文。',
  tokens: [
    { text: 'Maurice', ja: 'モーリス' },
    {
      text: 'Maurice Leblanc',
      ja: 'モーリス・ルブラン',
      en: 'Maurice Leblanc',
      origin: '表示しない語源の解説',
      grammarRefs: ['g-name']
    },
    { text: 'était', ja: '〜だった', en: 'was', grammarRefs: ['g-etre'] },
    {
      text: 'prendre soin de',
      ja: '〜を大切にする',
      en: 'to take care of',
      origin: '表示しない長い解説'
    },
    { text: 'ses', ja: '彼の', en: 'his' },
    { text: 'livres', ja: '元の訳', en: 'books', gender: 'm' },
    { text: 'inconnus' }
  ],
  buildUp: ['Maurice Leblanc était connu.'],
  notes: ['備考'],
  grammar: [
    {
      id: 'g-etre',
      type: 'conjugation',
      title: 'être の活用',
      body: 'était は半過去。'
    }
  ]
}
const fixture = [
  {
    id: 'quick-test',
    title: '検証用の作品',
    sourceLanguage: 'フランス語',
    sections: [
      {
        id: 'sec',
        title: '検証用の章',
        sentences: [
          sentence,
          {
            ...sentence,
            id: 'q2',
            source: 'était inconnu.',
            tokens: [
              {
                text: 'était',
                ja: '〜だった',
                en: 'was',
                grammarRefs: ['g-etre']
              },
              { text: 'inconnu' }
            ]
          }
        ]
      }
    ]
  }
]
async function seed(context, readMode = 'study') {
  await context.addInitScript(
    ({ fixture, readMode }) => {
      if (localStorage.getItem('quick-test-seeded')) return
      localStorage.setItem('rsl-react-data', JSON.stringify(fixture))
      localStorage.setItem(
        'rsl-react-dict',
        JSON.stringify({
          'フランス語::livres': {
            sourceLanguage: 'フランス語',
            token: 'livres',
            ja: '書物',
            en: 'books',
            gender: 'm',
            origin: '表示しない語源',
            grammarRefs: []
          }
        })
      )
      localStorage.setItem(
        'rsl-react-ui',
        JSON.stringify({ readMode, bookShowJapanese: false })
      )
      localStorage.setItem('quick-test-seeded', '1')
    },
    { fixture, readMode }
  )
}
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } })
page.setDefaultTimeout(7000)
page.on('pageerror', (e) => errors.push(e.message))
const pick = (text, p = page) =>
  p.getByRole('button', { name: text, exact: true })
const popup = (p = page) => p.locator('.quick-translation')
async function mode(value, p = page) {
  await p.locator('.display-options summary').click()
  await p.getByLabel('単語クイック翻訳', { exact: true }).selectOption(value)
  await p.locator('.display-options summary').click()
}
try {
  await seed(page.context())
  await page.goto(base)
  await page
    .locator('#study-panel')
    .getByRole('button', { name: '解説を閉じる' })
    .click()
  const before = await page.locator('.reading-sentence .source').boundingBox()
  await pick('prendre soin de').hover()
  await page.waitForTimeout(100)
  await expect(popup()).toHaveCount(0)
  await expect(page.getByRole('tooltip')).toBeVisible()
  await expect(popup()).toContainText('〜を大切にする')
  await expect(popup()).not.toContainText('to take care of')
  await expect(popup()).not.toContainText('表示しない')
  await expect(page.locator('#study-panel')).toHaveCount(0)
  assert.equal(
    await page.locator('.reading-sentence').getAttribute('aria-label'),
    '文 1'
  )
  assert.deepEqual(
    await page.locator('.reading-sentence .source').boundingBox(),
    before
  )
  await page.screenshot({ path: output + '/desktop-hover.png' })
  console.log(
    'PASS 遅延ホバー・日本語優先・複数語表現・原文レイアウト不変・詳細パネル独立'
  )
  await page.mouse.move(1300, 900)
  await expect(popup()).toHaveCount(0)
  await pick('prendre soin de').hover()
  await page.waitForTimeout(80)
  await page.mouse.move(1300, 900)
  await page.waitForTimeout(350)
  await expect(popup()).toHaveCount(0)
  await pick('livres').hover()
  await expect(popup()).toContainText('書物')
  await pick('livres').click()
  await expect(popup()).toHaveCount(0)
  await expect(page.locator('#study-panel')).toBeVisible()
  await expect(page.locator('[data-vocab="livres"]')).toHaveAttribute(
    'open',
    ''
  )
  console.log(
    'PASS 通過時は表示しない・共通辞書を利用・PCクリックは従来どおり詳細'
  )
  await page
    .locator('#study-panel')
    .getByRole('button', { name: '解説を閉じる' })
    .click()
  await pick('Maurice Leblanc').focus()
  await page.keyboard.press('Tab')
  await expect(popup()).toContainText('〜だった')
  await page.keyboard.press('Escape')
  await expect(popup()).toHaveCount(0)
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(popup()).toContainText('〜だった')
  await page.keyboard.press('Enter')
  await expect(page.locator('#study-panel')).toBeVisible()
  await expect(popup()).toHaveCount(0)
  await page
    .locator('#study-panel')
    .getByRole('button', { name: '解説を閉じる' })
    .click()
  console.log('PASS キーボードフォーカス・Escape・Enterで詳細')
  await mode('en')
  await pick('était').hover()
  await expect(popup()).toContainText('was')
  await expect(popup()).not.toContainText('〜だった')
  await mode('both')
  await pick('était').hover()
  await expect(popup()).toContainText('was')
  await expect(popup()).toContainText('〜だった')
  await page.reload()
  await pick('était').hover()
  await expect(popup()).toContainText('was')
  await expect(popup()).toContainText('〜だった')
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('rsl-react-ui')).quickTranslation
    ),
    'both'
  )
  await page
    .locator('#study-panel')
    .getByRole('button', { name: '解説を閉じる' })
    .click()
  await mode('off')
  await pick('était').hover()
  await page.waitForTimeout(400)
  await expect(popup()).toHaveCount(0)
  await pick('était').click()
  await expect(page.locator('#study-panel')).toBeVisible()
  await page
    .locator('#study-panel')
    .getByRole('button', { name: '解説を閉じる' })
    .click()
  await mode('ja')
  await pick('inconnus').hover()
  await expect(popup()).toContainText('日本語訳は未登録です')
  console.log(
    'PASS 設定4種類と再読込後の保持・OFFでも詳細を維持・未登録を捏造しない'
  )
  for (const placement of ['top', 'bottom']) {
    await page.mouse.move(1300, 900)
    await expect(popup()).toHaveCount(0)
    await pick('était').evaluate((el, placement) => {
      el.setAttribute(
        'style',
        `position:fixed;z-index:20;${placement === 'bottom' ? 'left:1px;top:1px' : 'right:1px;bottom:1px'}`
      )
    }, placement)
    await pick('était').hover()
    await expect(popup()).toBeVisible()
    await expect(popup()).toHaveAttribute('data-placement', placement)
    const box = await popup().boundingBox()
    assert.ok(
      box.x >= 9 &&
        box.y >= 9 &&
        box.x + box.width <= 1431 &&
        box.y + box.height <= 971
    )
    await page.screenshot({ path: output + `/edge-${placement}.png` })
    await page.mouse.move(700, 600)
    await pick('était').evaluate((el) => el.removeAttribute('style'))
  }
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect(popup()).toHaveCount(0)
  console.log('PASS 上下左右の画面端・ウィンドウ離脱時の終了')
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  })
  await seed(mobile, 'reading')
  const touch = await mobile.newPage()
  touch.setDefaultTimeout(7000)
  touch.on('pageerror', (e) => errors.push(e.message))
  await touch.goto(base)
  await pick('prendre soin de', touch).tap()
  await expect(
    touch.getByRole('dialog', { name: 'prendre soin deのクイック翻訳' })
  ).toBeVisible()
  await expect(popup(touch)).toContainText('〜を大切にする')
  await expect(touch.locator('#study-panel')).toHaveCount(0)
  const touchBox = await popup(touch).boundingBox()
  assert.ok(touchBox.x >= 9 && touchBox.x + touchBox.width <= 381)
  await touch.screenshot({ path: output + '/mobile-tap.png' })
  await touch.getByRole('button', { name: '詳しく見る →' }).tap()
  await expect(popup(touch)).toHaveCount(0)
  await expect(touch.locator('#study-panel')).toBeVisible()
  await expect(touch.locator('[data-vocab="prendre soin de"]')).toHaveAttribute(
    'open',
    ''
  )
  assert.ok((await touch.locator('#study-panel').boundingBox()).height < 844)
  await touch
    .locator('#study-panel')
    .getByRole('button', { name: '解説を閉じる' })
    .tap()
  await pick('était', touch).last().tap()
  await expect(popup(touch)).toContainText('〜だった')
  await expect(touch.locator('.reading-sentence.selected')).toHaveAttribute(
    'id',
    'sentence-q2'
  )
  await touch.getByRole('button', { name: '詳しく見る →' }).tap()
  await touch
    .locator('#study-panel')
    .getByRole('button', { name: 'g-etre', exact: true })
    .tap()
  await expect(touch.locator('[data-grammar="g-etre"]')).toHaveAttribute(
    'open',
    ''
  )
  await touch
    .locator('#study-panel')
    .getByRole('button', { name: '解説を閉じる' })
    .tap()
  await mode('off', touch)
  await pick('était', touch).last().tap()
  await expect(touch.locator('#study-panel')).toBeVisible()
  await expect(popup(touch)).toHaveCount(0)
  console.log(
    'PASS 実タッチのクイック表示・別の文の活用形・明示操作で詳細・文法参照・OFFの互換性'
  )
  assert.deepEqual(errors, [])
  assert.deepEqual(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('rsl-react-data'))
    ),
    fixture
  )
  console.log('PASS 教材データ変更なし・ブラウザ未処理例外なし')
  console.log('Screenshots:', output)
  await mobile.close()
} catch (error) {
  console.error(error)
  await page.screenshot({ path: output + '/failure.png' }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
