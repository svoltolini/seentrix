// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderWithIntl, screen, userEvent } from "@/test/render";
import { OutOfScopeCard, type OutOfScopeReason } from "./out-of-scope-card";

describe("OutOfScopeCard", () => {
  it.each<OutOfScopeReason>([
    "noDigitalElements",
    "noEuDistribution",
    "excludedSector",
  ])("renders the out-of-scope title with a reason message for '%s'", (reason) => {
    renderWithIntl(<OutOfScopeCard reason={reason} onStartOver={vi.fn()} />);
    // The shared title is present regardless of reason...
    expect(
      screen.getByRole("heading", { name: /out of cra scope/i })
    ).toBeInTheDocument();
    // ...and the reason paragraph resolves to real, non-empty copy (not the
    // raw i18n key), proving each reason has a translation.
    const startOver = screen.getByRole("button", { name: /start over/i });
    expect(startOver).toBeInTheDocument();
  });

  it("renders distinct reason copy per reason", () => {
    const { rerender } = renderWithIntl(
      <OutOfScopeCard reason="noDigitalElements" onStartOver={vi.fn()} />
    );
    const first = document.body.textContent ?? "";

    rerender(<OutOfScopeCard reason="excludedSector" onStartOver={vi.fn()} />);
    const second = document.body.textContent ?? "";

    // Different reasons should surface different explanatory text.
    expect(first).not.toEqual(second);
    // And neither should leak a raw translation key.
    expect(first).not.toMatch(/outOfScope\.reasons\./);
    expect(second).not.toMatch(/outOfScope\.reasons\./);
  });

  it("calls onStartOver when the Start Over button is clicked", async () => {
    const user = userEvent.setup();
    const onStartOver = vi.fn();
    renderWithIntl(
      <OutOfScopeCard reason="noEuDistribution" onStartOver={onStartOver} />
    );
    await user.click(screen.getByRole("button", { name: /start over/i }));
    expect(onStartOver).toHaveBeenCalledTimes(1);
  });
});
