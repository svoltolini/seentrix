// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { DropdownMenuLabel } from "./dropdown-menu";

describe("DropdownMenuLabel", () => {
  it("renders standalone (no <Menu.Group> ancestor) without throwing", () => {
    // Regression: base-ui's `Menu.GroupLabel` calls `useMenuGroupRootContext()`,
    // which THROWS ("MenuGroupRootContext is missing") when it isn't wrapped in
    // a `<Menu.Group>`. Every call site uses the label standalone, so this
    // crashed the whole menu on open (a client-side exception). The label must
    // render as a plain presentational element instead.
    render(<DropdownMenuLabel>Document language</DropdownMenuLabel>);
    expect(screen.getByText("Document language")).toBeTruthy();
  });
});
