export type ScanMode = "face" | "upper-body" | "full-body" | "chest";
/** Internal camera modes used only for two-pose chest capture routing */
export type CameraMode = ScanMode | "chest-front" | "chest-side";

export interface ScanModeOption {
  id: ScanMode;
  label: string;
  emoji: string;
  tagline: string;
  details: string[];
  autoCapture: boolean;
  recommended?: boolean;
  /** Number of stable frames required before capture unlocks / countdown starts */
  requiredGoodFrames: number;
}

export const SCAN_MODE_OPTIONS: ScanModeOption[] = [
  {
    id: "face",
    label: "Face",
    emoji: "😊",
    tagline: "Facial proportions & symmetry",
    details: [
      "Hold phone at arm's length",
      "Look straight ahead",
      "Good frontal lighting",
    ],
    autoCapture: false,
    requiredGoodFrames: 20,
  },
  {
    id: "upper-body",
    label: "Upper Body",
    emoji: "🙆",
    tagline: "Shoulders, arms & torso",
    details: [
      "Stand ~1 m from the camera",
      "Upper body fully visible",
      "Arms relaxed at sides",
    ],
    autoCapture: false,
    requiredGoodFrames: 25,
  },
  {
    id: "chest",
    label: "Chest",
    emoji: "📐",
    tagline: "Chest circumference — two quick poses",
    details: [
      "Stand ~1 m from the camera",
      "Pose 1: face the camera directly",
      "Pose 2: turn 90° to your side",
      "Each pose auto-captures in 3 seconds",
    ],
    autoCapture: true,
    requiredGoodFrames: 25,
  },
  {
    id: "full-body",
    label: "Full Body",
    emoji: "🧍",
    tagline: "Complete body proportions",
    details: [
      "Stand 2–3 m from the camera",
      "Full body visible — head to feet",
      "Auto-captures after 3-second countdown",
    ],
    autoCapture: true,
    recommended: true,
    requiredGoodFrames: 30,
  },
];

export function getScanModeOption(mode: ScanMode): ScanModeOption {
  return SCAN_MODE_OPTIONS.find((m) => m.id === mode)!;
}
