/**
 * SAMPLE / SYNTHETIC DATASET — not real measurements.
 * Replace with actual anthropometric research data for production.
 *
 * Structure: mean ± stddev (cm) for each metric,
 * segmented by country × sex × ageRange.
 *
 * Sources for real data:
 *  - NHANES (US): https://www.cdc.gov/nchs/nhanes/
 *  - KKNHIS (Korea), KNHANES
 *  - WHO global database
 *  - CAESAR anthropometric database (Europe)
 */

export type Sex = "male" | "female" | "other";
export type AgeRange = "18-24" | "25-34" | "35-44" | "45-54" | "55+";
export type Country =
  | "Global"
  | "USA"
  | "South Korea"
  | "Japan"
  | "Germany"
  | "Brazil";

export interface MetricStats {
  mean: number;
  stddev: number;
}

export interface DemographicStats {
  shoulderWidthCm: MetricStats;
  hipWidthCm: MetricStats;
  legLengthCm: MetricStats;
  torsoLengthCm: MetricStats;
  armLengthCm: MetricStats;
  wingspanCm: MetricStats;
  shoulderToHipRatio: MetricStats;
  legToTorsoRatio: MetricStats;
}

export type DatasetKey = `${Country}|${Sex}|${AgeRange}`;

// ---------------------------------------------------------------------------
// Helper to generate dataset entries with slight regional variation
// ---------------------------------------------------------------------------
function entry(
  shoulder: [number, number],
  hip: [number, number],
  leg: [number, number],
  torso: [number, number],
  arm: [number, number]
): DemographicStats {
  const [sm, ss] = shoulder;
  const [hm, hs] = hip;
  const [lm, ls] = leg;
  const [tm, ts] = torso;
  const [am, as_] = arm;
  const wingspan = arm[0] * 2 + shoulder[0];
  return {
    shoulderWidthCm: { mean: sm, stddev: ss },
    hipWidthCm: { mean: hm, stddev: hs },
    legLengthCm: { mean: lm, stddev: ls },
    torsoLengthCm: { mean: tm, stddev: ts },
    armLengthCm: { mean: am, stddev: as_ },
    wingspanCm: { mean: wingspan, stddev: Math.sqrt(ss ** 2 + 2 * as_ ** 2) },
    shoulderToHipRatio: {
      mean: sm / hm,
      stddev: 0.05,
    },
    legToTorsoRatio: {
      mean: lm / tm,
      stddev: 0.08,
    },
  };
}

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------
export const DATASET: Record<DatasetKey, DemographicStats> = {
  // ---- GLOBAL ----
  "Global|male|18-24": entry([43, 3.2], [35, 2.8], [80, 5.0], [52, 3.5], [60, 4.0]),
  "Global|male|25-34": entry([43.5, 3.2], [35.5, 2.9], [79, 5.0], [52.5, 3.5], [60.5, 4.0]),
  "Global|male|35-44": entry([43.2, 3.3], [36, 3.0], [78, 5.1], [52.3, 3.5], [60.2, 4.0]),
  "Global|male|45-54": entry([42.8, 3.3], [36.5, 3.1], [77, 5.2], [52, 3.6], [59.8, 4.1]),
  "Global|male|55+":   entry([42, 3.4], [36.8, 3.2], [75, 5.3], [51.5, 3.6], [59, 4.2]),
  "Global|female|18-24": entry([38, 2.8], [37, 3.2], [74, 4.5], [48, 3.2], [55, 3.5]),
  "Global|female|25-34": entry([38.2, 2.8], [37.5, 3.2], [73, 4.5], [48.2, 3.2], [55.2, 3.5]),
  "Global|female|35-44": entry([38, 2.9], [38, 3.3], [72, 4.6], [48, 3.3], [55, 3.5]),
  "Global|female|45-54": entry([37.8, 2.9], [38.5, 3.4], [71, 4.6], [47.8, 3.3], [54.8, 3.5]),
  "Global|female|55+":   entry([37, 3.0], [38.8, 3.5], [69, 4.7], [47.5, 3.4], [54, 3.6]),
  "Global|other|18-24": entry([40, 3.5], [36, 3.0], [77, 5.0], [50, 3.5], [57, 4.0]),
  "Global|other|25-34": entry([40, 3.5], [36, 3.0], [76, 5.0], [50, 3.5], [57, 4.0]),
  "Global|other|35-44": entry([40, 3.5], [36.5, 3.0], [75, 5.0], [50, 3.5], [57, 4.0]),
  "Global|other|45-54": entry([39.5, 3.5], [37, 3.1], [74, 5.0], [49.5, 3.5], [56.5, 4.0]),
  "Global|other|55+":   entry([39, 3.5], [37, 3.1], [72, 5.0], [49, 3.5], [56, 4.0]),

  // ---- USA ----
  "USA|male|18-24": entry([45, 3.3], [36.5, 3.0], [82, 5.2], [53, 3.5], [62, 4.2]),
  "USA|male|25-34": entry([45.5, 3.3], [37, 3.1], [81, 5.2], [53.5, 3.5], [62.5, 4.2]),
  "USA|male|35-44": entry([45.2, 3.4], [37.5, 3.2], [80, 5.3], [53.2, 3.6], [62.2, 4.2]),
  "USA|male|45-54": entry([44.8, 3.4], [38, 3.3], [79, 5.3], [53, 3.6], [61.8, 4.3]),
  "USA|male|55+":   entry([44, 3.5], [38.5, 3.4], [77, 5.4], [52.5, 3.7], [61, 4.3]),
  "USA|female|18-24": entry([39.5, 2.9], [38.5, 3.4], [75, 4.7], [49, 3.3], [56.5, 3.6]),
  "USA|female|25-34": entry([39.8, 2.9], [39, 3.4], [74, 4.7], [49.2, 3.3], [56.8, 3.6]),
  "USA|female|35-44": entry([39.5, 3.0], [39.5, 3.5], [73, 4.8], [49, 3.4], [56.5, 3.7]),
  "USA|female|45-54": entry([39.2, 3.0], [40, 3.6], [72, 4.8], [48.8, 3.4], [56.2, 3.7]),
  "USA|female|55+":   entry([38.5, 3.1], [40.5, 3.7], [70, 4.9], [48.5, 3.5], [55.5, 3.8]),
  "USA|other|18-24": entry([42, 3.5], [37, 3.2], [78, 5.0], [51, 3.5], [59, 4.0]),
  "USA|other|25-34": entry([42, 3.5], [37.5, 3.2], [77, 5.0], [51, 3.5], [59, 4.0]),
  "USA|other|35-44": entry([41.8, 3.5], [38, 3.2], [76, 5.0], [50.8, 3.5], [58.8, 4.0]),
  "USA|other|45-54": entry([41.5, 3.5], [38.5, 3.3], [75, 5.0], [50.5, 3.5], [58.5, 4.0]),
  "USA|other|55+":   entry([41, 3.5], [38.8, 3.3], [73, 5.0], [50, 3.5], [58, 4.0]),

  // ---- SOUTH KOREA ----
  "South Korea|male|18-24": entry([42, 3.0], [33, 2.5], [80, 4.8], [51, 3.2], [60, 3.8]),
  "South Korea|male|25-34": entry([42.3, 3.0], [33.5, 2.6], [79, 4.8], [51.5, 3.2], [60.3, 3.8]),
  "South Korea|male|35-44": entry([42, 3.1], [34, 2.7], [78, 4.9], [51.2, 3.3], [60, 3.9]),
  "South Korea|male|45-54": entry([41.5, 3.1], [34.5, 2.8], [77, 5.0], [51, 3.3], [59.5, 3.9]),
  "South Korea|male|55+":   entry([41, 3.2], [35, 2.9], [75, 5.1], [50.5, 3.4], [59, 4.0]),
  "South Korea|female|18-24": entry([36.5, 2.6], [35, 2.9], [72, 4.3], [46.5, 3.0], [53, 3.3]),
  "South Korea|female|25-34": entry([36.8, 2.6], [35.5, 3.0], [71, 4.3], [46.8, 3.0], [53.3, 3.3]),
  "South Korea|female|35-44": entry([36.5, 2.7], [36, 3.1], [70, 4.4], [46.5, 3.1], [53, 3.4]),
  "South Korea|female|45-54": entry([36.2, 2.7], [36.5, 3.2], [69, 4.4], [46.2, 3.1], [52.8, 3.4]),
  "South Korea|female|55+":   entry([35.5, 2.8], [37, 3.3], [67, 4.5], [46, 3.2], [52, 3.5]),
  "South Korea|other|18-24": entry([39, 3.2], [34, 2.7], [76, 4.5], [49, 3.1], [56, 3.6]),
  "South Korea|other|25-34": entry([39, 3.2], [34, 2.7], [75, 4.5], [49, 3.1], [56, 3.6]),
  "South Korea|other|35-44": entry([38.8, 3.2], [34.5, 2.8], [74, 4.5], [48.8, 3.1], [55.8, 3.6]),
  "South Korea|other|45-54": entry([38.5, 3.2], [35, 2.9], [73, 4.5], [48.5, 3.2], [55.5, 3.7]),
  "South Korea|other|55+":   entry([38, 3.3], [35.5, 3.0], [71, 4.6], [48, 3.2], [55, 3.7]),

  // ---- JAPAN ----
  "Japan|male|18-24": entry([41.5, 2.9], [32.5, 2.4], [79, 4.7], [50.5, 3.1], [59.5, 3.7]),
  "Japan|male|25-34": entry([41.8, 2.9], [33, 2.5], [78, 4.7], [51, 3.1], [59.8, 3.7]),
  "Japan|male|35-44": entry([41.5, 3.0], [33.5, 2.6], [77, 4.8], [50.8, 3.2], [59.5, 3.8]),
  "Japan|male|45-54": entry([41, 3.0], [34, 2.7], [76, 4.9], [50.5, 3.2], [59, 3.8]),
  "Japan|male|55+":   entry([40.5, 3.1], [34.5, 2.8], [74, 5.0], [50, 3.3], [58.5, 3.9]),
  "Japan|female|18-24": entry([36, 2.5], [34.5, 2.8], [71, 4.2], [46, 2.9], [52.5, 3.2]),
  "Japan|female|25-34": entry([36.2, 2.5], [35, 2.9], [70, 4.2], [46.2, 2.9], [52.8, 3.2]),
  "Japan|female|35-44": entry([36, 2.6], [35.5, 3.0], [69, 4.3], [46, 3.0], [52.5, 3.3]),
  "Japan|female|45-54": entry([35.8, 2.6], [36, 3.1], [68, 4.3], [45.8, 3.0], [52.2, 3.3]),
  "Japan|female|55+":   entry([35, 2.7], [36.5, 3.2], [66, 4.4], [45.5, 3.1], [51.5, 3.4]),
  "Japan|other|18-24": entry([38.5, 3.1], [33.5, 2.6], [75, 4.5], [48.5, 3.0], [56, 3.5]),
  "Japan|other|25-34": entry([38.5, 3.1], [33.5, 2.6], [74, 4.5], [48.5, 3.0], [56, 3.5]),
  "Japan|other|35-44": entry([38.3, 3.1], [34, 2.7], [73, 4.5], [48.3, 3.0], [55.8, 3.5]),
  "Japan|other|45-54": entry([38, 3.1], [34.5, 2.8], [72, 4.5], [48, 3.1], [55.5, 3.6]),
  "Japan|other|55+":   entry([37.5, 3.2], [35, 2.9], [70, 4.6], [47.5, 3.1], [55, 3.6]),

  // ---- GERMANY ----
  "Germany|male|18-24": entry([44.5, 3.2], [35.5, 2.9], [83, 5.2], [53, 3.5], [63, 4.2]),
  "Germany|male|25-34": entry([45, 3.2], [36, 3.0], [82, 5.2], [53.5, 3.5], [63.5, 4.2]),
  "Germany|male|35-44": entry([44.8, 3.3], [36.5, 3.1], [81, 5.3], [53.3, 3.6], [63.2, 4.3]),
  "Germany|male|45-54": entry([44.3, 3.3], [37, 3.2], [80, 5.3], [53, 3.6], [62.8, 4.3]),
  "Germany|male|55+":   entry([43.5, 3.4], [37.5, 3.3], [78, 5.4], [52.5, 3.7], [62, 4.4]),
  "Germany|female|18-24": entry([39, 2.8], [37.5, 3.3], [76, 4.7], [48.5, 3.2], [56, 3.6]),
  "Germany|female|25-34": entry([39.3, 2.8], [38, 3.3], [75, 4.7], [48.8, 3.2], [56.3, 3.6]),
  "Germany|female|35-44": entry([39, 2.9], [38.5, 3.4], [74, 4.8], [48.5, 3.3], [56, 3.7]),
  "Germany|female|45-54": entry([38.8, 2.9], [39, 3.5], [73, 4.8], [48.3, 3.3], [55.8, 3.7]),
  "Germany|female|55+":   entry([38, 3.0], [39.5, 3.6], [71, 4.9], [48, 3.4], [55, 3.8]),
  "Germany|other|18-24": entry([41.5, 3.5], [36.5, 3.1], [79, 5.0], [51, 3.5], [59, 4.0]),
  "Germany|other|25-34": entry([41.5, 3.5], [37, 3.1], [78, 5.0], [51, 3.5], [59, 4.0]),
  "Germany|other|35-44": entry([41.3, 3.5], [37.5, 3.2], [77, 5.0], [50.8, 3.5], [58.8, 4.0]),
  "Germany|other|45-54": entry([41, 3.5], [38, 3.2], [76, 5.0], [50.5, 3.5], [58.5, 4.0]),
  "Germany|other|55+":   entry([40.5, 3.5], [38.3, 3.3], [74, 5.0], [50, 3.5], [58, 4.0]),

  // ---- BRAZIL ----
  "Brazil|male|18-24": entry([43, 3.1], [35, 2.8], [81, 5.0], [52, 3.4], [61, 4.0]),
  "Brazil|male|25-34": entry([43.5, 3.1], [35.5, 2.9], [80, 5.0], [52.5, 3.4], [61.5, 4.0]),
  "Brazil|male|35-44": entry([43.2, 3.2], [36, 3.0], [79, 5.1], [52.3, 3.5], [61.2, 4.1]),
  "Brazil|male|45-54": entry([42.8, 3.2], [36.5, 3.1], [78, 5.1], [52, 3.5], [60.8, 4.1]),
  "Brazil|male|55+":   entry([42, 3.3], [37, 3.2], [76, 5.2], [51.5, 3.6], [60, 4.2]),
  "Brazil|female|18-24": entry([38.5, 2.8], [38, 3.3], [74, 4.6], [48, 3.2], [55.5, 3.5]),
  "Brazil|female|25-34": entry([38.8, 2.8], [38.5, 3.3], [73, 4.6], [48.2, 3.2], [55.8, 3.5]),
  "Brazil|female|35-44": entry([38.5, 2.9], [39, 3.4], [72, 4.7], [48, 3.3], [55.5, 3.6]),
  "Brazil|female|45-54": entry([38.2, 2.9], [39.5, 3.5], [71, 4.7], [47.8, 3.3], [55.2, 3.6]),
  "Brazil|female|55+":   entry([37.5, 3.0], [40, 3.6], [69, 4.8], [47.5, 3.4], [54.5, 3.7]),
  "Brazil|other|18-24": entry([40.5, 3.4], [36.5, 3.1], [77, 4.8], [50, 3.3], [58, 3.8]),
  "Brazil|other|25-34": entry([40.5, 3.4], [37, 3.1], [76, 4.8], [50, 3.3], [58, 3.8]),
  "Brazil|other|35-44": entry([40.3, 3.4], [37.5, 3.2], [75, 4.8], [49.8, 3.3], [57.8, 3.8]),
  "Brazil|other|45-54": entry([40, 3.4], [38, 3.2], [74, 4.8], [49.5, 3.3], [57.5, 3.8]),
  "Brazil|other|55+":   entry([39.5, 3.4], [38.3, 3.3], [72, 4.8], [49, 3.3], [57, 3.8]),
};

