"use client";

import { Card as CardType, SUIT_SYMBOL, cardColor, rankLabel } from "@/lib/cards";

interface CardProps {
  card: CardType;
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  selected?: boolean;
}

export default function Card({
  card,
  onPointerDown,
  onClick,
  onDoubleClick,
  selected = false,
}: CardProps) {
  if (!card.faceUp) {
    return <div className="card card-back" />;
  }

  const color = cardColor(card.suit);
  const symbol = SUIT_SYMBOL[card.suit];
  const label = rankLabel(card.rank);

  return (
    <div
      className={`card card-face ${color} ${selected ? "selected" : ""}`}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={onPointerDown ? { touchAction: "none", userSelect: "none" } : undefined}
    >
      {/* 左上：数字のみ */}
      <div className="corner top-left">
        <span className="rank">{label}</span>
      </div>

      {/* 中央：大きいスート */}
      <div className="pip">{symbol}</div>

      <style jsx>{`
        .card {
          width: var(--card-w, 70px);
          height: var(--card-h, 98px);
          border-radius: 8px;
          position: relative;
          user-select: none;
        }
        .card-face {
          background: linear-gradient(160deg, #ffffff 0%, var(--card-bg) 100%);
          border: 1px solid var(--card-border);
          box-shadow: 0 2px 4px var(--shadow);
          cursor: pointer;
          transition: transform 0.08s ease, box-shadow 0.08s ease;
        }
        .card-face:hover {
          box-shadow: 0 4px 10px var(--shadow);
        }
        .card-face.selected {
          outline: 2px solid var(--gold);
          outline-offset: -2px;
        }
        .red { color: var(--red); }
        .black { color: var(--black); }

        .corner {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.1;
        }
        .top-left {
          top: 4px;
          left: 5px;
        }
        .rank {
          font-size: calc(var(--card-w, 70px) * 0.52);
          font-weight: 900;
          line-height: 1;
        }
        .pip {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: calc(var(--card-w, 70px) * 0.72);
          opacity: 0.88;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
