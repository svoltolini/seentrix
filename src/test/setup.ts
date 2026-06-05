// Vitest setup for component tests. Imported automatically via the
// `setupFiles` entry in vitest.config.ts. Adds jest-dom matchers and a
// jsdom polyfill the app relies on but jsdom does not implement.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount React trees between tests to avoid cross-test DOM leakage.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement matchMedia; some components (and the
// reduced-motion hook) read it. Provide a no-op default.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
