/**
 * Measurement computation from MediaPipe pose landmarks.
 *
 * Landmark indices (MediaPipe Pose):
 * 0: nose, 1: left_eye_inner, 2: left_eye, 3: left_eye_outer,
 * 4: right_eye_inner, 5: right_eye, 6: right_eye_outer,
 * 7: left_ear, 8: right_ear, 9: mouth_left, 10: mouth_right,
 * 11: left_shoulder, 12: right_shoulder, 13: left_elbow, 14: right_elbow,
 * 15: left_wrist, 16: right_wrist, 17: left_pinky, 18: right_pinky,
 * 19: left_index, 20: right_index, 21: left_thumb, 22: right_thumb,
 * 23: left_hip, 24: right_hip, 25: left_knee, 26: right_knee,
 * 27: left_ankle, 28: right_ankle, 29: left_heel, 30: right_heel,
 * 31: left_foot_index, 32: right_foot_index
 */

import type { ScanMode, CameraMode } from "./scanMode";

export interface Landmark {
  x: number; // normalized 0–1
  y: number; // normalized 0–1
  z?: number;
  visibility?: number;
}

// ── Face measurements (Face mode only) ──────────────────────────────────────

export interface FaceMeasurements {
  /** Ear-to-ear pixel distance (face width proxy) */
  earToEarPx: number;
  /** Inner eye-to-eye pixel distance (interocular distance) */
  innerEyeSpacingPx: number;
  /** Vertical face height proxy: ear-midpoint to mouth-midpoint × 1.4 */
  faceHeightPx: number;
  /** interocular / earToEar — how wide-set the eyes are relative to face width */
  interocularRatio: number;
  /** earToEar / faceHeight — face width-to-height ratio */
  facialWidthRatio: number;
}

// ── Body measurements ────────────────────────────────────────────────────────

export interface RawMeasurements {
  shoulderWidthPx: number;
  hipWidthPx: number;
  legLengthPx: number;
  torsoLengthPx: number;
  armLengthPx: number;
  wingspanPx: number;
  bodyHeightPx: number;
}

export interface Measurements {
  shoulderWidthCm: number;
  hipWidthCm: number;
  legLengthCm: number;
  torsoLengthCm: number;
  armLengthCm: number;
  wingspanCm: number;
  shoulderToHipRatio: number;
  legToTorsoRatio: number;
  armspanToHeightRatio: number;
  scaleFactor: number;
  /** Populated only in Face mode */
  face?: FaceMeasurements;
  /** Populated only in Chest mode */
  chestCircumferenceCm?: number;
  /** Populated only in Waist mode */
  waistCircumferenceCm?: number;
  /** Which scan mode produced this result */
  scanMode?: ScanMode;
}

// ── Thresholds ───────────────────────────────────────────────────────────────

export const VISIBILITY_THRESHOLD = 0.5;

// Per-mode required landmark indices
const FULL_BODY_LANDMARKS = [0, 11, 12, 23, 24, 27, 28];
const UPPER_BODY_LANDMARKS = [11, 12, 23, 24, 15, 16];
const FACE_LANDMARKS = [0, 7, 8, 1, 4]; // nose, ears, inner eyes

// ── Helpers ──────────────────────────────────────────────────────────────────

function dist(a: Landmark, b: Landmark, width: number, height: number): number {
  const dx = (a.x - b.x) * width;
  const dy = (a.y - b.y) * height;
  return Math.sqrt(dx * dx + dy * dy);
}

function midpoint(a: Landmark, b: Landmark): Landmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function isVisible(lm: Landmark): boolean {
  return lm.visibility === undefined || lm.visibility >= VISIBILITY_THRESHOLD;
}

// ── Quality checks ───────────────────────────────────────────────────────────

export function checkLandmarkQualityForMode(
  landmarks: Landmark[],
  frameWidth: number,
  frameHeight: number,
  mode: CameraMode
): { valid: boolean; reason: string } {
  if (!landmarks || landmarks.length < 33) {
    return { valid: false, reason: "Body not detected" };
  }

  if (mode === "face") return checkFaceQuality(landmarks);
  if (mode === "upper-body" || mode === "chest-front") return checkUpperBodyQuality(landmarks);
  if (mode === "chest-side") return checkSideProfileQuality(landmarks);
  return checkFullBodyQuality(landmarks);
}

