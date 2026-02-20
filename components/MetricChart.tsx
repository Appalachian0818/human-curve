"use client";

import { useEffect, useRef } from "react";
import type { MetricStats } from "@/lib/dataset";
import { normalCurvePoints, computePercentile, ordinalSuffix } from "@/lib/stats";

interface MetricChartProps {
  label: string;
  unit: string;
  value: number;
  stats: MetricStats;
}

export default function MetricChart({ label, unit, value, stats }: MetricChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const percentile = computePercentile(value, stats.mean, stats.stddev);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dynamically import Chart.js to avoid SSR issues
    import("chart.js/auto").then((ChartModule) => {
      const Chart = ChartModule.default;

      // Destroy existing chart on the canvas
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();

      const points = normalCurvePoints(stats.mean, stats.stddev, 120);
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);

      // Find closest x to value for marker
      const closestIdx = xs.reduce(
        (best, x, i) => (Math.abs(x - value) < Math.abs(xs[best] - value) ? i : best),
        0
      );

      new Chart(canvas, {
        type: "line",
        data: {
          labels: xs.map((x) => x.toFixed(1)),
          datasets: [
            {
              label: "Population",
              data: ys,
              borderColor: "rgba(99, 202, 183, 0.8)",
              backgroundColor: "rgba(99, 202, 183, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
            },
            {
              label: "You",
              data: ys.map((y, i) => (i === closestIdx ? y : null)),
              borderColor: "rgba(255, 220, 80, 1)",
              backgroundColor: "rgba(255, 220, 80, 1)",
              borderWidth: 2,
              pointRadius: (ctx) => (ctx.dataIndex === closestIdx ? 8 : 0),
              pointBackgroundColor: "rgba(255, 220, 80, 1)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              showLine: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          animation: { duration: 400 },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => `${parseFloat(items[0].label).toFixed(1)} ${unit}`,
                label: () => "",
              },
            },
          },
          scales: {
            x: {
              type: "category",
              ticks: {
                maxTicksLimit: 7,
                callback(val, index) {
                  const num = parseFloat(xs[index]?.toFixed(1) ?? "0");
                  return `${num}`;
                },
                color: "#94a3b8",
                font: { size: 10 },
              },
              grid: { color: "rgba(255,255,255,0.05)" },
              border: { color: "rgba(255,255,255,0.1)" },
            },
            y: {
              display: false,
              grid: { display: false },
            },
          },
        },
      });
    });
  }, [stats, value, unit]);

  const percentileLabel = ordinalSuffix(percentile);

  const percentileColor =
    percentile >= 75
      ? "text-teal-400"
      : percentile >= 50
      ? "text-blue-400"
      : percentile >= 25
      ? "text-violet-400"
      : "text-slate-400";

  return (
    <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/60">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-slate-200 font-semibold text-sm">{label}</h3>
          <p className="text-2xl font-bold text-white mt-0.5">
            {value.toFixed(1)}{" "}
            <span className="text-slate-400 text-base font-normal">{unit}</span>
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${percentileColor}`}>{percentileLabel}</p>
          <p className="text-slate-500 text-xs mt-0.5">percentile</p>
        </div>
      </div>
      <canvas ref={canvasRef} height={90} />
      <p className="text-slate-500 text-xs mt-2">
        Population avg: {stats.mean.toFixed(1)} {unit} ± {stats.stddev.toFixed(1)}
      </p>
    </div>
  );
}
