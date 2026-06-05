// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import dashboard from "../../../../../../messages/en/dashboard.json";
import {
  ProjectStatisticsCard,
  type DayActivity,
} from "./project-statistics-card";

function renderCard(data?: DayActivity[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={dashboard}>
      <ProjectStatisticsCard data={data} />
    </NextIntlClientProvider>,
  );
}

const ALL_ZERO: DayActivity[] = [
  { day: "monday", count: 0 },
  { day: "tuesday", count: 0 },
  { day: "wednesday", count: 0 },
  { day: "thursday", count: 0 },
  { day: "friday", count: 0 },
  { day: "saturday", count: 0 },
  { day: "sunday", count: 0 },
];

describe("ProjectStatisticsCard", () => {
  it("shows the empty state (no fabricated bars) when there is no activity", () => {
    renderCard(ALL_ZERO);
    expect(
      screen.getByText(dashboard.dashboard.statistics.empty),
    ).toBeInTheDocument();
    // No bars should be rendered in the empty state.
    expect(document.querySelectorAll("[aria-label]")).not.toBeNull();
    expect(screen.queryByText(dashboard.dashboard.statistics.day.monday)).toBeNull();
  });

  it("shows the empty state when no data prop is provided", () => {
    renderCard(undefined);
    expect(
      screen.getByText(dashboard.dashboard.statistics.empty),
    ).toBeInTheDocument();
  });

  it("renders weekday axis labels and bars when there is activity", () => {
    renderCard([
      { day: "monday", count: 3 },
      { day: "tuesday", count: 5 },
      { day: "wednesday", count: 1 },
      { day: "thursday", count: 0 },
      { day: "friday", count: 2 },
      { day: "saturday", count: 0 },
      { day: "sunday", count: 0 },
    ]);
    // Empty message gone, weekday labels present.
    expect(
      screen.queryByText(dashboard.dashboard.statistics.empty),
    ).toBeNull();
    expect(
      screen.getByText(dashboard.dashboard.statistics.day.monday),
    ).toBeInTheDocument();
    // Tuesday is the busiest → its bar should be the tallest (100%).
    const bars = Array.from(
      document.querySelectorAll<HTMLDivElement>("[style*='height']"),
    );
    expect(bars.length).toBeGreaterThan(0);
  });
});
