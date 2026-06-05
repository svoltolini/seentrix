import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

// Load the REAL message catalogs the app ships so component tests exercise
// production copy and fail if a translation key is missing or renamed.
import assessment from "../../messages/en/assessment.json";
import common from "../../messages/en/common.json";
import conformity from "../../messages/en/conformity.json";

const messages = { ...common, ...assessment, ...conformity };

function Providers({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * Render a component inside the next-intl provider (English messages).
 * Re-exports everything from RTL so tests can `import { renderWithIntl, screen }`.
 */
export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: Providers, ...options });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
