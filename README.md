# Human Curve

**Camera-based body proportion estimator with percentile visualization.**

> ⚠️ **For entertainment only.** Estimates are not medically accurate. Accuracy varies with camera quality, lighting, and distance.

---

## What it does

Human Curve uses your device camera and MediaPipe AI pose detection to estimate body proportions — shoulder width, hip width, leg length, torso length, and arm length — then shows you where those measurements fall on percentile distributions compared to populations from 6 countries.

**Everything runs on your device.** No images or video are ever uploaded.

---

## Privacy Model

| What happens | Detail |
|---|---|
| Camera feed | Processed locally in browser via WebAssembly |
| Video frames | Never stored, never uploaded |
| Pose landmarks | Used transiently for computation, not stored |
| Computed measurements | Stored locally in `localStorage` only |
| Server communication | None required for core functionality |

You can erase all stored data at any time from the Results page.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: TailwindCSS
- **Pose detection**: MediaPipe Tasks Vision (Pose Landmarker Lite)
- **Charts**: Chart.js (via `chart.js/auto`)
- **Share card export**: `html-to-image`
- **State**: React `useState` + localStorage

---

## How to Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Download the pose model (required)

The MediaPipe model file must be placed at `public/models/pose_landmarker_lite.task`.

**Option A — Automated download:**
```bash
npm run download-model
```

**Option B — Manual download:**
Download from:
```
https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
```
Place the file at:
```
public/models/pose_landmarker_lite.task
```

The model is approximately 4 MB and is excluded from the git repository.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Run tests

```bash
npm test
```

---

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import the repo in [vercel.com/new](https://vercel.com/new).
3. Before deploying, add the model file via one of these options:
   - **Recommended**: Run `npm run download-model` locally, commit `public/models/pose_landmarker_lite.task` (remove it from `.gitignore` if needed), and push.
   - **Alternative**: Set Vercel build command to: `npm run download-model && npm run build`
4. Deploy — no environment variables required for the MVP.

> **Note on COOP/COEP headers**: The `next.config.mjs` sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. These are required for SharedArrayBuffer used internally by some WASM runtimes. Vercel supports these headers natively.

---

## Project Structure

```
human-curve/
├── app/
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Global styles + Tailwind
│   ├── profile/
│   │   └── page.tsx      # Step 1: Profile form
│   ├── scan/
│   │   └── page.tsx      # Step 2: Camera scan
│   └── results/
│       └── page.tsx      # Step 3: Results + charts
├── components/
│   ├── CameraView.tsx    # Camera + pose loop + capture
│   ├── PoseOverlay.tsx   # Canvas skeleton renderer
│   ├── QualityMeter.tsx  # Framing quality indicator
│   ├── MetricChart.tsx   # Distribution curve + user marker
│   └── ShareCard.tsx     # Exportable PNG share card
├── lib/
│   ├── pose.ts           # MediaPipe initialization
│   ├── measurements.ts   # Landmark to metrics computation
│   ├── stats.ts          # Normal CDF, percentile engine
│   ├── dataset.ts        # Synthetic anthropometric dataset
│   ├── badges.ts         # Archetype badge rules
│   ├── storage.ts        # localStorage utilities
│   └── analytics.ts      # Pluggable event tracking
├── scripts/
│   └── download-model.js # Model download helper
├── __tests__/
│   └── stats.test.ts     # Unit tests for stats.ts
└── public/
    └── models/           # Place pose_landmarker_lite.task here
```

---

## Limitations

- **Camera variance**: Measurements are estimates. Distance from camera, angle, clothing, and pose errors all affect accuracy.
- **Scale dependency**: All measurements are scaled using your self-reported height. If this is inaccurate, all measurements will shift proportionally.
- **2D projection**: MediaPipe landmarks are in 2D normalized space. Depth is not accounted for, so measurements assume you're standing roughly perpendicular to the camera.
- **Landmark visibility**: Partially visible body parts reduce accuracy. Ensure full-body visibility.
- **Sample dataset**: The percentile comparisons use a **synthetic** dataset, not real anthropometric research data. See below.

---

## Replacing the Sample Dataset

The dataset in `lib/dataset.ts` is clearly labeled synthetic. To replace it with real data:

1. Obtain a real anthropometric dataset (e.g. NHANES for US, KNHANES for Korea, WHO global database).
2. For each country × sex × age range, compute the **mean** and **standard deviation** for each metric.
3. Replace the entries in `DATASET` in `lib/dataset.ts`. The structure is:
   ```typescript
   "Country|sex|ageRange": {
     shoulderWidthCm: { mean: number, stddev: number },
     hipWidthCm: { mean: number, stddev: number },
     legLengthCm: { mean: number, stddev: number },
     torsoLengthCm: { mean: number, stddev: number },
     armLengthCm: { mean: number, stddev: number },
     wingspanCm: { mean: number, stddev: number },
     shoulderToHipRatio: { mean: number, stddev: number },
     legToTorsoRatio: { mean: number, stddev: number },
   }
   ```
4. No other code needs to change — the percentile engine (`lib/stats.ts`) works with any mean/stddev values.

---

## Manual E2E Smoke Checklist

- [ ] Landing page loads at `/`
- [ ] "Start Scan" navigates to `/profile`
- [ ] Profile form validates height range (100–250 cm)
- [ ] Submitting profile navigates to `/scan`
- [ ] Camera permission prompt appears
- [ ] Pose skeleton renders on video feed
- [ ] Quality meter shows "Good framing" when standing correctly
- [ ] Capture button enables after ~3 seconds of good framing
- [ ] Results page shows measurements, badges, and charts
- [ ] Country selector updates charts dynamically
- [ ] "Generate Share Card" renders and downloads as PNG
- [ ] "Erase all my data" clears localStorage and returns home
- [ ] "No camera? Enter measurements manually" fallback works end-to-end
- [ ] Mobile Safari: Camera opens, UI is usable
- [ ] Mobile Chrome: Camera opens, UI is usable

---

## Adding Analytics Providers

Replace the console logger in `lib/analytics.ts`:

```typescript
// Example: Vercel Analytics
import { track as vercelTrack } from '@vercel/analytics';
providers.push((event) => vercelTrack(event.name, event.properties));

// Example: PostHog
import posthog from 'posthog-js';
providers.push((event) => posthog.capture(event.name, event.properties));
```

---

## License

MIT
