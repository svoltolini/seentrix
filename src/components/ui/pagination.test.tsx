// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "./pagination";

function renderPager(active = 2) {
  return render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#prev" />
        </PaginationItem>
        {[1, 2, 3].map((page) => (
          <PaginationItem key={page}>
            <PaginationLink href={`#${page}`} isActive={page === active}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#next" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

describe("Pagination", () => {
  it("exposes an accessible navigation landmark", () => {
    renderPager();
    expect(
      screen.getByRole("navigation", { name: /pagination/i })
    ).toBeInTheDocument();
  });

  it("marks the active page with aria-current=page and nothing else", () => {
    renderPager(2);
    const active = screen.getByRole("link", { name: "2" });
    expect(active).toHaveAttribute("aria-current", "page");

    expect(screen.getByRole("link", { name: "1" })).not.toHaveAttribute(
      "aria-current"
    );
    expect(screen.getByRole("link", { name: "3" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("labels the previous and next controls for screen readers", () => {
    renderPager();
    expect(
      screen.getByRole("link", { name: /go to previous page/i })
    ).toHaveAttribute("href", "#prev");
    expect(
      screen.getByRole("link", { name: /go to next page/i })
    ).toHaveAttribute("href", "#next");
  });

  it("renders an ellipsis with an sr-only label and hidden from a11y tree", () => {
    const { container } = renderPager();
    const ellipsis = container.querySelector('[data-slot="pagination-ellipsis"]');
    expect(ellipsis).not.toBeNull();
    expect(ellipsis).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText(/more pages/i)).toBeInTheDocument();
  });

  it("links each page number to its href", () => {
    renderPager(1);
    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "#1");
    expect(screen.getByRole("link", { name: "3" })).toHaveAttribute("href", "#3");
  });
});
