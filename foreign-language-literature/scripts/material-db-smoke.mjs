// Isolated PostgreSQL only. There is deliberately no URL, env-file or network client.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const { PGlite } = await import(
  process.env.PGLITE_MODULE || '@electric-sql/pglite'
)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const db = new PGlite()
const original = await readFile(
  path.join(root, 'supabase/material-workflow.sql'),
  'utf8'
)
const setup = await readFile(
  path.join(root, 'scripts/fixtures/material-db-setup.sql'),
  'utf8'
)
const owner = '00000000-0000-4000-8000-000000000001',
  other = '00000000-0000-4000-8000-000000000002',
  viewer = '00000000-0000-4000-8000-000000000003'
const exampleSentence = {
  id: 'sentence',
  label: 'Il est.',
  source: 'Il est.',
  english: 'He is.',
  japanese: '彼はいる。',
  tokens: [
    {
      text: 'est',
      en: 'is',
      ja: 'いる',
      lemma: 'être',
      partOfSpeech: '動詞',
      gender: '',
      grammarRefs: ['g']
    }
  ],
  buildUp: ['Il est.'],
  notes: ['教材の備考'],
  grammar: [
    {
      id: 'g',
      title: '文法',
      body: '解説',
      type: 'grammar',
      tags: ['動詞'],
      tableRows: [
        ['形', '意味'],
        ['est', 'いる']
      ]
    }
  ]
}
const payload = {
  version: 1,
  data: [
    {
      id: 'legacy-string-work',
      title: 'Livre',
      author: 'Auteur',
      sourceLanguage: 'fr',
      sections: [
        { id: 'section', title: 'Chapitre', sentences: [exampleSentence] }
      ]
    }
  ],
  dict: {
    'fr::est': {
      sourceLanguage: 'fr',
      token: 'est',
      en: 'is',
      ja: 'いる',
      origin: '語源',
      gender: '',
      grammarRefs: ['g'],
      lemma: 'être',
      partOfSpeech: '動詞'
    }
  }
}
const fingerprint = async () =>
  (
    await db.query(
      "select md5(pg_get_functiondef(p.oid)||E'\\n'||r.rolname||E'\\n'||coalesce(p.proacl::text,'<default>')) as hash from pg_proc p join pg_roles r on r.oid=p.proowner where p.oid='public.is_editor()'::regprocedure"
    )
  ).rows[0].hash
const unchanged = async () => ({
  legacy: (await db.query('select * from public.legacy_material')).rows,
  editors: (
    await db.query('select * from public.editor_accounts order by "userId"')
  ).rows,
  func: (
    await db.query(
      "select pg_get_functiondef(p.oid) as definition,proacl,proowner::regrole::text as owner from pg_proc p where p.oid='public.is_editor()'::regprocedure"
    )
  ).rows,
  acl: (
    await db.query(
      "select relname,relacl,relrowsecurity from pg_class where oid in ('public.editor_accounts'::regclass,'public.legacy_material'::regclass) order by relname"
    )
  ).rows
})
async function actor(id, fn, role = 'authenticated') {
  await db.exec('begin')
  try {
    await db.exec(`set local role ${role}`)
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id])
    const result = await fn()
    await db.exec('rollback')
    return result
  } catch (e) {
    await db.exec('rollback')
    throw e
  }
}
const table = 'public.reading_studio_drafts',
  pub = 'public.reading_studio_publications'
const insert = (t, id, p = payload) =>
  db.query(
    `insert into ${t}(owner_id,payload) values ($1,$2::jsonb) returning *`,
    [id, JSON.stringify(p)]
  )
