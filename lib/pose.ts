/**
 * MediaPipe Tasks Vision — Pose Landmarker initialization and frame processing.
 *
 * Model asset: downloaded from
 * https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
 *
 * Place the model at /public/models/pose_landmarker_lite.task
 * Run: npm run download-model
 */

import type { Landmark } from "./measurements";

// Singleton — reuse across re-renders to avoid reloading the WASM module
let _poseLandmarker: import("@mediapipe/tasks-vision").PoseLandmarker | null = null;
let _loadPromise: Promise<import("@mediapipe/tasks-vision").PoseLandmarker> | null = null;

export type PoseLandmarkerInstance = import("@mediapipe/tasks-vision").PoseLandmarker;

export async function loadPoseLandmarker(): Promise<PoseLandmarkerInstance> {
  // Return cached instance
  if (_poseLandmarker) return _poseLandmarker;
  // Deduplicate concurrent calls
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");

    // WASM is loaded from CDN. No COEP header is set so cross-origin WASM loads
    // correctly on Safari. Pin to an explicit version to avoid breaking changes.
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    // Try GPU delegate first, fall back to CPU for devices without WebGL2
    // (some older iPhones only expose WebGL1).
    let poseLandmarker: PoseLandmarkerInstance;
    try {
      poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (gpuErr) {
      console.warn("GPU delegate failed, falling back to CPU:", gpuErr);
      poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_lite.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    _poseLandmarker = poseLandmarker;
    return poseLandmarker;
  })();

  try {
    return await _loadPromise;
  } catch (err) {
    // Reset so the next call can retry
    _loadPromise = null;
    throw err;
  }
}

export interface PoseResult {
  landmarks: Landmark[];
  worldLandmarks?: Landmark[];
  timestamp: number;
}

/**
 * Process a single video frame and return landmarks.
 * Returns null if no pose is detected.
 */
export function processFrame(
  poseLandmarker: PoseLandmarkerInstance,
  videoElement: HTMLVideoElement,
  timestampMs: number
): PoseResult | null {
  try {
    const results = poseLandmarker.detectForVideo(videoElement, timestampMs);
    if (!results.landmarks || results.landmarks.length === 0) {
      return null;
    }
    return {
      landmarks: results.landmarks[0] as Landmark[],
      worldLandmarks: results.worldLandmarks?.[0] as Landmark[] | undefined,
      timestamp: timestampMs,
    };
  } catch (err) {
    // Silently swallow per-frame errors (e.g. non-monotonic timestamp on tab hide/show)
    console.warn("Pose detection frame error:", err);
    return null;
  }
}
