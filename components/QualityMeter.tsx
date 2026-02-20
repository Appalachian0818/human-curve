"use client";

interface QualityMeterProps {
  message: string;
  isGood: boolean;
  goodFrameCount: number;
  requiredFrames: number;
}

export default function QualityMeter({
  message,
  isGood,
  goodFrameCount,
  requiredFrames,
}: QualityMeterProps) {
  const progress = Math.min(100, (goodFrameCount / requiredFrames) * 100);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          isGood
            ? "bg-green-500/20 text-green-300 border border-green-500/40"
            : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
        }`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            isGood ? "bg-green-400 animate-pulse" : "bg-yellow-400"
          }`}
        />
        <span>{message}</span>
      </div>

      {isGood && goodFrameCount < requiredFrames && (
        <div className="mt-2 px-1">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Capturing…</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
