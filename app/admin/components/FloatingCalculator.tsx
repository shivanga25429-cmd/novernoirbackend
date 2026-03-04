'use client';
import { useState, useCallback } from 'react';
import { Calculator, X } from 'lucide-react';

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

export default function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);

  const compute = useCallback((a: number, operator: string, b: number): number => {
    switch (operator) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? 0 : a / b;
      default: return b;
    }
  }, []);

  const fmt = (n: number) => {
    const s = String(parseFloat(n.toPrecision(10)));
    return s.length > 12 ? n.toExponential(4) : s;
  };

  const press = (btn: string) => {
    if (btn === 'C') {
      setDisplay('0'); setStored(null); setOp(null); setFresh(false);
      return;
    }
    if (btn === '⌫') {
      setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'));
      return;
    }
    if (btn === '±') {
      setDisplay((d) => fmt(-parseFloat(d)));
      return;
    }
    if (btn === '%') {
      setDisplay((d) => fmt(parseFloat(d) / 100));
      return;
    }
    if (['+', '−', '×', '÷'].includes(btn)) {
      const cur = parseFloat(display);
      if (stored !== null && op && !fresh) {
        const result = compute(stored, op, cur);
        setStored(result);
        setDisplay(fmt(result));
      } else {
        setStored(cur);
      }
      setOp(btn);
      setFresh(true);
      return;
    }
    if (btn === '=') {
      if (stored !== null && op) {
        const result = compute(stored, op, parseFloat(display));
        setDisplay(fmt(result));
        setStored(null); setOp(null); setFresh(false);
      }
      return;
    }
    // digit / dot
    if (btn === '.' && display.includes('.') && !fresh) return;
    setDisplay((d) => {
      if (fresh || d === '0') return btn === '.' ? '0.' : btn;
      return d.length < 12 ? d + btn : d;
    });
    setFresh(false);
  };

  const isOp  = (b: string) => ['+', '−', '×', '÷'].includes(b);
  const isEq  = (b: string) => b === '=';
  const isMod = (b: string) => ['C', '±', '%'].includes(b);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle calculator"
        style={{ width: 52, height: 52 }}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-amber-400 text-zinc-900 shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
      >
        {open ? <X className="w-5 h-5" /> : <Calculator className="w-5 h-5" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-64 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700 bg-zinc-900">
          {/* Display */}
          <div className="bg-zinc-800 px-4 py-4 text-right">
            <p className="text-xs text-zinc-500 h-4">
              {stored !== null && op ? `${fmt(stored)} ${op}` : ''}
            </p>
            <p className="text-3xl font-light text-zinc-100 truncate">{display}</p>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-px bg-zinc-700">
            {BUTTONS.flat().map((btn, i) => (
              <button
                key={i}
                onClick={() => press(btn)}
                className={`py-4 text-sm font-medium transition-colors
                  ${isEq(btn)
                    ? 'bg-amber-400 text-zinc-900 hover:bg-amber-300'
                    : isOp(btn)
                      ? 'bg-zinc-700 text-amber-400 hover:bg-zinc-600'
                      : isMod(btn)
                        ? 'bg-zinc-600 text-zinc-100 hover:bg-zinc-500'
                        : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                  }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
