import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTrendGrounding } from "@/server/services/trend-grounding";

describe("fetchTrendGrounding", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty snippets when grounding disabled", async () => {
    const original = process.env.TREND_GROUNDING_ENABLED;
    process.env.TREND_GROUNDING_ENABLED = "false";
    const result = await fetchTrendGrounding("dark academia");
    expect(result.snippets).toEqual([]);
    process.env.TREND_GROUNDING_ENABLED = original;
  });

  it("parses snippets from DuckDuckGo payload", async () => {
    const original = process.env.TREND_GROUNDING_ENABLED;
    process.env.TREND_GROUNDING_ENABLED = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Heading: "Dark academia",
          AbstractText: "Dark academia is a style with moody tones.",
          AbstractURL: "https://example.com/dark-academia",
          RelatedTopics: [{ Text: "Muted palettes and film grain", FirstURL: "https://example.com/topic" }],
        }),
      })
    );

    const result = await fetchTrendGrounding("dark academia");
    expect(result.snippets.length).toBeGreaterThan(0);
    expect(result.snippets[0].url).toContain("http");
    process.env.TREND_GROUNDING_ENABLED = original;
  });
});
