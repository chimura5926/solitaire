"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Card from "./Card";
import { Card as CardType, Suit, SUIT_SYMBOL, SUITS } from "@/lib/cards";
import { GameState, newGame, drawFromStock } from "@/lib/game";
import {
  moveWasteToTableau,
  moveWasteToFoundation,
  moveTableauToTableau,
  moveTableauToFoundation,
  autoMoveToFoundation,
  canAutoComplete,
  autoCompleteStep,
} from "@/lib/moves";

type DragInfo =
  | { source: "waste" }
  | { source: "tableau"; col: number; cardIndex: number };

interface ActiveDrag {
  info: DragInfo;
  cards: CardType[];
  offsetX: number;
  offsetY: number;
}

export default function GameBoard() {
  const [state, setState] = useState<GameState | null>(null);
  const [autoCompleting, setAutoCompleting] = useState(false);

  // Pointer drag state (refs to avoid stale closures in document listeners)
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const stateRef = useRef<GameState | null>(null);

  // Ghost element rendering state
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [dragCards, setDragCards] = useState<CardType[]>([]);

  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize game on client
  useEffect(() => {
    setState(newGame());
  }, []);

  // Auto-complete loop: advance one step every 150ms
  useEffect(() => {
    if (!autoCompleting || !state) return;
    if (state.won) {
      setAutoCompleting(false);
      return;
    }
    const next = autoCompleteStep(state);
    if (!next) {
      setAutoCompleting(false);
      return;
    }
    const timer = setTimeout(() => setState(next), 150);
    return () => clearTimeout(timer);
  }, [autoCompleting, state]);

  // Global pointer event listeners for drag
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = activeDragRef.current;
      if (!drag) return;
      setGhostPos({ x: e.clientX - drag.offsetX, y: e.clientY - drag.offsetY });
    };

    const onUp = (e: PointerEvent) => {
      const drag = activeDragRef.current;
      if (!drag) return;

      activeDragRef.current = null;
      setGhostPos(null);
      setDragCards([]);

      const st = stateRef.current;
      if (!st) return;

      // Find drop target by walking up DOM from the point
      const el = document.elementFromPoint(e.clientX, e.clientY);
      let node: Element | null = el;
      while (node && node !== document.body) {
        const colAttr = node.getAttribute("data-drop-col");
        if (colAttr !== null) {
          const toCol = parseInt(colAttr);
          let next: GameState | null = null;
          if (drag.info.source === "waste") {
            next = moveWasteToTableau(st, toCol);
          } else {
            next = moveTableauToTableau(st, drag.info.col, drag.info.cardIndex, toCol);
          }
          if (next) setState(next);
          return;
        }
        if (node.hasAttribute("data-drop-foundation")) {
          let next: GameState | null = null;
          if (drag.info.source === "waste") {
            next = moveWasteToFoundation(st);
          } else {
            const col = st.tableau[drag.info.col];
            if (drag.info.cardIndex === col.length - 1) {
              next = moveTableauToFoundation(st, drag.info.col);
            }
          }
          if (next) setState(next);
          return;
        }
        node = node.parentElement;
      }
    };

    const onCancel = () => {
      activeDragRef.current = null;
      setGhostPos(null);
      setDragCards([]);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onCancel);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
    };
  }, []);

  const reset = useCallback(() => {
    setAutoCompleting(false);
    activeDragRef.current = null;
    setGhostPos(null);
    setDragCards([]);
    setState(newGame());
  }, []);

  const apply = useCallback((next: GameState | null) => {
    if (next) setState(next);
  }, []);

  if (!state) {
    return <div style={{ padding: 40 }}>配牌中…</div>;
  }

  // Start dragging a waste card
  const handleWastePointerDown = (e: React.PointerEvent) => {
    const top = state.waste[state.waste.length - 1];
    if (!top) return;
    // e.preventDefault() は iOS Safari で後続の pointermove を止めるため呼ばない。
    // スクロール抑制は touch-action: none CSS で行う。
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId); // 指が素早く動いてもイベントを取りこぼさない
    const rect = el.getBoundingClientRect();
    activeDragRef.current = {
      info: { source: "waste" },
      cards: [top],
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    setDragCards([top]);
    setGhostPos({ x: rect.left, y: rect.top });
  };

  // Start dragging a tableau card (and all cards below it)
  const handleTableauPointerDown = (
    e: React.PointerEvent,
    col: number,
    cardIndex: number
  ) => {
    const column = state.tableau[col];
    const card = column[cardIndex];
    if (!card.faceUp) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const cards = column.slice(cardIndex);
    activeDragRef.current = {
      info: { source: "tableau", col, cardIndex },
      cards,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    setDragCards(cards);
    setGhostPos({ x: rect.left, y: rect.top });
  };

  // Double-tap / double-click auto-send to foundation
  const autoSendWaste = () => apply(autoMoveToFoundation(state, { type: "waste" }));
  const autoSendTableau = (col: number) =>
    apply(autoMoveToFoundation(state, { type: "tableau", col }));

  const wasteTop = state.waste[state.waste.length - 1];

  return (
    <div className="board">
      <header className="hud">
        <h1>Klondike</h1>
        <div className="stats">
          <span>手数: {state.moves}</span>
          <button
            onClick={() => setAutoCompleting(true)}
            disabled={!canAutoComplete(state) || autoCompleting}
            title="山札が空で場札がすべて表向きのとき使用可能"
          >
            自動補完
          </button>
          <button onClick={reset}>新しいゲーム</button>
        </div>
      </header>

      {state.won && (
        <div className="win-banner">
          <div className="win-text">🎉 クリア！おめでとうございます</div>
          <button className="play-again" onClick={reset}>
            もう一度遊ぶ
          </button>
        </div>
      )}

      <div className="top-row">
        {/* Stock & Waste */}
        <div className="left-piles">
          <div
            className="slot stock"
            onClick={() => setState(drawFromStock(state))}
          >
            {state.stock.length > 0 ? (
              <div className="card card-back" />
            ) : (
              <div className="recycle">↻</div>
            )}
          </div>
          <div className="slot">
            {wasteTop && (
              <Card
                card={wasteTop}
                onPointerDown={handleWastePointerDown}
                onDoubleClick={autoSendWaste}
              />
            )}
          </div>
        </div>

        {/* Foundations */}
        <div className="foundations">
          {SUITS.map((suit) => (
            <FoundationSlot
              key={suit}
              suit={suit}
              pile={state.foundations[suit]}
            />
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="tableau">
        {state.tableau.map((col, colIndex) => (
          <div
            key={colIndex}
            className="column"
            data-drop-col={colIndex}
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
                  onPointerDown={
                    card.faceUp
                      ? (e) => handleTableauPointerDown(e, colIndex, cardIndex)
                      : undefined
                  }
                  onDoubleClick={
                    card.faceUp && cardIndex === col.length - 1
                      ? () => autoSendTableau(colIndex)
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Drag ghost element */}
      {ghostPos && dragCards.length > 0 && (
        <div
          className="drag-ghost"
          style={{ left: ghostPos.x, top: ghostPos.y }}
        >
          {dragCards.map((card, i) => (
            <div
              key={card.id}
              style={{
                position: i === 0 ? "relative" : "absolute",
                top: i === 0 ? 0 : `${i * 26}px`,
                left: 0,
              }}
            >
              <Card card={card} />
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .board {
          position: relative;
          z-index: 1;
          max-width: 1000px;
          margin: 0 auto;
          padding: 12px 10px 60px;
          --card-w: 70px;
          --card-h: 98px;
          /* ボード全体でスクロールをブロックしてドラッグを優先させる */
          touch-action: none;
        }
        @media (max-width: 520px) {
          .board {
            padding: 8px 4px 40px;
            /* 7列 × card-w + 6gaps × 4px + 8px padding = 100vw を解くと card-w = (100vw - 32px) / 7 */
            --card-w: calc((100vw - 32px) / 7);
            --card-h: calc(var(--card-w) * 1.4);
          }
          .tableau {
            gap: 4px;
          }
          .left-piles,
          .foundations {
            gap: 4px;
          }
          .top-row {
            gap: 4px;
            margin-bottom: 10px;
          }
        }
        .hud {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }
        h1 {
          font-size: 22px;
          letter-spacing: 1px;
          color: var(--gold);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        .stats {
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 14px;
          flex-wrap: wrap;
        }
        button {
          font-family: inherit;
          background: var(--gold);
          color: #2a1a05;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 4px var(--shadow);
          font-size: 14px;
        }
        button:hover {
          filter: brightness(1.08);
        }
        button:disabled {
          opacity: 0.4;
          cursor: default;
          filter: none;
        }
        .win-banner {
          background: var(--gold);
          color: #2a1a05;
          text-align: center;
          padding: 16px 12px;
          border-radius: 10px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .win-text {
          font-size: 18px;
          font-weight: bold;
        }
        .play-again {
          font-size: 16px;
          padding: 12px 28px;
          border-radius: 8px;
          background: #2a1a05;
          color: var(--gold);
          font-weight: bold;
        }
        .play-again:hover {
          filter: brightness(1.15);
        }
        .top-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 8px;
        }
        .left-piles,
        .foundations {
          display: flex;
          gap: 8px;
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
          gap: 8px;
        }
        .column {
          position: relative;
          min-height: var(--card-h);
        }
        .stacked {
          position: absolute;
          left: 0;
          width: 100%;
          touch-action: none;
        }
        .empty {
          width: 100%;
        }
        .drag-ghost {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.88;
          transform: rotate(2deg);
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

function FoundationSlot({
  suit,
  pile,
}: {
  suit: Suit;
  pile: GameState["foundations"][Suit];
}) {
  const top = pile[pile.length - 1];
  return (
    <div className="slot" data-drop-foundation>
      {top ? (
        <Card card={top} />
      ) : (
        <span style={{ fontSize: 26, opacity: 0.3 }}>{SUIT_SYMBOL[suit]}</span>
      )}
      <style jsx>{`
        .slot {
          width: var(--card-w, 80px);
          height: var(--card-h, 112px);
          border-radius: 8px;
          background: var(--slot);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
