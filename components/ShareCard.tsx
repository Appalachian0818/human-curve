"use client";

import { useRef, useState } from "react";
import type { Measurements } from "@/lib/measurements";
import type { Badge } from "@/lib/badges";
import type { UserProfile } from "@/lib/storage";
import { computePercentile, ordinalSuffix } from "@/lib/stats";
import { getStats } from "@/lib/dataset";
import type { Sex, Country } from "@/lib/dataset";

interface ShareCardProps {
  measurements: Measurements;
  badges: Badge[];
  profile: UserProfile;
  selectedCountry: Country;
}

export default function ShareCard({
  measurements,
  badges,
  profile,
  selectedCountry,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const sex = (profile.sex === "prefer-not-to-say" ? "other" : profile.sex) as Sex;
  const stats = getStats(selectedCountry, sex, profile.ageRange);

  const metrics = [
    {
      label: "Shoulder Width",
      value: measurements.shoulderWidthCm,
      stat: stats.shoulderWidthCm,
      unit: "cm",
    },
    {
      label: "Hip Width",
      value: measurements.hipWidthCm,
      stat: stats.hipWidthCm,
      unit: "cm",
    },
    {
      label: "Leg Length",
      value: measurements.legLengthCm,
      stat: stats.legLengthCm,
      unit: "cm",
    },
    {
      label: "Torso Length",
      value: measurements.torsoLengthCm,
      stat: stats.torsoLengthCm,
      unit: "cm",
    },
  ];

  async function handleExport() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = "human-curve-results.png";
      link.href = dataUrl;
      link.click();

      // Track event
      const { track } = await import("@/lib/analytics");
      track("share_card_exported");
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The card itself */}
      <div
        ref={cardRef}
        className="w-full max-w-sm bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 border border-slate-700"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-2xl font-black text-white tracking-tight">
            Human<span className="text-teal-400">Curve</span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">Body Proportion Estimates</p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {metrics.map((m) => {
            const p = computePercentile(m.value, m.stat.mean, m.stat.stddev);
            return (
              <div
                key={m.label}
                className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700/50"
              >
                <p className="text-slate-400 text-xs mb-1">{m.label}</p>
                <p className="text-white font-bold text-lg">
                  {m.value.toFixed(1)}
                  <span className="text-xs text-slate-400 font-normal"> {m.unit}</span>
                </p>
                <p className="text-teal-400 text-sm font-semibold">{ordinalSuffix(p)}</p>
              </div>
            );
          })}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {badges.slice(0, 3).map((b) => (
              <span
                key={b.id}
                className="bg-teal-500/20 text-teal-300 text-xs px-3 py-1 rounded-full border border-teal-500/30 font-medium"
              >
                {b.emoji} {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Context */}
        <div className="text-center text-slate-600 text-xs">
          <p>{selectedCountry} · {profile.ageRange} · {profile.heightCm}cm</p>
          <p className="mt-1">humancurve.app · For entertainment only</p>
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full max-w-sm py-3 rounded-xl font-semibold text-sm transition-all bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {exporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Exporting…
          </>
        ) : (
          <>
            <span>↓</span> Download Share Card
          </>
        )}
      </button>
    </div>
  );
}
