# Supabase適用前の最終レビュー

## 現時点の結論

**本番Supabaseには接続せず、SELECTを含めSQLを実行していません。`prisma db push` も実行していません。**

本番のSQL実行を保留する指示を優先しています。そのため、実環境の `public.is_editor()` の存在・実装・権限は未確認です。リポジトリの旧 `prisma/rls.sql` には、`editor_accounts."userId" = auth.uid()` を `stable security definer set search_path = public` で判定する定義がありますが、復元後の実DBがこの定義と同一とは断定していません。

新しいSQLとクライアントを隔離PostgreSQLで検証しました。実環境での最終確認を経るまで、SQLの監査ハッシュは未設定のままです。**そのまま貼り付けても作成前に停止します。**

## 依頼6項目の確認結果

| 項目 | 確認・対応 | 本番の確認状況 |
| --- | --- | --- |
| is_editor() | 存在・定義・所有者・固定search_path・明示/継承EXECUTE権限を出す事前確認SQLを用意。変更前に監査結果の指紋と照合 | 未実行・承認後に確認 |
| 新規2テーブルのRLS | 本人だけ非公開版の読み書きを許可。共有版はauthenticatedロールかつauth.uid()が非NULLなら読める。書込は本人かつ編集者のみ | 隔離DBで確認済み、本番は適用後 |
| revision / updated_at | DBトリガーで初回revision=1、更新時+1、DB時刻を設定。APIロールは管理列をINSERT/UPDATEできない | 隔離DBで確認済み |
| 共有する内容 | 送信時に全階層を許可リストで再構築。DB側のCHECKでも未知の項目を拒否。進捗・弱点フラグ・フォーム下書き・JWTなどは除外 | 単体・DBテストで確認済み |
| Prisma整合 | `schema.prisma` に2モデルを追加。JSONB、UUID、BigInt、timestamptz、DBデフォルト、物理名をSQLと照合 | ローカルvalidate成功、DDL未実行 |
| 既存データ保護 | 既存テーブル・行・関数・権限・RLSを変更しない追加のみのSQL。同名オブジェクトがあれば停止 | 隔離DBで既存データ/メタデータ不変を確認。本番操作自体なし |

## ファイルと実行範囲

| ファイル | 用途 | 本番の現状 |
| --- | --- | --- |
| `supabase/material-workflow-preflight.sql` | 存在・定義・権限・既存ポリシー等をREAD ONLYで監査 | 未実行 |
| `supabase/material-workflow.sql` | 新規2テーブル・検証関数・トリガー・限定権限・RLSを作成する最終SQL案 | 未実行、監査ハッシュ未設定 |
| `supabase/material-workflow-postflight.sql` | 適用後にRLS・列権限・制約・トリガーをREAD ONLYで確認 | 未実行 |
| `prisma/schema.prisma` | 対応する2モデルを追加済み。SQLの実行手段にはしない | ローカルファイルのみ |
| `scripts/material-db-smoke.mjs` | PGlite上で実SQL・実ロールを検証。接続先URLや.envを読み込まない | 本番接続機能なし |
| `scripts/fixtures/material-db-setup.sql` | 隔離DB専用のAuth/ロール/既存データ再現 | **本番には絶対に適用しない** |

## SQL最終案の変更点

- `reading_studio_drafts` は非公開教材スナップショット。ローカルの入力途中フォームではありません。
- `reading_studio_publications` は明示的に共有した別スナップショット。非公開版の更新だけでは共有版を更新しません。
- 所有者はUUID主キー。旧教材の文字列IDと配列順はJSON内で保持します。既存の正規化テーブルやAuthに外部キーを追加せず、データ移行もしません。
- トリガーが `revision` と `updated_at` を決定します。Prismaに `@updatedAt` は付けず、RESTクライアントもこれらの列を送信しません。
- authenticatedにはSELECTと `INSERT(owner_id,payload)` / `UPDATE(payload)` だけを許可。DELETE、TRUNCATE、管理列の変更は不可です。PUBLICとanonの継承権限も新規オブジェクトについて撤回します。
- JSON検証関数はSECURITY INVOKER・固定の空search_pathで、入力JSON以外のデータを読みません。anon/PUBLICからの実行は撤回し、純粋な検証用関数だけauthenticatedに許可します。トリガー関数はAPIロールに直接の実行を許可しません。
- SQL NULL / JSON null / 未知の項目 / 型違い / 重複する教材ID等を拒否します。テキスト内容は書き換えません。
- 制約・権限・ポリシー・トリガー作成を1トランザクション内で行い、失敗時は全部取り消します。`CREATE OR REPLACE`、既存オブジェクトのDROP、既存関数へのGRANT/REVOKE、Auth変更はありません。
- 同名のテーブル/補助関数があれば、空であっても上書きせず停止します。停止後は状況を確認し、削除して再試行する方法は取りません。
- DBがリカバリー中/読み取り専用、前提権限が不足、is_editor()が未レビュー/変更済みの場合も停止します。
- 最後にPostgRESTへスキーマキャッシュ再読み込みを通知します。既存テーブルの定義・行は変更しません。

