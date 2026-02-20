"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AGE_RANGES, COUNTRIES, SEX_OPTIONS } from "@/lib/dataset";
import type { AgeRange, Country } from "@/lib/dataset";
import type { UserProfile } from "@/lib/storage";
import { saveSession, loadSession } from "@/lib/storage";
import { track } from "@/lib/analytics";

export default function ProfilePage() {
  const router = useRouter();

  const [ageRange, setAgeRange] = useState<AgeRange>("25-34");
  const [sex, setSex] = useState("prefer-not-to-say");
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [country, setCountry] = useState<Country>("Global");
  const [heightInput, setHeightInput] = useState("170");

  // Load saved profile after mount to avoid SSR/client hydration mismatch
  useEffect(() => {
    const existing = loadSession();
    if (!existing) return;
    setAgeRange(existing.profile.ageRange);
    setSex(existing.profile.sex);
    setHeightCm(existing.profile.heightCm);
    setWeightKg(existing.profile.weightKg ?? "");
    setCountry(existing.profile.country);
    setHeightInput(String(existing.profile.heightCm));
  }, []);

  function handleHeightChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setHeightInput(raw);
    const val = parseFloat(raw);
    if (!isNaN(val) && val >= 100 && val <= 250) setHeightCm(val);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!heightCm || heightCm < 100 || heightCm > 250) return;

    const profile: UserProfile = {
      ageRange,
      sex: sex as UserProfile["sex"],
      heightCm,
      weightKg: weightKg !== "" ? Number(weightKg) : undefined,
      country,
    };

    // Preserve existing measurements if rescan wasn't triggered
    const session = loadSession();
    saveSession({
      profile,
      measurements: session?.measurements ?? {
        shoulderWidthCm: 0,
        hipWidthCm: 0,
        legLengthCm: 0,
        torsoLengthCm: 0,
        armLengthCm: 0,
        wingspanCm: 0,
        shoulderToHipRatio: 0,
        legToTorsoRatio: 0,
        armspanToHeightRatio: 0,
        scaleFactor: 0,
      },
      capturedAt: session?.capturedAt ?? "",
      scanMode: session?.scanMode ?? "full-body",
    });

    track("page_view", { page: "profile_submitted" });
    router.push("/scan");
  }

  const isValid = heightCm >= 100 && heightCm <= 250;

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Back
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-white font-bold">Your Profile</h1>
        </div>
        <div className="w-12" />
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2 justify-center px-4 py-4">
        {["Profile", "Scan", "Results"].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                i === 0
                  ? "bg-teal-500 text-white"
                  : "bg-slate-700 text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs ${i === 0 ? "text-teal-400" : "text-slate-600"}`}
            >
              {step}
            </span>
            {i < 2 && <div className="w-6 h-px bg-slate-700" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-6">
          {/* Age Range */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Age Range
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {AGE_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setAgeRange(range)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    ageRange === range
                      ? "bg-teal-500/20 border-teal-500 text-teal-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Sex */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Sex{" "}
              <span className="text-slate-500 font-normal">(used for comparison group)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SEX_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSex(opt.value)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                    sex === opt.value
                      ? "bg-teal-500/20 border-teal-500 text-teal-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Height (cm) <span className="text-red-400">*</span>
              <span className="text-slate-500 font-normal ml-1">— required for scaling</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={100}
                max={250}
                step={1}
                value={heightInput}
                onChange={handleHeightChange}
                placeholder="e.g. 175"
                className={`flex-1 bg-slate-800 border rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 transition-all ${
                  isValid
                    ? "border-slate-700 focus:ring-teal-500"
                    : "border-red-500/60 focus:ring-red-500"
                }`}
              />
              <span className="text-slate-400 font-medium">cm</span>
            </div>
            <input
              type="range"
              min={100}
              max={220}
              step={1}
              value={heightCm}
              onChange={(e) => {
                setHeightCm(Number(e.target.value));
                setHeightInput(e.target.value);
              }}
              className="w-full mt-3"
            />
            <div className="flex justify-between text-slate-600 text-xs mt-1">
              <span>100 cm</span>
              <span className="text-teal-400 font-medium">{heightCm} cm</span>
              <span>220 cm</span>
            </div>
          </div>

          {/* Weight (optional) */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Weight (kg){" "}
              <span className="text-slate-500 font-normal">— optional, not used for pose detection</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={30}
                max={300}
                step={0.5}
                value={weightKg}
                onChange={(e) =>
                  setWeightKg(e.target.value === "" ? "" : parseFloat(e.target.value))
                }
                placeholder="e.g. 70 (optional)"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
              <span className="text-slate-400 font-medium">kg</span>
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Compare against country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as Country)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              isValid
                ? "bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/20 active:scale-95"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            Continue to Scan →
          </button>

          <p className="text-center text-slate-600 text-xs">
            Your data stays on your device. We never see it.
          </p>
        </div>
      </form>
    </main>
  );
}
