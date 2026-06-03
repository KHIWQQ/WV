import { sma, ema, rsi, macd, heikinAshi } from "./indicators";

describe("sma", () => {
  it("returns null until the window fills, then the average", () => {
    expect(sma([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
  });
  it("handles period of 1 as identity", () => {
    expect(sma([5, 6, 7], 1)).toEqual([5, 6, 7]);
  });
});

describe("ema", () => {
  it("seeds with SMA then applies the smoothing factor", () => {
    const out = ema([1, 2, 3, 4, 5], 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBeCloseTo(2, 5); // SMA seed of first 3
    // k = 2/(3+1) = 0.5 → 4*0.5 + 2*0.5 = 3
    expect(out[3]).toBeCloseTo(3, 5);
    expect(out[4]).toBeCloseTo(4, 5);
  });
  it("returns all null when fewer points than period", () => {
    expect(ema([1, 2], 5)).toEqual([null, null]);
  });
});

describe("rsi", () => {
  it("is 100 when prices only rise", () => {
    const closes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const out = rsi(closes, 14);
    expect(out[13]).toBeNull(); // not enough yet (index < period)
    expect(out[14]).toBeCloseTo(100, 5);
    expect(out[15]).toBeCloseTo(100, 5);
  });
  it("stays within 0–100", () => {
    const closes = [10, 11, 9, 12, 8, 13, 7, 14, 6, 15, 5, 16, 4, 17, 3, 18];
    rsi(closes, 14).forEach((v) => {
      if (v != null) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    });
  });
});

describe("macd", () => {
  it("aligns output with input and computes hist = macd - signal", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 5);
    const out = macd(closes);
    expect(out).toHaveLength(60);
    const last = out[59];
    expect(last.macd).not.toBeNull();
    expect(last.signal).not.toBeNull();
    expect(last.hist).toBeCloseTo((last.macd as number) - (last.signal as number), 6);
  });
});

describe("heikinAshi", () => {
  it("first candle open is the average of raw open/close", () => {
    const bars = [{ open: 10, high: 12, low: 9, close: 11 }];
    const ha = heikinAshi(bars);
    expect(ha[0].close).toBeCloseTo((10 + 12 + 9 + 11) / 4, 6);
    expect(ha[0].open).toBeCloseTo((10 + 11) / 2, 6);
    expect(ha[0].high).toBeGreaterThanOrEqual(ha[0].open);
    expect(ha[0].low).toBeLessThanOrEqual(ha[0].open);
  });
});