`revision` はJavaScriptが正確に扱える整数範囲に制約します。これはPrismaのBigInt型と矛盾しません。CHECK、トリガー、RLS、列権限はPrismaモデルだけでは表現しないため、レビューしたSQLを正とします。

## 競合防止の契約

初回はPOSTで `owner_id,payload` を送信し、重複主キーなら409です。アップサートで上書きしません。

更新は必ず以下の条件を付けたPATCHです。

```text
/rest/v1/reading_studio_drafts?owner_id=eq.<本人UUID>&revision=eq.<取得済み版>
body: {"payload": <許可項目だけの教材JSON>}
```

DB側で条件判定と更新が行われ、トリガーが旧版+1へ進めます。同じ版を前提にした2つの更新は片方だけが成功します。空配列の応答を成功扱いせず、再取得を求めます。updated_atは端末の時計を信用しません。

これは、この条件付き更新APIを使うクライアント間の楽観的ロックです。所有者が直接SQL/RESTを使ってrevision条件を省略する意図的な上書きまで禁止する設計ではありません。RLSはその場合も他人の行への書き込みを拒否します。

## 共有JSONの境界

送信可能な項目は、version、作品/章/文、翻訳、教材の構文ステップ、教材備考、文法事項、語彙と辞書形・品詞等だけです。クライアントは型定義を信用して丸ごとJSON化せず、バックアップに追加項目が混ざっていても全階層を再構築します。DBは同じ許可リストで追加項目を拒否します。

`progress`、`readSet`、`weak`、フォームの `drafts`、`auth`、`access_token`、`refresh_token`、`password` 等を、トップレベルや作品・章・文・トークン・文法・辞書項目に混ぜたテストを行い、除外/拒否を確認しました。既知のテキスト項目にオブジェクトを混ぜた場合も拒否します。

利用者が本文・備考・語源などへ直接書いたテキストは教材そのものとして共有対象です。テキストの内容から秘密情報を自動判定する機能ではありません。

## 本番に対する今後の手順（まだ実行しない）

### 1. 復元と保護の確認

Supabase側でプロジェクトの復元完了を確認します。既存DBの利用可能なバックアップ/復元ポイントと、アプリのローカルJSONバックアップを確保します。稼働中の環境変数・既存テーブル・権限を変更しません。

### 2. 読み取り専用の事前確認を別途承認

`material-workflow-preflight.sql` だけを実行し、結果を確認します。行データ・メール・パスワード・JWTは取得しない構成です。主な確認項目:

- `in_recovery=false`、正しいプロジェクト/DB/バージョンであること。
- `public.is_editor()` が引数なしboolean、stable、SECURITY DEFINERであること。
- 本文が承認済みの編集者テーブルと `auth.uid()` に基づく判定であり、利用者が変更できるuser_metadata等を編集権限の根拠にしていないこと。
- 関数の列参照と実テーブルの列名が一致すること。以前の作業に登場した `user_id` と `"userId"` は別の列名なので、事前確認の列一覧と照合します。不一致なら関数を勝手に修正せず、別途変更案を確認します。
- 関数の所有者をanon/authenticatedが引き受けられず、関数/編集者テーブルを利用者が変更・自己登録できないこと。
- 空のsearch_pathを推奨。旧定義の `search_path=public` を維持する場合は、参照する関数・テーブルがスキーマ修飾され、APIロールがpublic/authへCREATEできないこと。未修飾のテーブル名はpg_tempによる影響もレビューします。
- authenticatedが関数をEXECUTEできること。PUBLIC由来の権限も含めて確認します。旧is_editor()のPUBLIC/anon権限を減らす場合は、既存機能への影響を調べ、**このSQLとは別に承認**を得ます。
- 新規オブジェクト名の衝突がないこと。既に存在する場合は、その定義とデータを別途確認します。

事前確認で問題があっても、既存関数の作り直しや権限変更を自動では行いません。

### 3. 監査指紋を設定し、適用内容を最終確認

監査結果の `reviewed_is_editor_fingerprint` は関数定義・所有者・ACLの指紋です。内容の安全性を人がレビューしてから、SQL内の `__REVIEWED_IS_EDITOR_FINGERPRINT__` をその値へ置き換えます。指紋の一致だけで、安全性が自動保証されるわけではありません。

差し替え後の差分とSQLファイルのハッシュを確認し、**その内容への最終承認を待ちます**。

