"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "./Card";
import { Suit, SUIT_SYMBOL, SUITS } from "@/lib/cards";
import { GameState, newGame, drawFromStock } from "@/lib/game";
import {
  moveWasteToTableau,
  moveWasteToFoundation,
  moveTableauToTableau,
  moveTableauToFoundation,
  autoMoveToFoundation,
} from "@/lib/moves";

// ドラッグ中の情報
type DragInfo =
  | { source: "waste" }
  | { source: "tableau"; col: number; cardIndex: number };

export default function GameBoard() {
  const [state, setState] = useState<GameState | null>(null);
  const [drag, setDrag] = useState<DragInfo | null>(null);

  // 初期化はクライアントで（SSRのhydration不一致を避ける）
  useEffect(() => {
    setState(newGame());
  }, []);

  const reset = useCallback(() => setState(newGame()), []);

  const apply = useCallback((next: GameState | null) => {
    if (next) setState(next);
  }, []);

  if (!state) {
    return <div style={{ padding: 40 }}>配牌中…</div>;
  }

  // 山札クリック
  const handleStockClick = () => setState(drawFromStock(state));

  // ドロップ先：場札の列
  const handleDropTableau = (toCol: number) => {
    if (!drag) return;
    if (drag.source === "waste") {
      apply(moveWasteToTableau(state, toCol));
    } else {
      apply(moveTableauToTableau(state, drag.col, drag.cardIndex, toCol));
    }
    setDrag(null);
  };

  // ドロップ先：組札
  const handleDropFoundation = () => {
    if (!drag) return;
    if (drag.source === "waste") {
      apply(moveWasteToFoundation(state));
    } else {
      // 場札の一番上のみ組札へ
      const col = state.tableau[drag.col];
      if (drag.cardIndex === col.length - 1) {
        apply(moveTableauToFoundation(state, drag.col));
      }
    }
    setDrag(null);
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  // ダブルクリックで組札へ自動送り
  const autoSendWaste = () =>
    apply(autoMoveToFoundation(state, { type: "waste" }));
  const autoSendTableau = (col: number) =>
    apply(autoMoveToFoundation(state, { type: "tableau", col }));

  const wasteTop = state.waste[state.waste.length - 1];

  return (
    <div className="board">
      <header className="hud">
        <h1>Klondike Solitaire</h1>
        <div className="stats">
          <span>手数: {state.moves}</span>
          <button onClick={reset}>新しいゲーム</button>
        </div>
      </header>

      {state.won && (
        <div className="win-banner">🎉 クリア！おめでとうございます</div>
      )}

      <div className="top-row">
        {/* 山札・捨て札 */}
        <div className="left-piles">
          <div className="slot stock" onClick={handleStockClick}>
            {state.stock.length > 0 ? (
              <div className="card card-back" />
            ) : (
              <div className="recycle">↻</div>
            )}
          </div>
          <div className="slot">
            {wasteTop ? (
              <Card
                card={wasteTop}
                draggable
                onDragStart={() => setDrag({ source: "waste" })}
                onDoubleClick={autoSendWaste}
              />
            ) : null}
          </div>
        </div>

        {/* 組札 */}
        <div className="foundations">
          {SUITS.map((suit) => (
            <FoundationSlot
              key={suit}
              suit={suit}
              pile={state.foundations[suit]}
              onDragOver={allowDrop}
              onDrop={handleDropFoundation}
            />
          ))}
        </div>
      </div>

      {/* 場札 */}
      <div className="tableau">
        {state.tableau.map((col, colIndex) => (
          <div
            key={colIndex}
            className="column"
            onDragOver={allowDrop}
            onDrop={() => handleDropTableau(colIndex)}
          >
            {col.length === 0 && <div className="slot empty" />}
            {col.map((card, cardIndex) => (
              <div
                key={card.id}
                className="stacked"
                style={{ top: `${cardIndex * 26}px` }}
              >
                <Card
                  card={card}
                  draggable={card.faceUp}
                  onDragStart={() =>
                    setDrag({ source: "tableau", col: colIndex, cardIndex })
                  }
                  onDoubleClick={() => autoSendTableau(colIndex)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        .board {
          position: relative;
          z-index: 1;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px 16px 60px;
          --card-w: 80px;
          --card-h: 112px;
        }
        .hud {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 26px;
          letter-spacing: 1px;
          color: var(--gold);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        .stats {
          display: flex;
          gap: 14px;
          align-items: center;
          font-size: 15px;
        }
        button {
          font-family: inherit;
          background: var(--gold);
          color: #2a1a05;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 4px var(--shadow);
        }
        button:hover {
          filter: brightness(1.08);
        }
        .win-banner {
          background: var(--gold);
          color: #2a1a05;
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 16px;
        }
        .top-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 12px;
        }
        .left-piles,
        .foundations {
          display: flex;
          gap: 12px;
        }
        .slot {
          width: var(--card-w);
          height: var(--card-h);
          border-radius: 8px;
          background: var(--slot);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stock {
          cursor: pointer;
        }
        .recycle {
          font-size: 28px;
          opacity: 0.5;
        }
        .tableau {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
        }
        .column {
          position: relative;
          min-height: var(--card-h);
        }
        .stacked {
          position: absolute;
          left: 0;
          width: 100%;
        }
        .empty {
          width: 100%;
        }
        :global(.card-back) {
          width: var(--card-w);
          height: var(--card-h);
          border-radius: 8px;
          background: repeating-linear-gradient(
              45deg,
              var(--card-back),
              var(--card-back) 6px,
              #7d2733 6px,
              #7d2733 12px
            );
          border: 2px solid #fff;
          box-shadow: 0 2px 4px var(--shadow);
        }
      `}</style>
    </div>
  );
}

// 組札スロット
function FoundationSlot({
  suit,
  pile,
  onDragOver,
  onDrop,
}: {
  suit: Suit;
  pile: GameState["foundations"][Suit];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const top = pile[pile.length - 1];
  return (
    <div className="slot" onDragOver={onDragOver} onDrop={onDrop}>
      {top ? (
        <Card card={top} />
      ) : (
        <span style={{ fontSize: 30, opacity: 0.3 }}>{SUIT_SYMBOL[suit]}</span>
      )}
    </div>
  );
}
