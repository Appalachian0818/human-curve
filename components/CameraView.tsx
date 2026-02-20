"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PoseOverlay from "./PoseOverlay";
import QualityMeter from "./QualityMeter";
import type { Landmark, FaceMeasurements } from "@/lib/measurements";
import {
  checkLandmarkQualityForMode,
  extractRawMeasurements,
  extractUpperBodyMeasurements,
  extractFaceMeasurements,
  averageRawMeasurements,
  averageFaceMeasurements,
  scaleMeasurements,
  type RawMeasurements,
  type Measurements,
} from "@/lib/measurements";
import type { PoseLandmarkerInstance } from "@/lib/pose";
import { processFrame } from "@/lib/pose";
import type { CameraMode } from "@/lib/scanMode";

const MAX_BUFFER = 60;
// Countdown duration in seconds for full-body auto-capture
const AUTO_CAPTURE_COUNTDOWN = 3;

interface CameraViewProps {
  mode: CameraMode;
  requiredGoodFrames: number;
  userHeightCm: number;
  onCapture: (measurements: Measurements) => void;
}

export default function CameraView({
  mode,
  requiredGoodFrames,
  userHeightCm,
  onCapture,
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [qualityMsg, setQualityMsg] = useState("Initializing camera…");
  const [isGoodFrame, setIsGoodFrame] = useState(false);
  const [goodFrameCount, setGoodFrameCount] = useState(0);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarkerInstance | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canCapture, setCanCapture] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  /** null = not counting; 1-3 = countdown in progress */
  const [countdown, setCountdown] = useState<number | null>(null);

  const rawFrameBuffer = useRef<RawMeasurements[]>([]);
  const faceFrameBuffer = useRef<FaceMeasurements[]>([]);
  const goodFrameCountRef = useRef(0);
  const animFrameRef = useRef<number | undefined>(undefined);
  const lastProcessedMs = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  // Stable ref to capture function so countdown closure always gets latest version
  const captureRef = useRef<() => void>(() => {});

  const autoCapture = mode === "full-body" || mode === "chest-front" || mode === "chest-side";

  // ── Load MediaPipe ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const { loadPoseLandmarker } = await import("@/lib/pose");
        const pl = await loadPoseLandmarker();
        if (!cancelled) {
          setPoseLandmarker(pl);
          setIsLoading(false);
          setQualityMsg("Position yourself in frame");
        }
      } catch (err) {
        console.error("Failed to load pose model:", err);
        if (!cancelled) {
          setCameraError(
            "Could not load pose model. Run: npm run download-model"
          );
          setIsLoading(false);
        }
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // ── Start camera ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || cameraError) return;

    async function startCamera() {
      const video = videoRef.current;
      if (!video) return;

      const onMeta = () => {
        setDimensions({
          width: video.videoWidth || 640,
          height: video.videoHeight || 480,
        });
      };
      video.addEventListener("loadedmetadata", onMeta);

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
          });
        }
        streamRef.current = stream;
        video.srcObject = stream;
        try {
          await video.play();
        } catch (e) {
          if ((e as DOMException)?.name !== "AbortError") throw e;
        }
      } catch (err) {
        const e = err as DOMException;
        let msg = "Camera permission denied. Allow camera access and reload.";
        if (e?.name === "NotFoundError") msg = "No camera found on this device.";
        else if (e?.name === "NotAllowedError")
          msg = "Camera denied. Go to Settings → Safari → Camera, then reload.";
        else if (e?.name === "NotReadableError")
          msg = "Camera is in use by another app. Close it and reload.";
        setCameraError(msg);
        video.removeEventListener("loadedmetadata", onMeta);
      }
    }

    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [isLoading, cameraError]);

  // ── Pose detection loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!poseLandmarker || !videoRef.current || cameraError) return;
    const video = videoRef.current;

    function tick() {
      if (!poseLandmarker || !video) return;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.paused) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      if (now - lastProcessedMs.current < 50) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      lastProcessedMs.current = now;

      const result = processFrame(poseLandmarker, video, now);

      if (!result) {
        setLandmarks(null);
        setIsGoodFrame(false);
        setQualityMsg("Body not detected — face the camera");
        goodFrameCountRef.current = 0;
        setGoodFrameCount(0);
        rawFrameBuffer.current = [];
        faceFrameBuffer.current = [];
        setCanCapture(false);
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const liveW = video.videoWidth || dimensions.width;
      const liveH = video.videoHeight || dimensions.height;

      setLandmarks(result.landmarks);

      const { valid, reason } = checkLandmarkQualityForMode(
        result.landmarks, liveW, liveH, mode
      );

      setQualityMsg(valid ? "Good — hold still" : reason);
      setIsGoodFrame(valid);

      if (valid) {
        // Buffer measurements based on mode
        if (mode === "face") {
          faceFrameBuffer.current.push(
            extractFaceMeasurements(result.landmarks, liveW, liveH)
          );
          if (faceFrameBuffer.current.length > MAX_BUFFER) faceFrameBuffer.current.shift();
        } else {
          const raw =
            mode === "full-body"
              ? extractRawMeasurements(result.landmarks, liveW, liveH)
              : extractUpperBodyMeasurements(result.landmarks, liveW, liveH);
          rawFrameBuffer.current.push(raw);
          if (rawFrameBuffer.current.length > MAX_BUFFER) rawFrameBuffer.current.shift();
        }

        goodFrameCountRef.current = Math.min(
          goodFrameCountRef.current + 1,
          requiredGoodFrames
        );
        setGoodFrameCount(goodFrameCountRef.current);
        if (goodFrameCountRef.current >= requiredGoodFrames) setCanCapture(true);
      } else {
        goodFrameCountRef.current = Math.max(0, goodFrameCountRef.current - 2);
        setGoodFrameCount(goodFrameCountRef.current);
        if (goodFrameCountRef.current < requiredGoodFrames) setCanCapture(false);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current !== undefined) cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poseLandmarker, cameraError, mode, requiredGoodFrames]);

  // ── Capture logic ───────────────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    if (isCapturing) return;
    setIsCapturing(true);

    if (mode === "face") {
      const frames = faceFrameBuffer.current.slice(-requiredGoodFrames);
      if (frames.length === 0) { setIsCapturing(false); return; }
      const avgFace = averageFaceMeasurements(frames);
      const m: Measurements = {
        shoulderWidthCm: 0, hipWidthCm: 0, legLengthCm: 0,
        torsoLengthCm: 0, armLengthCm: 0, wingspanCm: 0,
        shoulderToHipRatio: 0, legToTorsoRatio: 0, armspanToHeightRatio: 0,
        scaleFactor: 1, face: avgFace, scanMode: "face",
      };
      onCapture(m);
    } else {
      const frames = rawFrameBuffer.current.slice(-requiredGoodFrames);
      if (frames.length === 0) { setIsCapturing(false); return; }
      const avg = averageRawMeasurements(frames);
      // Chest poses use upper-body scaling; map internal modes to a real ScanMode
      const scaleMode =
        mode === "chest-front" || mode === "chest-side" || mode === "upper-body"
          ? "upper-body"
          : mode === "full-body"
          ? "full-body"
          : "full-body";
      const m = scaleMeasurements(avg, userHeightCm, scaleMode);
      onCapture(m);
    }
  }, [isCapturing, mode, requiredGoodFrames, userHeightCm, onCapture]);

  // Keep captureRef fresh so the countdown closure always calls the latest version
  useEffect(() => { captureRef.current = handleCapture; }, [handleCapture]);

  // ── Auto-capture countdown (Full Body only) ─────────────────────────────
  // Start/reset when canCapture changes
  useEffect(() => {
    if (!autoCapture || isCapturing) return;
    if (canCapture) {
      setCountdown(AUTO_CAPTURE_COUNTDOWN);
    } else {
      setCountdown(null);
    }
  }, [canCapture, autoCapture, isCapturing]);

  // Tick the countdown every second
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setTimeout(
      () => setCountdown((c) => (c !== null ? c - 1 : null)),
      1000
    );
    return () => clearTimeout(t);
  }, [countdown]);

  // Fire when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      setCountdown(null);
      captureRef.current();
    }
  }, [countdown]);

  // ── Ring helpers ────────────────────────────────────────────────────────
  const RING_R = 52;
  const RING_CIRC = 2 * Math.PI * RING_R;
  // progress 0→1 as countdown goes 3→0
  const ringProgress = countdown !== null ? (AUTO_CAPTURE_COUNTDOWN - countdown) / AUTO_CAPTURE_COUNTDOWN : 0;
  const ringOffset = RING_CIRC * (1 - ringProgress);

  // ── Render ──────────────────────────────────────────────────────────────
  if (cameraError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[16rem] text-center px-4 gap-4">
        <div className="text-5xl">📷</div>
        <p className="text-red-400 font-semibold">Camera unavailable</p>
        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">{cameraError}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[16rem] gap-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading pose model…</p>
      </div>
    );
  }

  // Face mode uses a taller (portrait) aspect ratio
  const aspectStyle =
    mode === "face"
      ? { maxWidth: 400, aspectRatio: "3/4" }
      : { maxWidth: 640, aspectRatio: `${dimensions.width}/${dimensions.height}` };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Camera + overlays */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 w-full"
        style={aspectStyle}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ transform: "scaleX(-1)" }}
        />

        <PoseOverlay
          landmarks={landmarks}
          width={dimensions.width}
          height={dimensions.height}
        />

        {/* Mode-specific guide outline */}
        {mode === "face" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="border-2 border-dashed border-white/25 rounded-full"
              style={{ width: "65%", height: "75%" }}
            />
          </div>
        )}
        {mode === "full-body" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-dashed border-white/20 rounded-full w-[45%] h-[90%]" />
          </div>
        )}

        {/* Instructions */}
        {!canCapture && (
          <div className="absolute top-3 left-3 right-3 text-center pointer-events-none">
            <p className="text-white/70 text-xs bg-black/40 rounded-lg px-3 py-1.5 inline-block">
              {mode === "face" && "Arm's length away · Look straight · Even lighting"}
              {(mode === "upper-body" || mode === "chest-front") && "~1 m away · Face forward · Upper body visible"}
              {mode === "chest-side" && "~1 m away · Turn 90° · Side profile"}
              {mode === "full-body" && "2–3 m away · Full body visible · Arms at sides"}
            </p>
          </div>
        )}

        {/* ── Countdown ring overlay (Full Body auto-capture) ── */}
        {countdown !== null && !isCapturing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Dim backdrop */}
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative z-10 flex items-center justify-center w-36 h-36">
              <svg
                viewBox="0 0 120 120"
                className="absolute inset-0 w-full h-full -rotate-90"
              >
                {/* Track */}
                <circle
                  cx="60" cy="60" r={RING_R}
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="8"
                />
                {/* Progress arc */}
                <circle
                  cx="60" cy="60" r={RING_R}
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={ringOffset}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              {/* Number */}
              <span className="text-6xl font-black text-white drop-shadow-lg z-10">
                {countdown}
              </span>
            </div>
            <p className="absolute bottom-6 text-white/80 text-sm font-medium">
              Auto-capturing…
            </p>
          </div>
        )}

        {/* Capturing flash */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
            <p className="text-white font-bold text-lg">Captured ✓</p>
          </div>
        )}
      </div>

      {/* Quality meter */}
      <QualityMeter
        message={qualityMsg}
        isGood={isGoodFrame}
        goodFrameCount={goodFrameCount}
        requiredFrames={requiredGoodFrames}
      />

      {/* Capture button — always visible; in auto mode it's secondary */}
      {autoCapture ? (
        <button
          onClick={handleCapture}
          disabled={!canCapture || isCapturing}
          className={`w-full max-w-sm py-3 rounded-2xl font-medium text-sm transition-all border ${
            canCapture && !isCapturing
              ? "border-teal-500/50 text-teal-400 hover:bg-teal-500/10 active:scale-95"
              : "border-slate-700 text-slate-600 cursor-not-allowed"
          }`}
        >
          {isCapturing ? "Processing…" : canCapture ? "Capture Now (skip countdown)" : "Hold still to calibrate…"}
        </button>
      ) : (
        <button
          onClick={handleCapture}
          disabled={!canCapture || isCapturing}
          className={`w-full max-w-sm py-4 rounded-2xl font-semibold text-lg transition-all ${
            canCapture && !isCapturing
              ? "bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/30 active:scale-95"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isCapturing ? "Processing…" : canCapture ? "Capture Measurements" : "Hold still to calibrate…"}
        </button>
      )}
    </div>
  );
}
