import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Human Curve — Body Proportion Estimator",
  description:
    "Estimate your body proportions with your camera and see where you fall on percentile distributions. All processing happens on your device.",
  keywords: ["body proportions", "pose estimation", "anthropometrics", "percentile"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
