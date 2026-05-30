# Claude Code Agent 用 引き継ぎプロンプト

このプロジェクトは Next.js (App Router) + TypeScript で作られたクロンダイク・ソリティアです。
ゲームロジックは `lib/`（cards.ts / game.ts / moves.ts）に、UI は `components/`（Card.tsx / GameBoard.tsx）にあります。
`npm run build` が通る状態がベースラインです。**作業の各ステップ後に必ず `npm run build` を実行して、型エラーとビルド破壊がないことを確認してください。**

以下のタスクを上から順に実装してください。各タスクは独立したコミット単位にしてください。

---

## タスク1: アンドゥ機能（最優先）
- `GameBoard.tsx` の `useState<GameState>` を、状態の履歴スタック（`GameState[]`）を持つ形に変更する。
- すべての移動・ドロー操作の前に現在の状態を履歴へ push する。
- 「元に戻す」ボタンを HUD に追加し、履歴を1つ戻す。履歴が空なら無効化。
- `state` は常に履歴の最後尾を指すようにする。手数は減らさない（任意で増やす）。

## タスク2: スマホのタッチ対応
- 現在 HTML5 Drag&Drop API を使っているが、モバイルのタッチで動かない。
- `onDragStart/onDrop` を Pointer Events（`onPointerDown/Move/Up`）ベースのドラッグに置き換える。
- ドラッグ中のカードは `position: fixed` のゴースト要素として指に追従させ、`document.elementFromPoint` でドロップ先の列・組札を判定する。
- 既存の `DragInfo` 型と移動関数（`lib/moves.ts`）はそのまま再利用できる。move関数のシグネチャは変えないこと。

## タスク3: 移動・配牌アニメーション
- カードが移動するときに、移動元座標から移動先座標へ補間して滑らかに動かす（FLIP テクニック推奨）。
- 配牌時に左から順にカードが配られる演出を入れる。
- CSS transition / transform で実装。`prefers-reduced-motion` を尊重すること。

## タスク4: 自動補完とゲームオプション
- 「自動補完」ボタン: 場札・捨て札がすべて表向きで組札に送れる状態になったら、全カードを自動で組札へ送りクリアする。
- 3枚ドローモード: `lib/game.ts` の `drawFromStock` を1枚/3枚切替できるよう引数を追加。`newGame` のオプションに難易度を持たせる。
- ルールを破壊しないよう、変更後は `lib/` のロジックに対する単体テスト（後述タスク6）で確認する。

## タスク5: スコア・タイマー・記録
- 経過時間タイマーを HUD に表示。
- 標準的なソリティアのスコアリング（組札へ送る +10、場札めくる +5 など）を実装。
- localStorage にベストタイム・勝利数を保存して表示。

## タスク6: ロジックの単体テスト
- `vitest` を導入し、`lib/` のルール関数（canPlaceOnTableau / canPlaceOnFoundation / 各move関数 / checkWin）のテストを書く。
- シード固定の `newGame(seed)` を使って決定的なテストを作る。
- `npm test` で実行できるようにする。

---

## 設計上の約束ごと
- `lib/` のゲームロジックは UI から完全分離されている。新ルールやAI機能を足すときも UI 状態をロジックに混ぜないこと。
- すべての move 関数はイミュータブル（新しい `GameState` を返す。不正な手は `null`）。この契約を守ること。
- 既存の型（Card / GameState / Position / DragInfo）を尊重し、破壊的変更は避ける。必要なら拡張する。
- 各タスク完了ごとに `npm run build` がパスすること。

まずタスク1から始めてください。