// ── Face proportion stats (SAMPLE — not peer-reviewed) ───────────────────────
// Face proportions vary less by country/sex than body metrics.
// interocularRatio: inner eye spacing / ear-to-ear face width
// facialWidthRatio: ear-to-ear / face height (lower = more oval face)
export interface FaceStats {
  interocularRatio: MetricStats;
  facialWidthRatio: MetricStats;
}

// Slight variation by sex; minimal country variation in the sample data
const FACE_BASE_MALE: FaceStats = {
  interocularRatio: { mean: 0.44, stddev: 0.04 },
  facialWidthRatio: { mean: 0.82, stddev: 0.06 },
};
const FACE_BASE_FEMALE: FaceStats = {
  interocularRatio: { mean: 0.46, stddev: 0.04 },
  facialWidthRatio: { mean: 0.78, stddev: 0.06 },
};
const FACE_BASE_OTHER: FaceStats = {
  interocularRatio: { mean: 0.45, stddev: 0.04 },
  facialWidthRatio: { mean: 0.80, stddev: 0.06 },
};

export function getFaceStats(sex: Sex): FaceStats {
  if (sex === "male") return FACE_BASE_MALE;
  if (sex === "female") return FACE_BASE_FEMALE;
  return FACE_BASE_OTHER;
}

