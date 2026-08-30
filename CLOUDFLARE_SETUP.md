# Attention Shift — Cloudflare公開手順

このプロジェクトは、GitHubとCloudflare Workersを接続して公開できます。公開URLは次の形式です。

```text
https://attention-shift.<あなたのCloudflareサブドメイン>.workers.dev
```

## 1. GitHubへ登録

1. GitHubで`attention-shift`という空のリポジトリを作成します。
2. このZIPを展開し、中のファイル一式をリポジトリへ登録します。
3. `node_modules`、`dist`、`.env`は登録しません（`.gitignore`で除外済みです）。

## 2. D1データベースを作成

1. Cloudflare Dashboardの`Storage & Databases` → `D1 SQL Database`を開きます。
2. `Create Database`を押します。
3. データベース名を`attention-shift-db`にします。
4. 作成後に表示されるDatabase IDをコピーします。
5. `wrangler.jsonc`の`REPLACE_WITH_YOUR_D1_DATABASE_ID`を、そのIDへ置き換えてGitHubへ反映します。

## 3. GitHubとCloudflareを接続

1. Cloudflare Dashboardの`Workers & Pages`を開きます。
2. `Create application`を押します。
3. `Import a repository`の`Get started`を押します。
4. GitHubを連携し、`attention-shift`リポジトリを選択します。
5. Production branchを`main`にします。
6. Build commandを`npm run build`にします。
7. Deploy commandを`npx wrangler deploy --config wrangler.jsonc`にします。
8. `Save and Deploy`を押します。

Worker名は`attention-shift`にしてください。Cloudflare側のWorker名と`wrangler.jsonc`の`name`は一致している必要があります。

## 4. ランキング用テーブルを作成

初回デプロイ後、PCのターミナルでプロジェクトフォルダを開き、次を実行します。

```bash
npm install
npx wrangler login
npm run db:init:cloudflare
```

ブラウザだけで行う場合は、D1の`attention-shift-db`を開き、Consoleへ`drizzle/0000_overconfident_shape.sql`の内容を貼り付けて実行しても構いません。

## 5. 動作確認

発行された`workers.dev`のURLをスマートフォンで開きます。

1. ゲームを最後までプレイする
2. 名前を入力してスコアを登録する
3. RANKINGを開く
4. 別のブラウザでも同じランキングが見えることを確認する

## 更新方法

以後はGitHubの`main`ブランチへ変更を反映すると、Cloudflareが自動でビルド・公開します。

## 注意事項

- 現在の`chatgpt.site`版とは別のデータベースになるため、ランキングは0件から始まります。
- `REPLACE_WITH_YOUR_D1_DATABASE_ID`を実際のIDへ変更するまでデプロイは成功しません。
- パスワード、APIトークン、`.env`ファイルはGitHubへ登録しないでください。
