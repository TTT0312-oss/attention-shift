# Attention Shift

スマートフォンとPCのブラウザで遊べる、1プレイ60秒のマルチタスクゲームです。

- タップ／クリック操作
- 効果音、振動、コンボ演出
- 名前付きグローバルランキング
- Cloudflare Workers＋D1対応
- GitHub連携による自動公開

## 必要環境

- Node.js 22.13以降
- npm
- Cloudflareアカウント

## ローカル開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## Cloudflareへ公開

日本語の詳しい手順は[`CLOUDFLARE_SETUP.md`](CLOUDFLARE_SETUP.md)を参照してください。

最初にCloudflare D1で`attention-shift-db`を作成し、`wrangler.jsonc`内の
`REPLACE_WITH_YOUR_D1_DATABASE_ID`を実際のDatabase IDへ置き換えます。

```bash
npx wrangler login
npm run db:init:cloudflare
npm run deploy:cloudflare
```

GitHubとCloudflare Workersを接続した場合、`main`ブランチへの更新で自動公開できます。
