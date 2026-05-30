// クロンダイク・ソリティアのゲーム状態と移動ルール

import {
  Card,
  Suit,
  cardColor,
  createDeck,
  shuffle,
} from "./cards";

// 7つの場札（tableau）、4つの組札（foundation）、山札（stock）、捨て札（waste）
export interface GameState {
  tableau: Card[][]; // 7列
  foundations: Record<Suit, Card[]>; // スート別の組札
  stock: Card[]; // 山札（裏向き）
  waste: Card[]; // 捨て札（表向き）
  moves: number;
  won: boolean;
}

export type PileType = "tableau" | "foundation" | "waste" | "stock";

export interface Position {
  type: PileType;
  index: number; // tableauの列番号 / foundationのスート番号など
}

// 新規ゲームを初期化
export function newGame(seed?: number): GameState {
  const deck = shuffle(createDeck(), seed);
  const tableau: Card[][] = [[], [], [], [], [], [], []];

  let pointer = 0;
  // 各列に i+1 枚配り、一番上だけ表向き
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck[pointer++];
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }

  const stock = deck.slice(pointer).map((c) => ({ ...c, faceUp: false }));

  return {
    tableau,
    foundations: { spades: [], hearts: [], diamonds: [], clubs: [] },
    stock,
    waste: [],
    moves: 0,
    won: false,
  };
}

// 山札をめくる（1枚ドロー）。空なら捨て札を戻す
export function drawFromStock(state: GameState): GameState {
  const next = clone(state);
  if (next.stock.length === 0) {
    // 捨て札を裏返して山札に戻す
    next.stock = next.waste.reverse().map((c) => ({ ...c, faceUp: false }));
    next.waste = [];
  } else {
    const card = next.stock.pop()!;
    card.faceUp = true;
    next.waste.push(card);
  }
  next.moves++;
  return next;
}

// 場札へカードを置けるか（色違い・1つ小さいランク。空列にはKのみ）
export function canPlaceOnTableau(card: Card, target: Card | undefined): boolean {
  if (!target) return card.rank === 13; // 空列はKのみ
  if (!target.faceUp) return false;
  return (
    cardColor(card.suit) !== cardColor(target.suit) &&
    card.rank === target.rank - 1
  );
}

// 組札へカードを置けるか（同スート・1つ大きいランク。空ならAのみ）
export function canPlaceOnFoundation(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) return card.rank === 1; // A から
  const top = pile[pile.length - 1];
  return card.suit === top.suit && card.rank === top.rank + 1;
}

// 勝利判定：4つの組札がすべてKまで揃っている
export function checkWin(state: GameState): boolean {
  return Object.values(state.foundations).every((pile) => pile.length === 13);
}

function clone(state: GameState): GameState {
  return {
    tableau: state.tableau.map((col) => col.map((c) => ({ ...c }))),
    foundations: {
      spades: state.foundations.spades.map((c) => ({ ...c })),
      hearts: state.foundations.hearts.map((c) => ({ ...c })),
      diamonds: state.foundations.diamonds.map((c) => ({ ...c })),
      clubs: state.foundations.clubs.map((c) => ({ ...c })),
    },
    stock: state.stock.map((c) => ({ ...c })),
    waste: state.waste.map((c) => ({ ...c })),
    moves: state.moves,
    won: state.won,
  };
}

export { clone };