```sh
shasum -a 256 supabase/material-workflow.sql
```

### 4. 承認されたSQLだけを適用

承認済みの対象プロジェクトでSQL Editor等からファイル全体を1回実行します。`prisma db push`、`db push --accept-data-loss`、`migrate reset`などで代用しません。停止/エラーの場合はROLLBACKし、事前監査を確認します。衝突したオブジェクトを削除して進めません。

Prismaモデルはローカルで追加済みですが、それ自体はDBを変更していません。SQLを適用するまではPrisma Clientから新モデルを使いません。

### 5. 適用後のカタログ確認

`material-workflow-postflight.sql` をREAD ONLYで実行します。2テーブルのRLS、6ポリシー、2トリガー、CHECK/主キー、列単位権限を確認します。anonにSELECT/INSERT/UPDATE等がなく、authenticatedにも管理列更新・DELETE・TRUNCATEがないことを確認します。

事前/事後のis_editor指紋が一致すること、既存のテーブル定義・ポリシーが変化していないことを比較します。既存行の厳密な照合が必要な場合は、負荷と個人情報を考慮して取得したバックアップ/件数等と比較します。事前確認の `estimated_rows` は推定値であり、データ同一性の証明には使いません。

### 6. 実際のJWTで保存・復元・共有を検証

SQL Editorのpostgresやservice_roleはRLSをバイパスし得るため、権限分離の確認は実ユーザーの通常ログインを使います。トークンをチャットやログへ貼らず、バックアップにも含めません。

| 操作 | 編集者A | 別編集者B | 一般閲覧者C | 未ログイン |
| --- | --- | --- | --- | --- |
| Aの非公開版を取得 | 可 | 不可 | 不可 | 不可 |
| 自分の非公開版を新規保存 | 可 | 可 | 不可 | 不可 |
| Aの版を更新 | 可 | 不可 | 不可 | 不可 |
| Aの共有版を取得 | 可 | 可 | 可 | 不可 |
| 他人名義で新規保存 | 不可 | 不可 | 不可 | 不可 |
| 管理列改ざん/DELETE/TRUNCATE | 不可 | 不可 | 不可 | 不可 |

既存のアカウント・編集者設定で実施します。検証用アカウント作成やeditor_accountsへの権限追加が必要なら、その変更は別途承認します。

実データ保護のため、最初はバックアップ済みの無害な教材で非公開保存を確認し、勝手に共有しません。共有テストは内容と範囲を確認してから行います。

- 非公開保存は初回revision=1。復元して原文・訳・辞書・順序が一致すること。
- フォームの未反映下書き・進捗・認証情報が送信されないことをNetworkのリクエスト内容で確認（JWTヘッダーの記録/共有はしない）。
- 非公開版を更新しても、共有版の内容・版番号が変わらないこと。
- 同じ編集者の2セッションで同じrevisionを取得し、Aで保存、Bの古い版で保存すると競合になり、Bのローカル下書きが残ること。
- PCの時刻を変える代わりに送信JSONにupdated_atを含まないことと、DBの返す時刻が更新されることを確認。
- 既存の作品・章・翻訳・Auth・編集権限が従来どおり使えること。

共有範囲はライブラリ全体です。招待者だけへの限定共有は今回の対象外です。

## 再現可能なローカル検証

Dockerのデーモンが起動していない環境でも本番に接続せず検証するため、一時フォルダにPGlite（PostgreSQL 18.6）を用意しました。通常のアプリ依存には追加していません。

```sh
npm install --prefix /tmp/reading-studio-db-qa --no-save --package-lock=false @electric-sql/pglite
PGLITE_MODULE=/tmp/reading-studio-db-qa/node_modules/@electric-sql/pglite/dist/index.js npm run test:material-db
npm test
npm run build
npm run lint
npx prisma validate
```

テストは毎回インメモリの新しいDBを作り、URL/.envを読まず、本番接続手段を持ちません。広い初期GRANTも再現して、新規オブジェクトから確実に撤回することを確認しています。実PostgreSQLのSQL実行・RLS・権限・トリガーを使いますが、SupabaseのJWT検証やPostgREST/CORSそのものを再現するものではありません。

競合テストは「同じ版を取得した2更新」の再現です。実Supabase上の複数接続・実JWTによる検証は、上記の適用後工程で行います。

## 参考資料

- [Supabase: Database Functions（SECURITY DEFINER、search_path、実行権限）](https://supabase.com/docs/guides/database/functions)
- [Supabase: Row Level Security（APIロール、所有者や管理者によるバイパス）](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL: GRANT（列権限、PUBLICと関数の既定実行権限）](https://www.postgresql.org/docs/current/sql-grant.html)
