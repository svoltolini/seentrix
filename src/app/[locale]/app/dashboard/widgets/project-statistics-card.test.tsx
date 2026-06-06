// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import dashboard from "../../../../../../messages/en/dashboard.json";
import {
  ProjectStatisticsCard,
  type DayActivity,
} from "./project-statistics-card";

function renderCard(points?: DayActivity[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={dashboard}>
      <ProjectStatisticsCard points={points} />
    </NextIntlClientProvider>,
  );
}

function utcKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Monday→Sunday dates of the *current* UTC week, so tests don't depend on
 *  which day they run. */
function currentWeekDates(): Date[] {
  const now = new Date();
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const mondayIdx = (now.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - mondayIdx);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d;
  });
}

const WEEK = currentWeekDates();
const ALL_ZERO: DayActivity[] = WEEK.map((d) => ({ date: utcKey(d), count: 0 }));

describe("ProjectStatisticsCard", () => {
  it("shows the empty state (no fabricated bars) when there is no activity", () => {
    renderCard(ALL_ZERO);
    expect(
      screen.getByText(dashboard.dashboard.statistics.empty),
    ).toBeInTheDocument();
    // No weekday axis is rendered in the empty state.
    expect(
      screen.queryByText(dashboard.dashboard.statistics.day.monday),
    ).toBeNull();
  });

  it("shows the empty state when no data prop is provided", () => {
    renderCard(undefined);
    expect(
      screen.getByText(dashboard.dashboard.statistics.empty),
    ).toBeInTheDocument();
  });

  it("renders weekday axis labels and bars when there is activity", () => {
    // Put activity on Monday and Tuesday of the current week.
    renderCard([
      { date: utcKey(WEEK[0]), count: 3 },
      { date: utcKey(WEEK[1]), count: 5 },
      { date: utcKey(WEEK[2]), count: 1 },
    ]);
    // Empty message gone; the default "This week" view shows weekday labels.
    expect(
      screen.queryByText(dashboard.dashboard.statistics.empty),
    ).toBeNull();
    expect(
      screen.getByText(dashboard.dashboard.statistics.day.monday),
    ).toBeInTheDocument();
    // Bars are rendered (height-styled divs).
    const bars = Array.from(
      document.querySelectorAll<HTMLDivElement>("[style*='height']"),
    );
    expect(bars.length).toBeGreaterThan(0);
  });
});
