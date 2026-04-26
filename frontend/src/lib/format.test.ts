import { describe, expect, it } from "vitest";
import { formatDate, formatRM } from "./format";

describe("format helpers", () => {
  it("formats RM amounts with 2 decimal places", () => {
    expect(formatRM(1234.5)).toBe("RM 1,234.50");
    expect(formatRM(0)).toBe("RM 0.00");
  });

  it("formats dates in en-GB short format", () => {
    expect(formatDate("2026-03-05")).toBe("05 Mar 2026");
    expect(formatDate(new Date("2026-12-31"))).toBe("31 Dec 2026");
  });
});
