"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { loadSession, saveSession } from "@/lib/storage";
import type { StoredSession } from "@/lib/storage";
import { track } from "@/lib/analytics";
import { computeChestCircumference, computeWaistCircumference } from "@/lib/measurements";
import type { Measurements } from "@/lib/measurements";
import {
  SCAN_MODE_OPTIONS,
  type ScanMode,
  type ScanModeOption,
  type CameraMode,
} from "@/lib/scanMode";

const CameraView = dynamic(() => import("@/components/CameraView"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Loading camera…</p>
    </div>
  ),
});

type Step = "mode-select" | "scanning" | "chest-transition" | "manual";

export default function ScanPage() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [step, setStep] = useState<Step>("mode-select");
  const [selectedMode, setSelectedMode] = useState<ScanMode>("full-body");
  const [chestPose, setChestPose] = useState<"front" | "side">("front");
  const [frontMeasurements, setFrontMeasurements] = useState<Measurements | null>(null);
  const [manualMeasurements, setManualMeasurements] = useState({
    shoulderWidthCm: "",
    hipWidthCm: "",
    legLengthCm: "",
    torsoLengthCm: "",
    armLengthCm: "",
  });

  useEffect(() => {
    const s = loadSession();
    if (!s?.profile?.heightCm) {
      router.replace("/profile");
      return;
    }
    setSession(s);
    track("scan_started");
  }, [router]);

  function handleCapture(measurements: Measurements) {
    if (!session) return;
    saveSession({
      ...session,
      measurements,
      capturedAt: new Date().toISOString(),
      scanMode: selectedMode,
    });
    track("scan_captured", { mode: selectedMode });
    router.push("/results");
  }

  const isTwoPoseMode = selectedMode === "chest" || selectedMode === "waist";

  function handlePose1Capture(measurements: Measurements) {
    setFrontMeasurements(measurements);
    setStep("chest-transition");
  }

  function handlePose2Capture(measurements: Measurements) {
    if (!session || !frontMeasurements) return;
    let finalMeasurements: Measurements;
    if (selectedMode === "chest") {
      const halfWidth = (frontMeasurements.shoulderWidthCm * 0.85) / 2;
      const halfDepth = measurements.shoulderWidthCm / 2;
      finalMeasurements = {
        ...frontMeasurements,
        chestCircumferenceCm: computeChestCircumference(halfWidth, halfDepth),
        scanMode: "chest",
      };
    } else {
      // waist: use hip width from front pose; hip depth from side pose
      finalMeasurements = {
        ...frontMeasurements,
        waistCircumferenceCm: computeWaistCircumference(
          frontMeasurements.hipWidthCm,
          measurements.hipWidthCm
        ),
        scanMode: "waist",
      };
    }
    saveSession({
      ...session,
      measurements: finalMeasurements,
      capturedAt: new Date().toISOString(),
      scanMode: selectedMode,
    });
    track("scan_captured", { mode: selectedMode });
    router.push("/results");
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    const sw = parseFloat(manualMeasurements.shoulderWidthCm);
    const hw = parseFloat(manualMeasurements.hipWidthCm);
    const ll = parseFloat(manualMeasurements.legLengthCm);
    const tl = parseFloat(manualMeasurements.torsoLengthCm);
    const al = parseFloat(manualMeasurements.armLengthCm);
    if ([sw, hw, ll, tl, al].some((v) => isNaN(v) || v <= 0)) return;
    const h = session.profile?.heightCm ?? 170;
    const measurements: Measurements = {
      shoulderWidthCm: sw, hipWidthCm: hw, legLengthCm: ll,
      torsoLengthCm: tl, armLengthCm: al, wingspanCm: al * 2 + sw,
      shoulderToHipRatio: Math.round((sw / hw) * 100) / 100,
      legToTorsoRatio: Math.round((ll / tl) * 100) / 100,
      armspanToHeightRatio: Math.round(((al * 2 + sw) / h) * 100) / 100,
      scaleFactor: 1, scanMode: "full-body",
    };
    saveSession({ ...session, measurements, capturedAt: new Date().toISOString(), scanMode: "full-body" });
    track("scan_captured", { source: "manual" });
    router.push("/results");
  }

  if (!session?.profile) return null;

  const modeOption = SCAN_MODE_OPTIONS.find((m) => m.id === selectedMode)!;

  // ── Step: Mode Selection ─────────────────────────────────────────────────
  if (step === "mode-select") {
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <Link href="/profile" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Back
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-white font-bold">Choose Scan Mode</h1>
          </div>
          <div className="w-16" />
        </div>

        <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col gap-6">
          <p className="text-slate-400 text-sm text-center">
            Select what you'd like to measure today.
          </p>

          {/* Mode cards */}
          <div className="flex flex-col gap-3">
            {SCAN_MODE_OPTIONS.map((opt: ScanModeOption) => {
              const isSelected = selectedMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedMode(opt.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? "bg-teal-500/10 border-teal-500 shadow-lg shadow-teal-500/10"
                      : "bg-slate-800/60 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                        isSelected ? "bg-teal-500/20" : "bg-slate-700"
                      }`}
                    >
                      {opt.emoji}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-bold ${isSelected ? "text-white" : "text-slate-200"}`}>
                          {opt.label}
                        </span>
                        {opt.recommended && (
                          <span className="bg-teal-500/20 text-teal-400 text-xs px-2 py-0.5 rounded-full font-medium border border-teal-500/30">
                            Recommended
                          </span>
                        )}
                        {opt.autoCapture && (
                          <span className="bg-violet-500/20 text-violet-400 text-xs px-2 py-0.5 rounded-full font-medium border border-violet-500/30">
                            Auto-capture
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                        {opt.tagline}
                      </p>
                    </div>

                    {/* Selection indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                        isSelected
                          ? "border-teal-500 bg-teal-500"
                          : "border-slate-600"
                      }`}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 20 20" fill="white" className="w-full h-full p-0.5">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected mode detail card */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-300 text-sm font-medium mb-2">
              {modeOption.emoji} {modeOption.label} mode tips:
            </p>
            <ul className="space-y-1.5">
              {modeOption.details.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-slate-400 text-sm">
                  <span className="text-teal-500 mt-px">·</span>
                  {tip}
                </li>
              ))}
            </ul>
            {modeOption.autoCapture && (
              <div className="mt-3 flex items-center gap-2 text-violet-400 text-xs bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
                <span>⏱</span>
                <span>
                  Once you're framed correctly, a 3-second countdown will appear
                  and capture automatically — no need to tap!
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => { setChestPose("front"); setFrontMeasurements(null); setStep("scanning"); }}
            className="w-full py-4 rounded-2xl font-bold text-lg bg-teal-500 hover:bg-teal-400 text-white transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            Start Scanning →
          </button>

          <button
            onClick={() => setStep("manual")}
            className="text-center text-slate-500 hover:text-slate-300 text-sm underline transition-colors"
          >
            No camera? Enter measurements manually
          </button>
        </div>
      </main>
    );
  }

  // ── Step: Chest transition (between pose 1 and pose 2) ──────────────────
  if (step === "chest-transition") {
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <button
            onClick={() => setStep("mode-select")}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← Cancel
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-white font-bold">Pose 2 of 2</h1>
          </div>
          <div className="w-16" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 text-center">
          <div className="text-7xl">✅</div>
          <div>
            <h2 className="text-white text-2xl font-bold mb-2">Pose 1 complete!</h2>
            <p className="text-slate-400">Now turn 90° to show your side profile</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 text-left max-w-sm w-full">
            <p className="text-slate-300 text-sm font-medium mb-3">For the side profile:</p>
            <ul className="space-y-2">
              {[
                "Turn 90° — one shoulder faces the camera",
                "Stand straight, arms relaxed at sides",
                "Auto-captures in 3 seconds once detected",
              ].map((tip) => (
                <li key={tip} className="flex gap-2 text-slate-400 text-sm">
                  <span className="text-teal-500 mt-px">·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => { setChestPose("side"); setStep("scanning"); }}
            className="w-full max-w-sm py-4 rounded-2xl font-bold text-lg bg-teal-500 hover:bg-teal-400 text-white transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            Ready — Start Pose 2 →
          </button>
        </div>
      </main>
    );
  }

  // ── Step: Scanning ───────────────────────────────────────────────────────
  if (step === "scanning") {
    const cameraMode: CameraMode = isTwoPoseMode
      ? (chestPose === "front" ? "chest-front" : "chest-side")
      : selectedMode;

    return (
      <main className="min-h-screen bg-slate-900 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <button
            onClick={() => setStep("mode-select")}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← Change mode
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-white font-bold">
              {modeOption.emoji} {modeOption.label} Scan
              {isTwoPoseMode && (
                <span className="ml-2 text-teal-400 text-sm font-normal">
                  ({chestPose === "front" ? "1" : "2"}/2)
                </span>
              )}
            </h1>
          </div>
          <div className="w-24" />
        </div>

        <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
          {/* Two-pose banner */}
          {isTwoPoseMode && (
            <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 mb-4">
              <span className="text-violet-300 text-sm">
                {chestPose === "front"
                  ? "📸 Pose 1 of 2 — face the camera directly"
                  : "📸 Pose 2 of 2 — turn 90° to your side"}
              </span>
            </div>
          )}

          {/* Height reminder — not shown for face or two-pose modes */}
          {selectedMode !== "face" && !isTwoPoseMode && (
            <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-xl px-4 py-3 mb-4">
              <span className="text-teal-400 text-sm">
                📏 Scaling to your height: <strong>{session.profile.heightCm} cm</strong>
              </span>
            </div>
          )}

          <CameraView
            key={isTwoPoseMode ? `${selectedMode}-${chestPose}` : selectedMode}
            mode={cameraMode}
            requiredGoodFrames={modeOption.requiredGoodFrames}
            userHeightCm={session.profile.heightCm}
            onCapture={
              isTwoPoseMode
                ? chestPose === "front"
                  ? handlePose1Capture
                  : handlePose2Capture
                : handleCapture
            }
          />
        </div>
      </main>
    );
  }

  // ── Step: Manual fallback ────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <button
          onClick={() => setStep("mode-select")}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-white font-bold">Manual Entry</h1>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-6">
          <p className="text-amber-300 text-sm">
            Measure with a tape measure and enter values in cm. These will be less
            accurate than camera-based measurements.
          </p>
        </div>

        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
          {[
            { key: "shoulderWidthCm", label: "Shoulder Width (cm)", hint: "Tip to tip across both shoulders" },
            { key: "hipWidthCm", label: "Hip Width (cm)", hint: "Widest part of hips" },
            { key: "legLengthCm", label: "Leg Length (cm)", hint: "Hip to ankle (inseam proxy)" },
            { key: "torsoLengthCm", label: "Torso Length (cm)", hint: "Shoulder midpoint to hip midpoint" },
            { key: "armLengthCm", label: "Arm Length (cm)", hint: "Shoulder to wrist (average both arms)" },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <label className="block text-slate-300 text-sm font-medium mb-1">{label}</label>
              <p className="text-slate-500 text-xs mb-2">{hint}</p>
              <input
                type="number" min={1} max={200} step={0.5}
                value={manualMeasurements[key as keyof typeof manualMeasurements]}
                onChange={(e) =>
                  setManualMeasurements((prev) => ({ ...prev, [key]: e.target.value }))
                }
                placeholder="0.0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
          ))}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl font-bold text-lg bg-teal-500 hover:bg-teal-400 text-white transition-all shadow-lg active:scale-95 mt-2"
          >
            View Results →
          </button>
        </form>
      </div>
    </main>
  );
}