// ── Chest circumference stats (SAMPLE — synthetic reference values) ───────────
export interface ChestStats {
  chestCircumferenceCm: MetricStats;
}

// Values in cm — approximate population means by sex and country
const CHEST_STATS: Record<Sex, Record<Country, MetricStats>> = {
  male: {
    Global:        { mean: 98,  stddev: 9 },
    USA:           { mean: 103, stddev: 10 },
    "South Korea": { mean: 93,  stddev: 8 },
    Japan:         { mean: 92,  stddev: 8 },
    Germany:       { mean: 100, stddev: 9 },
    Brazil:        { mean: 97,  stddev: 9 },
  },
  female: {
    Global:        { mean: 90, stddev: 9 },
    USA:           { mean: 96, stddev: 10 },
    "South Korea": { mean: 84, stddev: 8 },
    Japan:         { mean: 83, stddev: 8 },
    Germany:       { mean: 92, stddev: 9 },
    Brazil:        { mean: 91, stddev: 9 },
  },
  other: {
    Global:        { mean: 94, stddev: 9 },
    USA:           { mean: 99, stddev: 10 },
    "South Korea": { mean: 88, stddev: 8 },
    Japan:         { mean: 87, stddev: 8 },
    Germany:       { mean: 96, stddev: 9 },
    Brazil:        { mean: 93, stddev: 9 },
  },
};

