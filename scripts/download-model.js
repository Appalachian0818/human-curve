#!/usr/bin/env node
/**
 * Downloads the MediaPipe Pose Landmarker Lite model to public/models/
 * Run once before `npm run dev`:
 *   npm run download-model
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

const OUTPUT_DIR = path.join(__dirname, "..", "public", "models");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "pose_landmarker_lite.task");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (fs.existsSync(OUTPUT_FILE)) {
  const sizeKB = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);
  console.log(`✓ Model already exists (${sizeKB} KB). Skipping download.`);
  console.log(`  Path: ${OUTPUT_FILE}`);
  process.exit(0);
}

console.log("Downloading MediaPipe Pose Landmarker Lite model…");
console.log(`URL: ${MODEL_URL}`);
console.log(`Output: ${OUTPUT_FILE}`);

const file = fs.createWriteStream(OUTPUT_FILE);
let downloadedBytes = 0;

function download(url, dest, redirectCount = 0) {
  if (redirectCount > 5) {
    console.error("Too many redirects.");
    process.exit(1);
  }

  https
    .get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`Redirecting to: ${redirectUrl}`);
        download(redirectUrl, dest, redirectCount + 1);
        return;
      }

      if (response.statusCode !== 200) {
        console.error(`Download failed: HTTP ${response.statusCode}`);
        fs.unlinkSync(OUTPUT_FILE);
        process.exit(1);
      }

      const totalBytes = parseInt(response.headers["content-length"] || "0", 10);

      response.on("data", (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const pct = Math.round((downloadedBytes / totalBytes) * 100);
          process.stdout.write(`\rDownloading: ${pct}% (${Math.round(downloadedBytes / 1024)} KB)`);
        }
      });

      response.pipe(dest);

      dest.on("finish", () => {
        dest.close(() => {
          console.log(`\n✓ Model downloaded successfully (${Math.round(downloadedBytes / 1024)} KB)`);
          console.log(`  Saved to: ${OUTPUT_FILE}`);
        });
      });
    })
    .on("error", (err) => {
      fs.unlink(OUTPUT_FILE, () => {});
      console.error(`Download error: ${err.message}`);
      process.exit(1);
    });
}

download(MODEL_URL, file);
