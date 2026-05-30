"use client";

import { Card as CardType, SUIT_SYMBOL, cardColor, rankLabel } from "@/lib/cards";

interface CardProps {
  card: CardType;
  // ドラッグ開始ハンドラ（場所情報を渡す）
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  // 重なり表示用のオフセット指定はラッパー側で行う
  draggable?: boolean;
  selected?: boolean;
}

export default function Card({
  card,
  onDragStart,
  onClick,
  onDoubleClick,
  draggable = false,
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
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="corner top">
        <span className="rank">{label}</span>
        <span className="suit">{symbol}</span>
      </div>
      <div className="pip">{symbol}</div>
      <div className="corner bottom">
        <span className="rank">{label}</span>
        <span className="suit">{symbol}</span>
      </div>

      <style jsx>{`
        .card {
          width: var(--card-w, 80px);
          height: var(--card-h, 112px);
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
        .red {
          color: var(--red);
        }
        .black {
          color: var(--black);
        }
        .corner {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
          font-weight: bold;
        }
        .corner.top {
          top: 5px;
          left: 6px;
        }
        .corner.bottom {
          bottom: 5px;
          right: 6px;
          transform: rotate(180deg);
        }
        .rank {
          font-size: calc(var(--card-w, 80px) * 0.22);
        }
        .suit {
          font-size: calc(var(--card-w, 80px) * 0.2);
        }
        .pip {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: calc(var(--card-w, 80px) * 0.5);
          opacity: 0.92;
        }
      `}</style>
    </div>
  );
}
