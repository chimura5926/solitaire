# Klondike Solitaire

Next.js (App Router) + TypeScript で作ったクロンダイク・ソリティア。Vercel デプロイ前提。

## できていること

- 52枚デッキの生成・シャッフル（シード対応で再現可能）
- クロンダイクの配牌（7列、末尾のみ表向き）
- 山札クリックでドロー、空なら捨て札を戻す
- ドラッグ&ドロップでの移動
  - 捨て札 → 場札 / 組札
  - 場札 → 場札（複数枚まとめて）/ 組札
- ダブルクリックで組札へ自動送り
- 移動ルールの完全実装（色違い降順 / 同スート昇順 / 空列はK / 組札はA始まり）
- 場札の自動めくり、勝利判定、手数カウント、リセット

## 構成

```
app/
  layout.tsx, page.tsx, globals.css   # 画面の枠とテーブルのスタイル
components/
  Card.tsx        # 1枚のカード表示
  GameBoard.tsx   # 盤面・D&D・操作
lib/
  cards.ts        # 型・デッキ生成・シャッフル
  game.ts         # 状態・初期化・ドロー・ルール判定・勝利判定
  moves.ts        # 各種カード移動アクション
```

ロジック (`lib/`) は UI と完全に分離。テストや AI 自動プレイの追加が容易。

## ローカル実行

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 本番ビルド確認
```

## Vercel デプロイ

1. このフォルダを GitHub リポジトリに push
2. [vercel.com](https://vercel.com) で New Project → リポジトリを import
3. フレームワークは Next.js が自動検出される。設定変更不要でそのまま Deploy

または CLI:

```bash
npm i -g vercel
vercel          # プレビュー
vercel --prod   # 本番
```

## 既知の制約（continue 用）

- スマホのタッチD&Dは未対応（PointerEvent化が必要）
- アニメーション（移動・配牌）が最小限
- アンドゥ、自動補完（全カード一括送り）、タイマー、スコア、勝率記録がない
- 難易度（3枚ドロー）切替がない

詳しくは `PROMPT.md` を参照。
