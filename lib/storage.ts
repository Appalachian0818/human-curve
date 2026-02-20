/**
 * LocalStorage utilities for Human Curve.
 * Only measurements and user profile are stored — never raw camera frames.
 */

import type { Measurements } from "./measurements";
import type { Sex, AgeRange, Country } from "./dataset";
import type { ScanMode } from "./scanMode";

export interface UserProfile {
  ageRange: AgeRange;
  sex: Sex | "prefer-not-to-say";
  heightCm: number;
  weightKg?: number;
  country: Country;
}

export interface StoredSession {
  profile: UserProfile;
  measurements: Measurements;
  capturedAt: string;
  scanMode: ScanMode;
}

const SESSION_KEY = "humancurve_session";

export function saveSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    console.warn("Could not save to localStorage");
  }
}

export function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    // Backfill scanMode for sessions saved before this field existed
    if (!parsed.scanMode) parsed.scanMode = "full-body";
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function eraseAllData(): void {
  if (typeof window === "undefined") return;
  localStorage.clear();
}
