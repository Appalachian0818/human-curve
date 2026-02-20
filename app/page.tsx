import Link from "next/link";

const features = [
  {
    icon: "📷",
    title: "Camera-Based",
    desc: "Uses your device camera with AI pose detection — no manual measurements needed.",
  },
  {
    icon: "🔒",
    title: "Fully On-Device",
    desc: "All processing happens in your browser. No images or video are ever uploaded.",
  },
  {
    icon: "📊",
    title: "Percentile Comparison",
    desc: "See how your proportions compare across 6 countries and demographics.",
  },
  {
    icon: "🎖️",
    title: "Body Archetypes",
    desc: "Discover your body proportion archetype with fun, neutral badges.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-2xl w-full mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white">
              Human
              <span className="text-teal-400">Curve</span>
            </h1>
            <p className="mt-3 text-slate-400 text-lg sm:text-xl font-light">
              Discover your body proportions
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-lg mb-10 leading-relaxed max-w-lg mx-auto">
            Point your camera, stand back, and let AI estimate your shoulder width,
            hip width, arm length, and more — then see where you sit on global
            percentile distributions.
          </p>

          {/* CTA */}
          <Link
            href="/profile"
            className="inline-block bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all shadow-xl shadow-teal-500/25 active:scale-95"
          >
            Start Scan →
          </Link>

          {/* Disclaimer pill */}
          <div className="mt-6 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-4 py-2 rounded-full">
            <span>⚠️</span>
            <span>Estimates for entertainment only — not medical advice</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 bg-slate-800/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-slate-400 text-sm font-semibold uppercase tracking-widest mb-8">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-slate-800 rounded-2xl p-5 border border-slate-700"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works steps */}
      <section className="px-4 py-12">
        <div className="max-w-lg mx-auto">
          <h2 className="text-center text-slate-400 text-sm font-semibold uppercase tracking-widest mb-8">
            Steps
          </h2>
          <div className="flex flex-col gap-4">
            {[
              ["1", "Enter your profile", "Age range, sex, and height (required for scaling)."],
              ["2", "Camera scan", "Stand 2–3 m away. AI detects your pose automatically."],
              ["3", "View results", "See percentiles, archetypes, and compare by country."],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {num}
                </div>
                <div>
                  <p className="text-white font-medium">{title}</p>
                  <p className="text-slate-400 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy section */}
      <section className="px-4 py-10 bg-slate-800/40 border-t border-slate-700/50">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
            <span>🔒</span> Privacy First
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your camera feed is <strong className="text-slate-200">never uploaded</strong>.
            Pose estimation runs entirely on your device using WebAssembly.
            Only the computed measurements (numbers) are stored locally in your
            browser — and only if you allow it. You can erase all data at any time
            from the Results page.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-600 text-xs border-t border-slate-800">
        <p>Human Curve · Entertainment only · Not medical advice · Data stays on your device</p>
      </footer>
    </main>
  );
}