function checkFaceQuality(landmarks: Landmark[]): { valid: boolean; reason: string } {
  for (const idx of FACE_LANDMARKS) {
    const lm = landmarks[idx];
    if (!lm || !isVisible(lm)) {
      return { valid: false, reason: "Face not fully visible" };
    }
  }

  const nose = landmarks[0];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];

  const faceWidth = Math.abs(leftEar.x - rightEar.x);
  if (faceWidth < 0.12) return { valid: false, reason: "Move closer to the camera" };
  if (faceWidth > 0.70) return { valid: false, reason: "Move back from the camera" };
  if (nose.x < 0.12 || nose.x > 0.88) return { valid: false, reason: "Centre your face in frame" };
  if (nose.y < 0.08) return { valid: false, reason: "Tilt face down slightly" };
  if (nose.y > 0.88) return { valid: false, reason: "Tilt face up slightly" };

  return { valid: true, reason: "Good — hold still" };
}

function checkUpperBodyQuality(landmarks: Landmark[]): { valid: boolean; reason: string } {
  for (const idx of UPPER_BODY_LANDMARKS) {
    const lm = landmarks[idx];
    if (!lm || !isVisible(lm)) {
      return { valid: false, reason: "Upper body not fully visible" };
    }
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const margin = 0.05;

  const shoulderY = Math.min(leftShoulder.y, rightShoulder.y);
  if (shoulderY < margin) return { valid: false, reason: "Move back — shoulders cut off" };

  const hipY = Math.max(leftHip.y, rightHip.y);
  if (hipY > 1 - margin) return { valid: false, reason: "Move back — hips cut off" };

  const torsoFraction = hipY - shoulderY;
  if (torsoFraction < 0.22) return { valid: false, reason: "Move closer to the camera" };

  return { valid: true, reason: "Good framing — hold still" };
}

function checkSideProfileQuality(landmarks: Landmark[]): { valid: boolean; reason: string } {
  for (const idx of UPPER_BODY_LANDMARKS) {
    const lm = landmarks[idx];
    if (!lm || !isVisible(lm)) {
      return { valid: false, reason: "Upper body not fully visible" };
    }
  }

  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const margin = 0.05;

  if (Math.min(leftShoulder.y, rightShoulder.y) < margin) {
    return { valid: false, reason: "Move back — shoulders cut off" };
  }
  if (Math.max(leftHip.y, rightHip.y) > 1 - margin) {
    return { valid: false, reason: "Move back — hips cut off" };
  }

  // In side profile, the nose deviates from the shoulder midpoint in X
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const noseDeviation = Math.abs(nose.x - shoulderMidX);
  if (noseDeviation < 0.08) {
    return { valid: false, reason: "Turn sideways — show your profile" };
  }

  // Both shoulders must still be marginally detectable (not completely edge-on)
  if (Math.abs(leftShoulder.x - rightShoulder.x) < 0.02) {
    return { valid: false, reason: "Rotate slightly so both shoulders are detected" };
  }

  return { valid: true, reason: "Good profile — hold still" };
}

function checkFullBodyQuality(landmarks: Landmark[]): { valid: boolean; reason: string } {
  for (const idx of FULL_BODY_LANDMARKS) {
    const lm = landmarks[idx];
    if (!lm || !isVisible(lm)) {
      return { valid: false, reason: "Key body parts not visible" };
    }
  }

  const margin = 0.08;
  const nose = landmarks[0];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  if (nose.y < margin) return { valid: false, reason: "Move back — head cut off" };
  if (Math.max(leftAnkle.y, rightAnkle.y) > 1 - margin) {
    return { valid: false, reason: "Move back — feet cut off" };
  }

  const bodyHeightFraction = Math.max(leftAnkle.y, rightAnkle.y) - nose.y;
  if (bodyHeightFraction < 0.4) return { valid: false, reason: "Move closer — too far away" };
  if (bodyHeightFraction > 0.98) return { valid: false, reason: "Move back — too close" };

  return { valid: true, reason: "Good framing — hold still" };
}

// ── Measurement extraction ───────────────────────────────────────────────────

export function extractFaceMeasurements(
  landmarks: Landmark[],
  frameWidth: number,
  frameHeight: number
): FaceMeasurements {
  const lm = landmarks;
  const w = frameWidth;
  const h = frameHeight;

  const leftEar = lm[7];
  const rightEar = lm[8];
  const leftEyeInner = lm[1];
  const rightEyeInner = lm[4];
  const mouthLeft = lm[9];
  const mouthRight = lm[10];

  const earToEarPx = dist(leftEar, rightEar, w, h);
  const innerEyeSpacingPx = dist(leftEyeInner, rightEyeInner, w, h);
  const earMid = midpoint(leftEar, rightEar);
  const mouthMid = midpoint(mouthLeft, mouthRight);
  // Face height: ear-midpoint to mouth-midpoint × 1.4 (rough forehead-to-chin approx)
  const faceHeightPx = dist(earMid, mouthMid, w, h) * 1.4;

  return {
    earToEarPx,
    innerEyeSpacingPx,
    faceHeightPx,
    interocularRatio: Math.round((innerEyeSpacingPx / earToEarPx) * 1000) / 1000,
    facialWidthRatio: Math.round((earToEarPx / faceHeightPx) * 1000) / 1000,
  };
}

export function extractRawMeasurements(
  landmarks: Landmark[],
  frameWidth: number,
  frameHeight: number
): RawMeasurements {
  const lm = landmarks;
  const w = frameWidth;
  const h = frameHeight;

  const leftShoulder = lm[11];
  const rightShoulder = lm[12];
  const leftHip = lm[23];
  const rightHip = lm[24];
  const leftAnkle = lm[27];
  const rightAnkle = lm[28];
  const leftWrist = lm[15];
  const rightWrist = lm[16];
  const nose = lm[0];

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);
  const ankleMid = midpoint(leftAnkle, rightAnkle);

  const shoulderWidthPx = dist(leftShoulder, rightShoulder, w, h);
  const hipWidthPx = dist(leftHip, rightHip, w, h);
  const legLengthPx = dist(hipMid, ankleMid, w, h);
  const torsoLengthPx = dist(shoulderMid, hipMid, w, h);

  const leftArmLen = dist(leftShoulder, leftWrist, w, h);
  const rightArmLen = dist(rightShoulder, rightWrist, w, h);
  const armLengthPx = (leftArmLen + rightArmLen) / 2;

  const wingspanPx = dist(leftWrist, rightWrist, w, h);

  const leftEar = lm[7];
  const rightEar = lm[8];
  const earMid = midpoint(leftEar, rightEar);
  const earToNosePx = dist(earMid, nose, w, h);
  const headTopY = nose.y - (earToNosePx / h) * 1.3;
  const headTop: Landmark = { x: nose.x, y: headTopY };
  const bodyHeightPx = dist(headTop, ankleMid, w, h);

  return {
    shoulderWidthPx,
    hipWidthPx,
    legLengthPx,
    torsoLengthPx,
    armLengthPx,
    wingspanPx,
    bodyHeightPx,
  };
}

