// カード移動のアクション群。すべて新しいGameStateを返す（イミュータブル）

import { Card, Suit } from "./cards";
import {
  GameState,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  checkWin,
  clone,
} from "./game";

// 捨て札の一番上を場札の列へ移動
export function moveWasteToTableau(
  state: GameState,
  toCol: number
): GameState | null {
  const card = state.waste[state.waste.length - 1];
  if (!card) return null;
  const targetCol = state.tableau[toCol];
  const target = targetCol[targetCol.length - 1];
  if (!canPlaceOnTableau(card, target)) return null;

  const next = clone(state);
  const moved = next.waste.pop()!;
  next.tableau[toCol].push(moved);
  next.moves++;
  return finalize(next);
}

// 捨て札の一番上を組札へ移動
export function moveWasteToFoundation(state: GameState): GameState | null {
  const card = state.waste[state.waste.length - 1];
  if (!card) return null;
  if (!canPlaceOnFoundation(card, state.foundations[card.suit])) return null;

  const next = clone(state);
  const moved = next.waste.pop()!;
  next.foundations[moved.suit].push(moved);
  next.moves++;
  return finalize(next);
}

// 場札の列（指定カードから下すべて）を別の列へ移動
export function moveTableauToTableau(
  state: GameState,
  fromCol: number,
  cardIndex: number,
  toCol: number
): GameState | null {
  if (fromCol === toCol) return null;
  const source = state.tableau[fromCol];
  const card = source[cardIndex];
  if (!card || !card.faceUp) return null;

  const targetCol = state.tableau[toCol];
  const target = targetCol[targetCol.length - 1];
  if (!canPlaceOnTableau(card, target)) return null;

  const next = clone(state);
  const moving = next.tableau[fromCol].splice(cardIndex);
  next.tableau[toCol].push(...moving);
  flipTopCard(next.tableau[fromCol]);
  next.moves++;
  return finalize(next);
}

// 場札の一番上を組札へ移動
export function moveTableauToFoundation(
  state: GameState,
  fromCol: number
): GameState | null {
  const source = state.tableau[fromCol];
  const card = source[source.length - 1];
  if (!card || !card.faceUp) return null;
  if (!canPlaceOnFoundation(card, state.foundations[card.suit])) return null;

  const next = clone(state);
  const moved = next.tableau[fromCol].pop()!;
  next.foundations[moved.suit].push(moved);
  flipTopCard(next.tableau[fromCol]);
  next.moves++;
  return finalize(next);
}

// 自動補完可能か判定：山札が空 かつ 場札がすべて表向き
export function canAutoComplete(state: GameState): boolean {
  if (state.stock.length > 0) return false;
  return state.tableau.every((col) => col.every((card) => card.faceUp));
}

// 自動補完の1ステップ：組札に送れるカードを1枚送る
export function autoCompleteStep(state: GameState): GameState | null {
  const fromWaste = moveWasteToFoundation(state);
  if (fromWaste) return fromWaste;
  for (let col = 0; col < state.tableau.length; col++) {
    const result = moveTableauToFoundation(state, col);
    if (result) return result;
  }
  return null;
}

// 組札から場札へ戻す（任意ルール）
export function moveFoundationToTableau(
  state: GameState,
  suit: Suit,
  toCol: number
): GameState | null {
  const pile = state.foundations[suit];
  const card = pile[pile.length - 1];
  if (!card) return null;
  const targetCol = state.tableau[toCol];
  const target = targetCol[targetCol.length - 1];
  if (!canPlaceOnTableau(card, target)) return null;

  const next = clone(state);
  const moved = next.foundations[suit].pop()!;
  next.tableau[toCol].push(moved);
  next.moves++;
  return finalize(next);
}

// 自動で送れるカードを組札へ送る（ダブルクリック等で使用）
export function autoMoveToFoundation(
  state: GameState,
  from: { type: "waste" } | { type: "tableau"; col: number }
): GameState | null {
  if (from.type === "waste") return moveWasteToFoundation(state);
  return moveTableauToFoundation(state, from.col);
}

// 列の一番上が裏向きなら表に返す
function flipTopCard(col: Card[]): void {
  const top = col[col.length - 1];
  if (top && !top.faceUp) top.faceUp = true;
}

// 移動後の共通処理（勝利判定）
function finalize(state: GameState): GameState {
  state.won = checkWin(state);
  return state;
}
