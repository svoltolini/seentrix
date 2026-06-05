// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import { OptionCard } from "./option-card";

describe("OptionCard", () => {
  it("renders the title and optional description", () => {
    render(
      <OptionCard
        title="Yes, it has digital elements"
        description="Includes software or connectivity"
        selected={false}
        onSelect={() => {}}
      />
    );
    expect(
      screen.getByText("Yes, it has digital elements")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Includes software or connectivity")
    ).toBeInTheDocument();
  });

  it("renders as a button so it is keyboard-accessible", () => {
    render(<OptionCard title="Option" selected={false} onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /option/i })).toBeInTheDocument();
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<OptionCard title="Pick me" selected={false} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /pick me/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows the selected check indicator only when selected", () => {
    const { rerender, container } = render(
      <OptionCard title="Toggle" selected={false} onSelect={() => {}} />
    );
    // Unselected: no check glyph rendered.
    expect(container.querySelector("svg")).toBeNull();

    rerender(<OptionCard title="Toggle" selected={true} onSelect={() => {}} />);
    // Selected: the check icon (an svg) appears.
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
