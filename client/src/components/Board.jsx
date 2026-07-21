import { useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../store/gameStore.js';

// The chessboard: drag-and-drop AND click-to-move, legal-move hint dots, a
// last-move highlight, and the coach's plan arrows. react-chessboard renders
// LTR, so we wrap it to stay immune to the RTL page direction.
export default function Board() {
  const fen = useGameStore((s) => s.fen);
  const playerColor = useGameStore((s) => s.playerColor);
  const lastMove = useGameStore((s) => s.lastMove);
  const arrows = useGameStore((s) => s.coach.arrows);
  const hintArrow = useGameStore((s) => s.hintArrow);
  const threat = useGameStore((s) => s.threat);
  const onPlayerDrop = useGameStore((s) => s.onPlayerDrop);
  const movesFrom = useGameStore((s) => s.movesFrom);

  // Coach plan arrows (indigo), the on-demand hint arrow (green), and the
  // opponent's threat arrow (red) rendered together.
  const allArrows = useMemo(() => {
    const a = [...(arrows || [])];
    if (hintArrow) a.push([hintArrow.from, hintArrow.to, 'rgba(34, 197, 94, 0.95)']);
    if (threat) a.push([threat.from, threat.to, 'rgba(239, 68, 68, 0.92)']);
    return a;
  }, [arrows, hintArrow, threat]);

  const [selected, setSelected] = useState(null);
  const [hints, setHints] = useState([]);

  // Measure the framed wrapper so the board fills it exactly (react-chessboard
  // needs an explicit pixel width). The p-2 padding is 8px each side.
  const wrapRef = useRef(null);
  const [boardWidth, setBoardWidth] = useState(480);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setBoardWidth(Math.max(240, Math.floor(el.clientWidth - 16)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Clear any selection whenever the position changes (move made, new game).
  useEffect(() => {
    setSelected(null);
    setHints([]);
  }, [fen]);

  const squareStyles = useMemo(() => {
    const styles = {};
    if (lastMove) {
      const hl = { background: 'rgba(129, 140, 248, 0.32)' };
      styles[lastMove.from] = { ...hl };
      styles[lastMove.to] = { ...hl };
    }
    if (selected) {
      styles[selected] = { background: 'rgba(99, 102, 241, 0.45)' };
    }
    for (const h of hints) {
      styles[h.to] = h.capture
        ? {
            ...styles[h.to],
            background:
              'radial-gradient(circle, transparent 55%, rgba(99,102,241,0.55) 56%, rgba(99,102,241,0.55) 66%, transparent 67%)',
            borderRadius: '4px',
          }
        : {
            ...styles[h.to],
            backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.6) 20%, transparent 21%)',
          };
    }
    // Flag the endangered piece under a threat.
    if (threat?.square) {
      styles[threat.square] = {
        ...styles[threat.square],
        background: 'rgba(239, 68, 68, 0.42)',
        boxShadow: 'inset 0 0 0 3px rgba(239,68,68,0.85)',
      };
    }
    return styles;
  }, [lastMove, selected, hints, threat]);

  const tryMove = (from, to) => {
    const ok = onPlayerDrop(from, to);
    setSelected(null);
    setHints([]);
    return ok;
  };

  const handleSquareClick = (square) => {
    // Complete a move if the clicked square is a legal target of the selection.
    if (selected && hints.some((h) => h.to === square)) {
      tryMove(selected, square);
      return;
    }
    const moves = movesFrom(square);
    if (moves.length) {
      setSelected(square);
      setHints(moves);
    } else {
      setSelected(null);
      setHints([]);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="board-ltr w-full rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent p-2 ring-1 ring-white/10"
    >
      <Chessboard
        position={fen}
        boardWidth={boardWidth}
        boardOrientation={playerColor === 'w' ? 'white' : 'black'}
        onPieceDrop={(from, to) => tryMove(from, to)}
        onSquareClick={handleSquareClick}
        onPieceDragBegin={(_piece, square) => {
          const moves = movesFrom(square);
          setSelected(square);
          setHints(moves);
        }}
        customArrows={allArrows}
        customArrowColor="rgba(129, 140, 248, 0.9)"
        customSquareStyles={squareStyles}
        customBoardStyle={{ borderRadius: '12px', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.7)' }}
        customDarkSquareStyle={{ backgroundColor: '#6c9350' }}
        customLightSquareStyle={{ backgroundColor: '#e9edcc' }}
        customDropSquareStyle={{ boxShadow: 'inset 0 0 0 4px rgba(99,102,241,0.7)' }}
        animationDuration={300}
      />
    </div>
  );
}
