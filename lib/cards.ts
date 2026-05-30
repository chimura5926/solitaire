// クロンダイク・ソリティアの基本型とカード生成

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Color = "red" | "black";

export interface Card {
  id: string; // 一意なID 例: "S-1"
  suit: Suit;
  rank: number; // 1(A) 〜 13(K)
  faceUp: boolean;
}

export const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

export const RANK_LABEL: Record<number, string> = {
  1: "A",
  11: "J",
  12: "Q",
  13: "K",
};

export function rankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

export function cardColor(suit: Suit): Color {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

// 52枚のデッキを生成（すべて裏向き）
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit[0].toUpperCase()}-${rank}`,
        suit,
        rank,
        faceUp: false,
      });
    }
  }
  return deck;
}

// Fisher-Yatesによるシャッフル（seed対応で再現性を持たせる）
export function shuffle<T>(arr: T[], seed?: number): T[] {
  const result = [...arr];
  let random = seed !== undefined ? mulberry32(seed) : Math.random;
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// シード付き擬似乱数
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
