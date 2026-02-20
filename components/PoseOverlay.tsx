"use client";

import { useEffect, useRef } from "react";
import type { Landmark } from "@/lib/measurements";

interface PoseOverlayProps {
  landmarks: Landmark[] | null;
  width: number;
  height: number;
}

// MediaPipe pose connections (pairs of landmark indices)
const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27], [27, 29], [29, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [30, 32],
  // Feet
  [27, 31], [28, 32],
];

// Key measurement landmarks to highlight
const KEY_LANDMARKS = new Set([11, 12, 23, 24, 15, 16, 27, 28, 0]);

export default function PoseOverlay({ landmarks, width, height }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length === 0) return;

    // Draw connections
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(99, 202, 183, 0.75)";
    ctx.lineCap = "round";

    for (const [a, b] of POSE_CONNECTIONS) {
      const la = landmarks[a];
      const lb = landmarks[b];
      if (!la || !lb) continue;
      if (
        (la.visibility !== undefined && la.visibility < 0.3) ||
        (lb.visibility !== undefined && lb.visibility < 0.3)
      )
        continue;

      ctx.beginPath();
      ctx.moveTo(la.x * width, la.y * height);
      ctx.lineTo(lb.x * width, lb.y * height);
      ctx.stroke();
    }

    // Draw landmark dots
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm) continue;
      if (lm.visibility !== undefined && lm.visibility < 0.3) continue;

      const x = lm.x * width;
      const y = lm.y * height;
      const isKey = KEY_LANDMARKS.has(i);

      ctx.beginPath();
      ctx.arc(x, y, isKey ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isKey ? "rgba(255, 220, 80, 0.9)" : "rgba(99, 202, 183, 0.8)";
      ctx.fill();

      if (isKey) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.stroke();
      }
    }
  }, [landmarks, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