/** Upper body: like full body but skips ankle-dependent fields */
export function extractUpperBodyMeasurements(
  landmarks: Landmark[],
  frameWidth: number,
  frameHeight: number
): RawMeasurements {
  const lm = landmarks;
  const w = frameWidth;
  const h = frameHeight;

  const leftShoulder = lm[11];
  const rightShoulder = lm[12];
  const leftHip = lm[23];
  const rightHip = lm[24];
  const leftWrist = lm[15];
  const rightWrist = lm[16];
  const nose = lm[0];

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);

  const shoulderWidthPx = dist(leftShoulder, rightShoulder, w, h);
  const hipWidthPx = dist(leftHip, rightHip, w, h);
  const torsoLengthPx = dist(shoulderMid, hipMid, w, h);

  const leftArmLen = dist(leftShoulder, leftWrist, w, h);
  const rightArmLen = dist(rightShoulder, rightWrist, w, h);
  const armLengthPx = (leftArmLen + rightArmLen) / 2;

  const wingspanPx = dist(leftWrist, rightWrist, w, h);

  // For upper-body: use shoulder-to-hip as height proxy for scaling
  const leftEar = lm[7];
  const rightEar = lm[8];
  const earMid = midpoint(leftEar, rightEar);
  const earToNosePx = dist(earMid, nose, w, h);
  const headTopY = nose.y - (earToNosePx / h) * 1.3;
  const headTop: Landmark = { x: nose.x, y: headTopY };
  // bodyHeightPx here is head-to-hip — used to scale torso relative measurements
  const bodyHeightPx = dist(headTop, hipMid, w, h);

  return {
    shoulderWidthPx,
    hipWidthPx,
    legLengthPx: 0, // not measurable in upper-body mode
    torsoLengthPx,
    armLengthPx,
    wingspanPx,
    bodyHeightPx,
  };
}

// ── Scaling ──────────────────────────────────────────────────────────────────

export function scaleMeasurements(
  raw: RawMeasurements,
  userHeightCm: number,
  mode: ScanMode = "full-body"
): Measurements {
  // For upper-body, head-to-hip ≈ 55–58% of total height
  const effectiveHeight =
    mode === "upper-body" ? userHeightCm * 0.56 : userHeightCm;

  const scaleFactor = raw.bodyHeightPx > 0 ? effectiveHeight / raw.bodyHeightPx : 1;

  const shoulderWidthCm = r(raw.shoulderWidthPx * scaleFactor);
  const hipWidthCm = r(raw.hipWidthPx * scaleFactor);
  const legLengthCm = r(raw.legLengthPx * scaleFactor);
  const torsoLengthCm = r(raw.torsoLengthPx * scaleFactor);
  const armLengthCm = r(raw.armLengthPx * scaleFactor);
  const wingspanCm = r(raw.wingspanPx * scaleFactor);

  return {
    shoulderWidthCm,
    hipWidthCm,
    legLengthCm,
    torsoLengthCm,
    armLengthCm,
    wingspanCm,
    shoulderToHipRatio: hipWidthCm > 0 ? r2(shoulderWidthCm / hipWidthCm) : 0,
    legToTorsoRatio: torsoLengthCm > 0 ? r2(legLengthCm / torsoLengthCm) : 0,
    armspanToHeightRatio: userHeightCm > 0 ? r2(wingspanCm / userHeightCm) : 0,
    scaleFactor,
    scanMode: mode,
  };
}

