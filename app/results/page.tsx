"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { loadSession, eraseAllData } from "@/lib/storage";
import { getStats, getFaceStats, getChestStats, getWaistStats, COUNTRIES } from "@/lib/dataset";
import type { Country, Sex } from "@/lib/dataset";
import { computeBadges } from "@/lib/badges";
import { track } from "@/lib/analytics";
import { computePercentile, ordinalSuffix } from "@/lib/stats";
import type { StoredSession } from "@/lib/storage";

const MetricChart = dynamic(() => import("@/components/MetricChart"), { ssr: false });
const ShareCard = dynamic(() => import("@/components/ShareCard"), { ssr: false });

export default function ResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>("Global");
  const [showShareCard, setShowShareCard] = useState(false);
  const [showEraseConfirm, setShowEraseConfirm] = useState(false);

  useEffect(() => {
    const s = loadSession();
    // Redirect if no captured data at all
    if (!s?.capturedAt) {
      router.replace("/scan");
      return;
    }
    setSession(s);
    setSelectedCountry(s.profile.country);
    track("results_viewed", { mode: s.scanMode });
  }, [router]);

  const handleCountryChange = useCallback((country: Country) => {
    setSelectedCountry(country);
    track("country_changed", { country });
  }, []);

  function handleErase() {
    eraseAllData();
    track("data_erased");
    router.push("/");
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { measurements, profile, scanMode } = session;
  const sex = (profile.sex === "prefer-not-to-say" ? "other" : profile.sex) as Sex;
  const stats = getStats(selectedCountry, sex, profile.ageRange);
  const faceStats = getFaceStats(sex);
  const chestStats = getChestStats(sex, selectedCountry);
  const waistStats = getWaistStats(sex, selectedCountry);
  const isFaceMode = scanMode === "face";
  const isUpperBody = scanMode === "upper-body";
  const isChestMode = scanMode === "chest";
  const isWaistMode = scanMode === "waist";
  const badges = isFaceMode || isChestMode || isWaistMode ? [] : computeBadges(measurements);

  // ── Metric sets by mode ──────────────────────────────────────────────────
  const bodyMetrics = [
    { label: "Shoulder Width", unit: "cm", value: measurements.shoulderWidthCm, stat: stats.shoulderWidthCm },
    { label: "Hip Width",      unit: "cm", value: measurements.hipWidthCm,      stat: stats.hipWidthCm },
    ...(!isUpperBody ? [
      { label: "Leg Length",   unit: "cm", value: measurements.legLengthCm,   stat: stats.legLengthCm },
    ] : []),
    { label: "Torso Length",   unit: "cm", value: measurements.torsoLengthCm, stat: stats.torsoLengthCm },
    { label: "Arm Length",     unit: "cm", value: measurements.armLengthCm,   stat: stats.armLengthCm },
    ...(!isUpperBody ? [
      { label: "Wingspan",     unit: "cm", value: measurements.wingspanCm,    stat: stats.wingspanCm },
    ] : []),
  ].filter((m) => m.value > 0);

  const ratioMetrics = [
    { label: "Shoulder / Hip Ratio", unit: "", value: measurements.shoulderToHipRatio, stat: stats.shoulderToHipRatio },
    ...(!isUpperBody ? [
      { label: "Leg / Torso Ratio", unit: "", value: measurements.legToTorsoRatio, stat: stats.legToTorsoRatio },
    ] : []),
  ].filter((m) => m.value > 0);

  const faceMetrics = isFaceMode && measurements.face
    ? [
        {
          label: "Eye Spacing Ratio",
          unit: "",
          value: measurements.face.interocularRatio,
          stat: faceStats.interocularRatio,
          hint: "Inner eye spacing / face width",
        },
        {
          label: "Facial Width Ratio",
          unit: "",
          value: measurements.face.facialWidthRatio,
          stat: faceStats.facialWidthRatio,
          hint: "Face width / face height",
        },
      ]
    : [];

  const modeLabelMap: Record<string, string> = {
    face: "😊 Face",
    "upper-body": "🙆 Upper Body",
    waist: "📏 Waist",
    chest: "📐 Chest",
    "full-body": "🧍 Full Body",
  };

  return (
    <main className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Home
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-white font-bold">Your Results</h1>
        </div>
        <Link
          href="/scan"
          onClick={() => track("rescan_clicked")}
          className="text-teal-400 hover:text-teal-300 transition-colors text-sm font-medium"
        >
          Rescan
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-6">

        {/* Mode pill */}
        <div className="flex justify-center">
          <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-4 py-1.5 rounded-full font-medium">
            {modeLabelMap[scanMode] ?? "Full Body"} Scan
          </span>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-xs">
          ⚠️ Estimates for entertainment only. Accuracy depends on camera quality,
          lighting, and distance. Not medical advice.
        </div>

        {/* ── WAIST MODE results ────────────────────────────────────────── */}
        {isWaistMode && measurements.waistCircumferenceCm ? (
          <>
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/60 rounded-2xl p-5 border border-slate-700">
              <p className="text-slate-400 text-xs mb-3">Waist Circumference</p>
              <div className="flex items-end gap-2 mb-1">
                <p className="text-5xl font-black text-white">
                  {measurements.waistCircumferenceCm}
                </p>
                <p className="text-slate-400 pb-1 text-lg">cm</p>
              </div>
              <p className="text-teal-400 text-sm font-semibold">
                {ordinalSuffix(computePercentile(
                  measurements.waistCircumferenceCm,
                  waistStats.waistCircumferenceCm.mean,
                  waistStats.waistCircumferenceCm.stddev
                ))} percentile vs {selectedCountry}
              </p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                Compare against country
              </label>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCountryChange(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      selectedCountry === c
                        ? "bg-teal-500/20 border-teal-500 text-teal-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-widest mb-3">
                Distribution
              </h2>
              <MetricChart
                label="Waist Circumference"
                unit="cm"
                value={measurements.waistCircumferenceCm}
                stats={waistStats.waistCircumferenceCm}
              />
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 text-slate-400 text-sm leading-relaxed">
              <p className="font-medium text-slate-300 mb-1">About this measurement</p>
              <p>
                Waist circumference is estimated from hip landmark width (front pose)
                and hip depth (side pose) using an ellipse approximation, with a
                correction factor for the waist-to-hip ratio. Accuracy depends on
                camera angle and pose consistency.
              </p>
            </div>
          </>
        ) : isChestMode && measurements.chestCircumferenceCm ? (
          <>
            {/* Summary card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/60 rounded-2xl p-5 border border-slate-700">
              <p className="text-slate-400 text-xs mb-3">Chest Circumference</p>
              <div className="flex items-end gap-2 mb-1">
                <p className="text-5xl font-black text-white">
                  {measurements.chestCircumferenceCm}
                </p>
                <p className="text-slate-400 pb-1 text-lg">cm</p>
              </div>
              <p className="text-teal-400 text-sm font-semibold">
                {ordinalSuffix(computePercentile(
                  measurements.chestCircumferenceCm,
                  chestStats.chestCircumferenceCm.mean,
                  chestStats.chestCircumferenceCm.stddev
                ))} percentile vs {selectedCountry}
              </p>
            </div>

            {/* Country selector */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                Compare against country
              </label>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCountryChange(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      selectedCountry === c
                        ? "bg-teal-500/20 border-teal-500 text-teal-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Distribution chart */}
            <div>
              <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-widest mb-3">
                Distribution
              </h2>
              <MetricChart
                label="Chest Circumference"
                unit="cm"
                value={measurements.chestCircumferenceCm}
                stats={chestStats.chestCircumferenceCm}
              />
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 text-slate-400 text-sm leading-relaxed">
              <p className="font-medium text-slate-300 mb-1">About this measurement</p>
              <p>
                Chest circumference is estimated from two poses using an ellipse
                approximation (Ramanujan&apos;s formula). Front-pose shoulder width
                provides the semi-axis for width; side-profile shoulder depth provides
                the semi-axis for depth. Accuracy depends heavily on camera angle
                and pose consistency.
              </p>
            </div>
          </>
        ) : isFaceMode && measurements.face ? (
          <>
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/60 rounded-2xl p-5 border border-slate-700">
              <p className="text-slate-400 text-xs mb-3">Face Proportions</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center bg-slate-700/40 rounded-xl p-3">
                  <p className="text-2xl font-black text-white">
                    {measurements.face.interocularRatio.toFixed(3)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Eye Spacing Ratio</p>
                  <p className="text-teal-400 text-sm font-semibold">
                    {ordinalSuffix(computePercentile(
                      measurements.face.interocularRatio,
                      faceStats.interocularRatio.mean,
                      faceStats.interocularRatio.stddev
                    ))} pct.
                  </p>
                </div>
                <div className="text-center bg-slate-700/40 rounded-xl p-3">
                  <p className="text-2xl font-black text-white">
                    {measurements.face.facialWidthRatio.toFixed(3)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Width/Height Ratio</p>
                  <p className="text-teal-400 text-sm font-semibold">
                    {ordinalSuffix(computePercentile(
                      measurements.face.facialWidthRatio,
                      faceStats.facialWidthRatio.mean,
                      faceStats.facialWidthRatio.stddev
                    ))} pct.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-widest mb-3">
                Distribution
              </h2>
              <div className="flex flex-col gap-4">
                {faceMetrics.map((m) => (
                  <div key={m.label}>
                    <MetricChart label={m.label} unit={m.unit} value={m.value} stats={m.stat} />
                    <p className="text-slate-600 text-xs mt-1 pl-1">{m.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 text-slate-400 text-sm leading-relaxed">
              <p className="font-medium text-slate-300 mb-1">About these measurements</p>
              <p>
                Face proportions are computed from the ear-to-ear width and inner eye
                spacing detected by the pose model. They use relative ratios rather than
                absolute measurements. Reference values are sample averages only.
              </p>
            </div>
          </>
        ) : (
          /* ── BODY MODE results (upper-body or full-body) ──────────────── */
          <>
            {/* Summary card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/60 rounded-2xl p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-400 text-xs">Profile</p>
                  <p className="text-white font-semibold">
                    {profile.ageRange} · {profile.heightCm} cm
                    {profile.weightKg ? ` · ${profile.weightKg} kg` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Comparing to</p>
                  <p className="text-teal-400 font-semibold">{selectedCountry}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{measurements.shoulderWidthCm}</p>
                  <p className="text-slate-500 text-xs">Shoulders cm</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{measurements.hipWidthCm}</p>
                  <p className="text-slate-500 text-xs">Hips cm</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-teal-400">{measurements.shoulderToHipRatio}</p>
                  <p className="text-slate-500 text-xs">S/H Ratio</p>
                </div>
              </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div>
                <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-widest mb-3">
                  Your Archetypes
                </h2>
                <div className="flex flex-col gap-3">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-start gap-3"
                    >
                      <span className="text-2xl">{b.emoji}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">{b.label}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Country selector */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                Compare against country
              </label>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCountryChange(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      selectedCountry === c
                        ? "bg-teal-500/20 border-teal-500 text-teal-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Measurement charts */}
            {bodyMetrics.length > 0 && (
              <div>
                <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-widest mb-3">
                  Measurements
                </h2>
                <div className="flex flex-col gap-4">
                  {bodyMetrics.map((m) => (
                    <MetricChart key={m.label} label={m.label} unit={m.unit} value={m.value} stats={m.stat} />
                  ))}
                </div>
              </div>
            )}

            {/* Ratio charts */}
            {ratioMetrics.length > 0 && (
              <div>
                <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-widest mb-3">
                  Ratios
                </h2>
                <div className="flex flex-col gap-4">
                  {ratioMetrics.map((m) => (
                    <MetricChart key={m.label} label={m.label} unit={m.unit} value={m.value} stats={m.stat} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Share card */}
        {!isFaceMode && !isChestMode && !isWaistMode && (
          <div>
            <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-widest mb-3">
              Share
            </h2>
            {!showShareCard ? (
              <button
                onClick={() => setShowShareCard(true)}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-all active:scale-95"
              >
                Generate Share Card ✨
              </button>
            ) : (
              <ShareCard
                measurements={measurements}
                badges={badges}
                profile={profile}
                selectedCountry={selectedCountry}
              />
            )}
          </div>
        )}

        {/* Data / privacy */}
        <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/40">
          <h3 className="text-slate-300 font-semibold text-sm mb-2">Your Data</h3>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Only computed measurements (numbers) are stored locally in your browser.
            No images, video, or camera frames are ever stored or sent anywhere.
          </p>
          {!showEraseConfirm ? (
            <button
              onClick={() => setShowEraseConfirm(true)}
              className="text-red-400 hover:text-red-300 text-sm transition-colors underline"
            >
              Erase all my data
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-red-400 text-sm">
                Are you sure? This will clear all stored data and return to the home page.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleErase}
                  className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
                >
                  Yes, erase everything
                </button>
                <button
                  onClick={() => setShowEraseConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-700 border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-slate-700 text-xs">
          Percentile data is based on a synthetic sample dataset. See README for details.
        </p>
      </div>
    </main>
  );
}
