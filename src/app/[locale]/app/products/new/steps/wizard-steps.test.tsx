// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderWithIntl, screen, userEvent } from "@/test/render";
import { INITIAL_WIZARD_DATA, type WizardData } from "@/lib/validations/assessment";
import { StepProductInfo } from "./step-product-info";
import { StepDigitalElements } from "./step-digital-elements";
import { StepEuDistribution } from "./step-eu-distribution";

function makeData(overrides: Partial<WizardData> = {}): WizardData {
  return { ...INITIAL_WIZARD_DATA, ...overrides };
}

describe("StepProductInfo", () => {
  it("renders the name field and the four product-type options", () => {
    renderWithIntl(
      <StepProductInfo data={makeData()} onChange={vi.fn()} onNext={vi.fn()} />
    );
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    // Use accessible-name prefixes that uniquely identify each type card
    // (the firmware card's description also contains the word "software").
    expect(
      screen.getByRole("button", { name: /^Hardware/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Software/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Firmware/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^IoT Device/ })
    ).toBeInTheDocument();
  });

  it("reports each keystroke in the name field via onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <StepProductInfo data={makeData()} onChange={onChange} onNext={vi.fn()} />
    );
    await user.type(screen.getByLabelText(/product name/i), "Hi");
    // Controlled input fed a fixed `data.name=""`, so each keystroke is a
    // single-character update reported to the parent.
    expect(onChange).toHaveBeenCalledWith({ name: "H" });
    expect(onChange).toHaveBeenCalledWith({ name: "i" });
  });

  it("emits the chosen type when a type card is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <StepProductInfo data={makeData()} onChange={onChange} onNext={vi.fn()} />
    );
    await user.click(screen.getByRole("button", { name: /^IoT Device/ }));
    expect(onChange).toHaveBeenCalledWith({ type: "iot" });
  });

  it("disables Continue until both a name and a type are present", () => {
    const { rerender } = renderWithIntl(
      <StepProductInfo data={makeData()} onChange={vi.fn()} onNext={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    // Name only — still disabled.
    rerender(
      <StepProductInfo
        data={makeData({ name: "Thermostat" })}
        onChange={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    // Name + type — enabled.
    rerender(
      <StepProductInfo
        data={makeData({ name: "Thermostat", type: "iot" })}
        onChange={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("treats a whitespace-only name as invalid", () => {
    renderWithIntl(
      <StepProductInfo
        data={makeData({ name: "   ", type: "software" })}
        onChange={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("advances via onNext when Continue is enabled and clicked", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    renderWithIntl(
      <StepProductInfo
        data={makeData({ name: "Thermostat", type: "iot" })}
        onChange={vi.fn()}
        onNext={onNext}
      />
    );
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

describe("StepDigitalElements", () => {
  it("disables Continue until a yes/no choice is made", () => {
    const { rerender } = renderWithIntl(
      <StepDigitalElements
        data={makeData({ hasDigitalElements: null })}
        onChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    rerender(
      <StepDigitalElements
        data={makeData({ hasDigitalElements: false })}
        onChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />
    );
    // Even "No" is a valid decision — Continue becomes enabled.
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("emits hasDigitalElements true/false from the option cards", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <StepDigitalElements
        data={makeData()}
        onChange={onChange}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />
    );
    await user.click(
      screen.getByRole("button", { name: /contains digital elements/i })
    );
    expect(onChange).toHaveBeenCalledWith({ hasDigitalElements: true });

    await user.click(screen.getByRole("button", { name: /no digital elements/i }));
    expect(onChange).toHaveBeenCalledWith({ hasDigitalElements: false });
  });

  it("invokes onBack from the Back button", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderWithIntl(
      <StepDigitalElements
        data={makeData()}
        onChange={vi.fn()}
        onNext={vi.fn()}
        onBack={onBack}
      />
    );
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("StepEuDistribution", () => {
  it("disables Continue until a choice is made, then enables it", () => {
    const { rerender } = renderWithIntl(
      <StepEuDistribution
        data={makeData({ isEuDistribution: null })}
        onChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    rerender(
      <StepEuDistribution
        data={makeData({ isEuDistribution: true })}
        onChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("emits the EU-distribution decision", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <StepEuDistribution
        data={makeData()}
        onChange={onChange}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />
    );
    await user.click(screen.getByRole("button", { name: /not for the eu market/i }));
    expect(onChange).toHaveBeenCalledWith({ isEuDistribution: false });
  });
});
