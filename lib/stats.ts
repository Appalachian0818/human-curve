/**
 * Statistics utilities: Normal CDF, percentile computation.
 */

/**
 * Error function approximation (Horner's method).
 * Accurate to ~1.2e-7 for all real x.
 */
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

/**
 * Standard normal CDF: P(X ≤ z) for X ~ N(0,1).
 */
export function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/**
 * Compute percentile (0–100) of a value given a normal distribution.
 */
export function computePercentile(
  value: number,
  mean: number,
  stddev: number
): number {
  if (stddev <= 0) return 50;
  const z = (value - mean) / stddev;
  return Math.round(normalCDF(z) * 100);
}

/**
 * Generate x,y points for a normal distribution curve.
 * Returns arrays suitable for Chart.js.
 */
export function normalCurvePoints(
  mean: number,
  stddev: number,
  numPoints = 100
): { x: number; y: number }[] {
  const minX = mean - 3.5 * stddev;
  const maxX = mean + 3.5 * stddev;
  const step = (maxX - minX) / (numPoints - 1);
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = minX + i * step;
    const exponent = -((x - mean) ** 2) / (2 * stddev ** 2);
    const y = (1 / (stddev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    points.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(6)) });
  }
  return points;
}

/**
 * Ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