const expectDenied = async (fn, label) => {
  await assert.rejects(
    fn,
    (e) => e.code === '42501' || e.code === '23514',
    label
  )
  console.log('PASS', label)
}
try {
  await db.exec(setup)
  const before = await unchanged()
  await assert.rejects(() => db.exec(original), /STOP/)
  await db.exec('rollback')
  assert.equal(
    (await db.query("select to_regclass('public.reading_studio_drafts') as t"))
      .rows[0].t,
    null
  )
  console.log('PASS 未レビューの本番関数ハッシュなら、作成前に停止')
  const sql = original.replace(
    '__REVIEWED_IS_EDITOR_FINGERPRINT__',
    await fingerprint()
  )
  await db.exec(sql)
  assert.deepEqual(await unchanged(), before)
  console.log('PASS 既存の行・関数定義・所有者・権限・既存RLSを変更しない')
  await db.exec('begin')
  await db.exec('set local role authenticated')
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [owner])
  const created = await insert(table, owner)
  const published = await insert(pub, owner)
  await db.exec('commit')
  assert.equal(created.rows[0].revision, 1)
  assert.equal(published.rows[0].revision, 1)
  await actor(owner, async () => {
    assert.equal((await db.query(`select * from ${table}`)).rows.length, 1)
    assert.equal(
      (
        await db.query(
          `update ${table} set payload=$1 where revision=1 returning *`,
          [JSON.stringify(payload)]
        )
      ).rows.length,
      1
    )
  })
  await actor(other, async () => {
    assert.equal((await db.query(`select * from ${table}`)).rows.length, 0)
    assert.equal(
      (
        await db.query(
          `update ${table} set payload=$1 where owner_id=$2 returning *`,
          [JSON.stringify(payload), owner]
        )
      ).rows.length,
      0
    )
    assert.equal((await db.query(`select * from ${pub}`)).rows.length, 1)
    assert.equal(
      (
        await db.query(`update ${pub} set payload=$1 returning *`, [
          JSON.stringify(payload)
        ])
      ).rows.length,
      0
    )
    assert.equal((await insert(table, other)).rows[0].owner_id, other)
  })
  await actor(viewer, async () => {
    assert.equal((await db.query(`select * from ${table}`)).rows.length, 0)
    assert.equal((await db.query(`select * from ${pub}`)).rows.length, 1)
    assert.equal(
      (
        await db.query(`update ${pub} set payload=$1 returning *`, [
          JSON.stringify(payload)
        ])
      ).rows.length,
      0
    )
  })
  await actor('', async () =>
    assert.equal((await db.query(`select * from ${pub}`)).rows.length, 0)
  )
  await actor(owner, async () =>
    assert.equal(
      (
        await db.query(
          `update ${pub} set payload=$1 where revision=1 returning revision`,
          [JSON.stringify(payload)]
        )
      ).rows[0].revision,
      2
    )
  )
  console.log(
    'PASS 本人の非公開版だけ許可・別編集者/非編集者には非公開版を見せない・共有版は全ログイン閲覧者へ'
  )
  for (const t of [table, pub]) {
    await expectDenied(
      () => actor(viewer, () => insert(t, viewer)),
      '非編集者のINSERTを拒否: ' + t
    )
    await expectDenied(
      () => actor(other, () => insert(t, viewer)),
      '別owner名義のINSERTを拒否: ' + t
    )
    await expectDenied(
      () => actor('', () => db.query(`select * from ${t}`), 'anon'),
      '匿名SELECTを拒否: ' + t
    )
    await expectDenied(
      () => actor(owner, () => db.query(`delete from ${t}`)),
      'DELETEを拒否: ' + t
    )
    await expectDenied(
      () => actor(owner, () => db.query(`truncate ${t}`)),
      'TRUNCATEを拒否: ' + t
    )
    for (const [column, value] of [
      ['revision', '999'],
      ['updated_at', "'2000-01-01'"],
      ['owner_id', `'${other}'`]
    ])
      await expectDenied(
        () =>
          actor(owner, () => db.query(`update ${t} set ${column}=${value}`)),
        '管理列の改ざんを拒否: ' + column
      )
    await expectDenied(
      () =>
        actor(owner, () =>
          db.query(
            `insert into ${t}(owner_id,payload,revision) values ($1,$2,999)`,
            [other, JSON.stringify(payload)]
          )
        ),
      'INSERTでも任意revisionを拒否'
    )
  }
  await actor(owner, async () => {
    const first = (
      await db.query(
        `update ${table} set payload=$1 where owner_id=$2 and revision=1 returning revision,updated_at`,
        [JSON.stringify(payload), owner]
      )
    ).rows
    const second = (
      await db.query(
        `update ${table} set payload=$1 where owner_id=$2 and revision=1 returning revision,updated_at`,
        [JSON.stringify(payload), owner]
      )
    ).rows
    assert.equal(first[0].revision, 2)
    assert.equal(second.length, 0)
    assert.ok(
      new Date(first[0].updated_at) > new Date(created.rows[0].updated_at)
    )
  })
  console.log(
    'PASS 同じrevisionを読んだ2更新の一方だけ成功・DB側でrevision増分と更新時刻を決定'
  )
  const bad = []
  for (const field of [
    'progress',
    'drafts',
    'auth',
    'access_token',
    'refresh_token',
    'password',
    'weak'
  ]) {
    const p = structuredClone(payload)
    p[field] = { secret: true }
    bad.push(p)
  }
  for (const location of [
    'work',
    'section',
    'sentence',
    'token',
    'grammar',
    'dict'
  ]) {
    const p = structuredClone(payload)
    const w = p.data[0],
      s = w.sections[0],
      x = s.sentences[0]
    const obj = {
      work: w,
      section: s,
      sentence: x,
      token: x.tokens[0],
      grammar: x.grammar[0],
      dict: p.dict['fr::est']
    }[location]
    obj.progress = { secret: true }
    bad.push(p)
  }
  bad.push(
    null,
    {},
    { version: 1, data: null, dict: {} },
    { version: 1, data: [], dict: null }
  )
  for (const p of bad) {
    assert.equal(
      (
        await db.query(
          'select public.reading_studio_payload_valid($1::jsonb) as valid',
          [JSON.stringify(p)]
        )
      ).rows[0].valid,
      false
    )
    await expectDenied(
      () =>
        actor(owner, () =>
          db.query(`update ${pub} set payload=$1 where owner_id=$2`, [
            JSON.stringify(p),
            owner
          ])
        ),
      '秘密/不正項目入りpayloadをDB制約で拒否'
    )
  }
  assert.equal(
    (
      await db.query(
        'select public.reading_studio_payload_valid($1) as valid',
        [JSON.stringify({ version: 1, data: [], dict: {} })]
      )
    ).rows[0].valid,
    true
  )
  console.log(
    'PASS 許可リストは全階層で有効・SQL NULL/JSON nullによるCHECK回避も拒否・空の教材は有効'
  )
  await assert.rejects(() => db.exec(sql), /already exist/)
  await db.exec('rollback')
  assert.deepEqual(await unchanged(), before)
  console.log('PASS 二重適用は既存オブジェクトを上書きせず停止')
  await db.exec(
    await readFile(
      path.join(root, 'supabase/material-workflow-postflight.sql'),
      'utf8'
    )
  )
  console.log('PASS 適用後のカタログ確認SQLも読み取り専用で確認（隔離DBのみ）')
  assert.equal(
    (
      await db.query(
        'select public.reading_studio_payload_valid(null::jsonb) as valid'
      )
    ).rows[0].valid,
    false
  )
  await assert.rejects(
    () =>
      actor(owner, () =>
        db.query(`update ${pub} set payload=null where owner_id=$1`, [owner])
      ),
    (e) => e.code === '23502'
  )
  for (const t of [table, pub]) {
    const rights = (
      await db.query(
        `select has_column_privilege('authenticated',$1,'payload','UPDATE') as write_payload,has_column_privilege('authenticated',$1,'owner_id','UPDATE') as write_owner,has_column_privilege('authenticated',$1,'revision','UPDATE') as write_revision,has_column_privilege('authenticated',$1,'updated_at','UPDATE') as write_time,has_table_privilege('anon',$1,'SELECT') as anon_read,has_table_privilege('authenticated',$1,'DELETE') as delete_rows`,
        [t]
      )
    ).rows[0]
    assert.deepEqual(rights, {
      write_payload: true,
      write_owner: false,
      write_revision: false,
      write_time: false,
      anon_read: false,
      delete_rows: false
    })
  }
  await actor(owner, async () => {
    const next = structuredClone(payload)
    next.data[0].title = '非公開の改訂版'
    await db.query(
      `update ${table} set payload=$1 where owner_id=$2 and revision=1`,
      [JSON.stringify(next), owner]
    )
    assert.equal(
      (await db.query(`select payload from ${pub} where owner_id=$1`, [owner]))
        .rows[0].payload.data[0].title,
      'Livre'
    )
  })
  console.log(
    'PASS SQL NULLをNOT NULLで拒否・実効列権限を照合・非公開更新は共有版へ自動反映しない'
  )
  // Execute the prepared audit only against this isolated database.
  await db.exec(
    await readFile(
      path.join(root, 'supabase/material-workflow-preflight.sql'),
      'utf8'
    )
  )
  console.log(
    'PASS 事前監査SQLの構文・読み取り専用トランザクションを確認（隔離DBのみ）'
  )
  console.log('Database:', (await db.query('select version() as v')).rows[0].v)
} catch (e) {
  console.error(e)
  process.exitCode = 1
} finally {
  await db.close()
}