function r(n: number) { return Math.round(n * 10) / 10; }
function r2(n: number) { return Math.round(n * 100) / 100; }

// ── Smoothing ────────────────────────────────────────────────────────────────

export function averageRawMeasurements(frames: RawMeasurements[]): RawMeasurements {
  if (frames.length === 0) throw new Error("No frames to average");
  const sum: RawMeasurements = {
    shoulderWidthPx: 0, hipWidthPx: 0, legLengthPx: 0,
    torsoLengthPx: 0, armLengthPx: 0, wingspanPx: 0, bodyHeightPx: 0,
  };
  for (const f of frames) {
    sum.shoulderWidthPx += f.shoulderWidthPx;
    sum.hipWidthPx += f.hipWidthPx;
    sum.legLengthPx += f.legLengthPx;
    sum.torsoLengthPx += f.torsoLengthPx;
    sum.armLengthPx += f.armLengthPx;
    sum.wingspanPx += f.wingspanPx;
    sum.bodyHeightPx += f.bodyHeightPx;
  }
  const n = frames.length;
  return {
    shoulderWidthPx: sum.shoulderWidthPx / n,
    hipWidthPx: sum.hipWidthPx / n,
    legLengthPx: sum.legLengthPx / n,
    torsoLengthPx: sum.torsoLengthPx / n,
    armLengthPx: sum.armLengthPx / n,
    wingspanPx: sum.wingspanPx / n,
    bodyHeightPx: sum.bodyHeightPx / n,
  };
}

export function averageFaceMeasurements(frames: FaceMeasurements[]): FaceMeasurements {
  if (frames.length === 0) throw new Error("No frames to average");
  const n = frames.length;
  const sum = frames.reduce(
    (acc, f) => ({
      earToEarPx: acc.earToEarPx + f.earToEarPx,
      innerEyeSpacingPx: acc.innerEyeSpacingPx + f.innerEyeSpacingPx,
      faceHeightPx: acc.faceHeightPx + f.faceHeightPx,
      interocularRatio: acc.interocularRatio + f.interocularRatio,
      facialWidthRatio: acc.facialWidthRatio + f.facialWidthRatio,
    }),
    { earToEarPx: 0, innerEyeSpacingPx: 0, faceHeightPx: 0, interocularRatio: 0, facialWidthRatio: 0 }
  );
  return {
    earToEarPx: sum.earToEarPx / n,
    innerEyeSpacingPx: sum.innerEyeSpacingPx / n,
    faceHeightPx: sum.faceHeightPx / n,
    interocularRatio: Math.round((sum.interocularRatio / n) * 1000) / 1000,
    facialWidthRatio: Math.round((sum.facialWidthRatio / n) * 1000) / 1000,
  };
}

// ── Chest circumference ───────────────────────────────────────────────────────

/**
 * Ramanujan's approximation for ellipse circumference.
 * semiWidthCm = half the front-facing chest width
 * semiDepthCm = half the side-facing chest depth
 */
export function computeChestCircumference(
  semiWidthCm: number,
  semiDepthCm: number
): number {
  if (semiWidthCm <= 0 || semiDepthCm <= 0) return 0;
  const a = semiWidthCm;
  const b = semiDepthCm;
  const h = ((a - b) ** 2) / ((a + b) ** 2);
  return (
    Math.round(
      Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h))) * 10
    ) / 10
  );
}

/**
 * Waist circumference using Ramanujan ellipse approximation.
 * frontHipWidthCm: hip-to-hip distance from front pose (waist ≈ 88% of hip width)
 * sideDepthCm: hip depth from side pose
 */
export function computeWaistCircumference(
  frontHipWidthCm: number,
  sideDepthCm: number
): number {
  const semiWidth = (frontHipWidthCm * 0.88) / 2;
  const semiDepth = sideDepthCm / 2;
  return computeChestCircumference(semiWidth, semiDepth);
}

// Keep the old export for backwards compat
export { checkLandmarkQualityForMode as checkLandmarkQuality };
export const REQUIRED_LANDMARKS = FULL_BODY_LANDMARKS;
export const ARM_LANDMARKS = [15, 16];
