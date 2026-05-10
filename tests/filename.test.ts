import { describe, expect, it } from "vitest";
import { buildExportFilename } from "@/lib/filename";

describe("buildExportFilename", () => {
  it("uses 'untitled' when restaurant name is empty", () => {
    expect(buildExportFilename("", "2026-05-10")).toBe("scorder-demo_2026-05-10_untitled.json");
  });

  it("preserves Chinese characters", () => {
    expect(buildExportFilename("小龍麵店", "2026-05-10")).toBe(
      "scorder-demo_2026-05-10_小龍麵店.json"
    );
  });

  it("strips reserved filename characters", () => {
    expect(buildExportFilename('a/b\\c:d*e?f"g<h>i|j', "2026-05-10")).toBe(
      "scorder-demo_2026-05-10_abcdefghij.json"
    );
  });

  it("trims leading/trailing whitespace and dots", () => {
    expect(buildExportFilename("   .店家.   ", "2026-05-10")).toBe(
      "scorder-demo_2026-05-10_店家.json"
    );
  });
});
