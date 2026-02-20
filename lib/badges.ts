/**
 * Badge / Archetype rules based on body proportion ratios.
 * Language is intentionally neutral and non-judgmental.
 */

import type { Measurements } from "./measurements";

export interface Badge {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export function computeBadges(m: Measurements): Badge[] {
  const badges: Badge[] = [];

  // Shoulder-to-hip ratio
  const shr = m.shoulderToHipRatio;
  if (shr >= 1.35) {
    badges.push({
      id: "broad-shouldered",
      label: "Broad-Shouldered",
      emoji: "🏋️",
      description: "Your shoulders are notably wider relative to your hips.",
    });
  } else if (shr <= 0.88) {
    badges.push({
      id: "wide-hipped",
      label: "Wide-Hipped",
      emoji: "🌊",
      description: "Your hips are notably wider relative to your shoulders.",
    });
  } else if (shr >= 1.1 && shr < 1.35) {
    badges.push({
      id: "athletic-frame",
      label: "Athletic Frame",
      emoji: "⚡",
      description: "You have a classic V-taper proportion.",
    });
  } else {
    badges.push({
      id: "balanced-frame",
      label: "Balanced Frame",
      emoji: "⚖️",
      description: "Your shoulders and hips are well-proportioned.",
    });
  }

  // Leg-to-torso ratio
  const ltr = m.legToTorsoRatio;
  if (ltr >= 1.7) {
    badges.push({
      id: "long-legged",
      label: "Long-Legged",
      emoji: "🦒",
      description: "Your legs are long relative to your torso.",
    });
  } else if (ltr <= 1.25) {
    badges.push({
      id: "long-torso",
      label: "Long-Torso",
      emoji: "🐢",
      description: "You have a longer torso relative to your legs.",
    });
  } else {
    badges.push({
      id: "proportional-body",
      label: "Proportional Build",
      emoji: "📐",
      description: "Your legs and torso are proportionally balanced.",
    });
  }

  // Armspan-to-height ratio (wingspan / height)
  const ahr = m.armspanToHeightRatio;
  if (ahr >= 1.05) {
    badges.push({
      id: "long-reach",
      label: "Long Reach",
      emoji: "🦅",
      description: "Your wingspan exceeds your height — a classic distance-swimmer trait.",
    });
  } else if (ahr <= 0.95) {
    badges.push({
      id: "compact-limbs",
      label: "Compact Build",
      emoji: "🤸",
      description: "Your armspan is shorter than your height.",
    });
  }

  // Sprinter / long-limb combo
  if (ltr >= 1.6 && ahr >= 1.02) {
    badges.push({
      id: "sprinter-build",
      label: "Sprinter Build",
      emoji: "🏃",
      description: "Long limbs relative to torso — a build associated with speed and reach.",
    });
  }

  return badges;
}
