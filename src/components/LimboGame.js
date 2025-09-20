import React, { useState, useRef, useEffect } from 'react';

/*
  Game Logic:
  multiplier(t) = exp(GROWTH_RATE * t)
  - Starts at 1.00×
  - Increases smoothly using requestAnimationFrame
  - A hidden crashMultiplier is randomly generated each round
  - If current >= crashMultiplier → crash (loss)
  - If current >= targetMultiplier before crash → auto cash out (win)
*/

const GROWTH_RATE = 0.8; // Adjust for faster/slower growth

function formatMoney(x) {
  return Number(x).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatMult(x) {
  return x.toFixed(2) + '×';
}

function generateCrashMultiplier() {
  // Random crash between ~1.01 and ~12.0, biased towards smaller numbers
  const r = Math.random();
  const crash = 1 + Math.pow(r, 3) * 11;
  return Math.max(1.01, +(crash.toFixed(2)));
}

export default function LimboGame() {
  const [bet, setBet] = useState('10');
  const [target, setTarget] = useState('2');
  const [running, setRunning] = useState(false);
  const [currentMult, setCurrentMult] = useState(1);
  const [crashMult, setCrashMult] = useState(null);
  const [result, setResult] = useState(null); // {win: bool, payout: number}
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem('limbo_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const rafRef = useRef(null);
  const startRef = useRef(null);
  const cashedRef = useRef(false);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('limbo_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function resetRound() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    rafRef.current = null;
    cashedRef.current = false;
    setRunning(false);
    setCurrentMult(1);
    setCrashMult(null);
    setResult(null);
  }

  function placeBet() {
    const betAmt = parseFloat(bet);
    const targetMult = parseFloat(target);

    if (isNaN(betAmt) || betAmt <= 0) {
      alert('Enter a valid bet amount (> 0)');
      return;
    }
    if (isNaN(targetMult) || targetMult <= 1.0) {
      alert('Enter a valid target multiplier (> 1.0)');
      return;
    }

    const crash = generateCrashMultiplier();
    setCrashMult(crash);
    setRunning(true);
    setResult(null);
    setCurrentMult(1);
    cashedRef.current = false;

    const start = performance.now();
    startRef.current = start;

    function tick(now) {
      const elapsed = (now - startRef.current) / 1000;
      const curr = Math.exp(GROWTH_RATE * elapsed);

      if (curr >= crash) {
        setCurrentMult(crash);
        setRunning(false);
        if (!cashedRef.current) {
          setResult({ win: false, payout: 0 });
        }
        setHistory(prev => [crash, ...prev].slice(0, 5));
        return;
      }

      if (!cashedRef.current && curr >= targetMult) {
        cashedRef.current = true;
        setCurrentMult(targetMult);
        setRunning(false);
        const payout = +(betAmt * targetMult).toFixed(2);
        setResult({ win: true, payout });
        setHistory(prev => [crash, ...prev].slice(0, 5));
        return;
      }

      setCurrentMult(curr);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
  }

  return (
    <div className="limbo-card">
      <div className="controls">
        <div className="inputs">
          <label>
            Bet Amount
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={bet}
              onChange={e => setBet(e.target.value)}
              disabled={running}
            />
          </label>

          <label>
            Target Multiplier
            <input
              type="number"
              min="1.01"
              step="0.01"
              value={target}
              onChange={e => setTarget(e.target.value)}
              disabled={running}
            />
          </label>

          <div className="buttons">
            <button onClick={placeBet} disabled={running} className="place">
              Place Bet
            </button>
            <button onClick={resetRound} className="reset">
              Reset
            </button>
          </div>
        </div>

        <div className="status">
          <div className="mult-display">
            <div
              className={`mult-value ${
                result ? (result.win ? 'win' : 'lose') : ''
              }`}
            >
              {formatMult(currentMult)}
            </div>
            <div className="muted">Live multiplier</div>
          </div>

          <div className="round-info">
            <div>
              Hidden crash: {crashMult ? formatMult(crashMult) : '—'}
            </div>
            <div>Target: {target ? formatMult(parseFloat(target)) : '—'}</div>
            <div>Bet: {bet ? formatMoney(bet) : '—'}</div>
          </div>
        </div>
      </div>

      <div className="result-area">
        {result ? (
          result.win ? (
            <div className="result win">
              🎉 You won! Payout: <b>{formatMoney(result.payout)}</b>
            </div>
          ) : (
            <div className="result lose">💥 Crashed — You lost this round.</div>
          )
        ) : (
          <div className="result idle">
            Place a bet and watch the multiplier grow — auto cashout at your
            target.
          </div>
        )}
      </div>

      <div className="history">
        <h3>Last crash multipliers</h3>
        {history.length === 0 ? (
          <div className="muted">No rounds yet</div>
        ) : (
          <ul>
            {history.map((h, i) => (
              <li key={i}>{formatMult(h)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
