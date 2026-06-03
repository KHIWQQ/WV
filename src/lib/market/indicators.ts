// Pure technical-indicator math for the Pro market chart. All functions take a
// numeric series and return an array aligned 1:1 with the input (null where
// there isn't enough data yet), so callers can zip them back onto timestamps.

/** Simple moving average. */
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** Exponential moving average, seeded with the SMA of the first `period`. */
export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = 0;
  let seed = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period) {
      seed += values[i];
      if (i === period - 1) {
        prev = seed / period;
        out[i] = prev;
      }
      continue;
    }
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder's Relative Strength Index (0–100). */
export function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export interface MacdPoint {
  macd: number | null;
  signal: number | null;
  hist: number | null;
}

/** MACD line (fast EMA − slow EMA), signal EMA, and histogram. */
export function macd(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): MacdPoint[] {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const out: MacdPoint[] = closes.map(() => ({ macd: null, signal: null, hist: null }));

  // MACD line where both EMAs exist; run the signal EMA over those values only.
  const idxs: number[] = [];
  const macdVals: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (emaFast[i] != null && emaSlow[i] != null) {
      idxs.push(i);
      macdVals.push((emaFast[i] as number) - (emaSlow[i] as number));
    }
  }
  const sig = ema(macdVals, signalPeriod);
  idxs.forEach((origIdx, j) => {
    const m = macdVals[j];
    const s = sig[j];
    out[origIdx] = { macd: m, signal: s, hist: s != null ? m - s : null };
  });
  return out;
}

export interface OhlcBar {
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Heikin-Ashi smoothed candles derived from raw OHLC bars. */
export function heikinAshi(bars: OhlcBar[]): OhlcBar[] {
  const out: OhlcBar[] = [];
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const close = (b.open + b.high + b.low + b.close) / 4;
    const open = i === 0 ? (b.open + b.close) / 2 : (out[i - 1].open + out[i - 1].close) / 2;
    const high = Math.max(b.high, open, close);
    const low = Math.min(b.low, open, close);
    out.push({ open, high, low, close });
  }
  return out;
}
