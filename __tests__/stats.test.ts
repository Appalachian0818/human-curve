import { erf, normalCDF, computePercentile, normalCurvePoints, ordinalSuffix } from "../lib/stats";

describe("erf", () => {
  it("erf(0) = 0", () => {
    expect(erf(0)).toBeCloseTo(0, 5);
  });

  it("erf(∞) ≈ 1", () => {
    expect(erf(10)).toBeCloseTo(1, 5);
  });

  it("erf(-∞) ≈ -1", () => {
    expect(erf(-10)).toBeCloseTo(-1, 5);
  });

  it("erf(1) ≈ 0.8427", () => {
    expect(erf(1)).toBeCloseTo(0.8427, 3);
  });

  it("is an odd function: erf(-x) = -erf(x)", () => {
    expect(erf(-0.5)).toBeCloseTo(-erf(0.5), 6);
    expect(erf(-2)).toBeCloseTo(-erf(2), 6);
  });
});

describe("normalCDF", () => {
  it("P(Z ≤ 0) = 0.5", () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 5);
  });

  it("P(Z ≤ +∞) ≈ 1", () => {
    expect(normalCDF(10)).toBeCloseTo(1, 5);
  });

  it("P(Z ≤ -∞) ≈ 0", () => {
    expect(normalCDF(-10)).toBeCloseTo(0, 5);
  });

  it("P(Z ≤ 1.645) ≈ 0.95 (95th percentile)", () => {
    expect(normalCDF(1.645)).toBeCloseTo(0.95, 2);
  });

  it("P(Z ≤ -1.645) ≈ 0.05 (5th percentile)", () => {
    expect(normalCDF(-1.645)).toBeCloseTo(0.05, 2);
  });

  it("P(Z ≤ 1.96) ≈ 0.975", () => {
    expect(normalCDF(1.96)).toBeCloseTo(0.975, 2);
  });
});

describe("computePercentile", () => {
  it("returns 50 for the mean value", () => {
    expect(computePercentile(100, 100, 10)).toBe(50);
  });

  it("returns ~84 for mean + 1 stddev", () => {
    expect(computePercentile(110, 100, 10)).toBeCloseTo(84, 0);
  });

  it("returns ~16 for mean - 1 stddev", () => {
    expect(computePercentile(90, 100, 10)).toBeCloseTo(16, 0);
  });

  it("returns ~98 for mean + 2 stddev", () => {
    expect(computePercentile(120, 100, 10)).toBeCloseTo(98, 0);
  });

  it("returns ~2 for mean - 2 stddev", () => {
    expect(computePercentile(80, 100, 10)).toBeCloseTo(2, 0);
  });

  it("returns 50 when stddev is 0 (edge case)", () => {
    expect(computePercentile(100, 100, 0)).toBe(50);
  });

  it("returns a value between 0 and 100", () => {
    for (const val of [0, 50, 100, 150, 200]) {
      const p = computePercentile(val, 100, 15);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });
});

describe("normalCurvePoints", () => {
  it("returns the requested number of points", () => {
    const pts = normalCurvePoints(0, 1, 100);
    expect(pts).toHaveLength(100);
  });

  it("peak is at the mean", () => {
    const mean = 43;
    const stddev = 3;
    const pts = normalCurvePoints(mean, stddev, 200);
    // The highest y value should be near the mean
    const maxPt = pts.reduce((best, p) => (p.y > best.y ? p : best), pts[0]);
    expect(maxPt.x).toBeCloseTo(mean, 0);
  });

  it("all y values are positive", () => {
    const pts = normalCurvePoints(170, 10, 100);
    for (const p of pts) {
      expect(p.y).toBeGreaterThan(0);
    }
  });

  it("x range spans approximately ±3.5 stddevs", () => {
    const mean = 50;
    const stddev = 5;
    const pts = normalCurvePoints(mean, stddev, 100);
    expect(pts[0].x).toBeCloseTo(mean - 3.5 * stddev, 0);
    expect(pts[pts.length - 1].x).toBeCloseTo(mean + 3.5 * stddev, 0);
  });
});

describe("ordinalSuffix", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
    [50, "50th"],
    [100, "100th"],
    [101, "101st"],
  ])("ordinalSuffix(%i) = %s", (n, expected) => {
    expect(ordinalSuffix(n)).toBe(expected);
  });
});
