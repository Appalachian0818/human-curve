/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow MediaPipe WASM files to be served
  webpack(config, { isServer }) {
    // Ensure .wasm files are served as assets
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Exclude server-side bundle from trying to load browser-only packages
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "@mediapipe/tasks-vision",
      ];
    }

    return config;
  },

  // Security headers
  // NOTE: We intentionally omit Cross-Origin-Embedder-Policy (COEP) here.
  // Setting COEP: require-corp breaks Safari's ability to load cross-origin
  // resources (like MediaPipe WASM from CDN) that don't serve CORP headers.
  // MediaPipe Tasks Vision Lite does not require SharedArrayBuffer, so COEP
  // is not needed for this app.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // COOP alone is safe and doesn't block cross-origin subresources.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
