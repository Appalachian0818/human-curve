/**
 * Analytics hooks — console-based by default.
 * Replace the `providers` array to plug in a real analytics service.
 */

type EventName =
  | "page_view"
  | "scan_started"
  | "scan_captured"
  | "results_viewed"
  | "country_changed"
  | "share_card_exported"
  | "rescan_clicked"
  | "data_erased";

interface AnalyticsEvent {
  name: EventName;
  properties?: Record<string, string | number | boolean>;
}

type Provider = (event: AnalyticsEvent) => void;

// ---- Built-in: console logger ----
const consoleProvider: Provider = (event) => {
  console.log("[Analytics]", event.name, event.properties ?? "");
};

// ---- Register additional providers here ----
// Example: import { track } from '@vercel/analytics'; providers.push(e => track(e.name, e.properties));
const providers: Provider[] = [consoleProvider];

export function track(name: EventName, properties?: AnalyticsEvent["properties"]): void {
  const event: AnalyticsEvent = { name, properties };
  for (const provider of providers) {
    try {
      provider(event);
    } catch {
      // Never let analytics crash the app
    }
  }
}