export function getChestStats(sex: Sex, country: Country = "Global"): ChestStats {
  const bySex = CHEST_STATS[sex] ?? CHEST_STATS.other;
  return { chestCircumferenceCm: bySex[country] ?? bySex["Global"] };
}

// ── Waist circumference stats (SAMPLE — synthetic reference values) ────────────
export interface WaistStats {
  waistCircumferenceCm: MetricStats;
}

const WAIST_STATS: Record<Sex, Record<Country, MetricStats>> = {
  male: {
    Global:        { mean: 88,  stddev: 12 },
    USA:           { mean: 96,  stddev: 13 },
    "South Korea": { mean: 82,  stddev: 10 },
    Japan:         { mean: 81,  stddev: 10 },
    Germany:       { mean: 91,  stddev: 12 },
    Brazil:        { mean: 87,  stddev: 11 },
  },
  female: {
    Global:        { mean: 76,  stddev: 12 },
    USA:           { mean: 85,  stddev: 14 },
    "South Korea": { mean: 70,  stddev: 10 },
    Japan:         { mean: 69,  stddev: 10 },
    Germany:       { mean: 79,  stddev: 12 },
    Brazil:        { mean: 77,  stddev: 12 },
  },
  other: {
    Global:        { mean: 82,  stddev: 12 },
    USA:           { mean: 90,  stddev: 13 },
    "South Korea": { mean: 76,  stddev: 10 },
    Japan:         { mean: 75,  stddev: 10 },
    Germany:       { mean: 85,  stddev: 12 },
    Brazil:        { mean: 82,  stddev: 11 },
  },
};

export function getWaistStats(sex: Sex, country: Country = "Global"): WaistStats {
  const bySex = WAIST_STATS[sex] ?? WAIST_STATS.other;
  return { waistCircumferenceCm: bySex[country] ?? bySex["Global"] };
}

export const COUNTRIES: Country[] = [
  "Global",
  "USA",
  "South Korea",
  "Japan",
  "Germany",
  "Brazil",
];

export const AGE_RANGES: AgeRange[] = ["18-24", "25-34", "35-44", "45-54", "55+"];

export const SEX_OPTIONS: { value: Sex | "prefer-not-to-say"; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Non-binary / Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

/**
 * Look up dataset stats for a given demographic.
 * Falls back to Global if country not found; falls back to "other" sex if not found.
 */
export function getStats(
  country: Country,
  sex: Sex,
  ageRange: AgeRange
): DemographicStats {
  const key = `${country}|${sex}|${ageRange}` as DatasetKey;
  if (DATASET[key]) return DATASET[key];
  // Fallback to Global
  const fallback = `Global|${sex}|${ageRange}` as DatasetKey;
  return DATASET[fallback] ?? DATASET["Global|other|25-34"];
}
