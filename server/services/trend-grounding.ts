import "server-only";

export interface GroundingSnippet {
  title: string;
  snippet: string;
  url: string;
}

export async function fetchTrendGrounding(styleTerm: string): Promise<{
  snippets: GroundingSnippet[];
  error?: string;
}> {
  const enabled = process.env.TREND_GROUNDING_ENABLED === "true";
  if (!enabled) return { snippets: [] };

  try {
    const url = new URL("https://api.duckduckgo.com/");
    url.searchParams.set("q", `${styleTerm} visual style photography aesthetic`);
    url.searchParams.set("format", "json");
    url.searchParams.set("no_html", "1");
    url.searchParams.set("skip_disambig", "1");

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) return { snippets: [] };
    const data = (await response.json()) as {
      Heading?: string;
      AbstractText?: string;
      AbstractURL?: string;
      RelatedTopics?: Array<{
        Text?: string;
        FirstURL?: string;
      }>;
    };

    const snippets: GroundingSnippet[] = [];
    if (data.AbstractText && data.AbstractURL) {
      snippets.push({
        title: data.Heading ?? styleTerm,
        snippet: data.AbstractText,
        url: data.AbstractURL,
      });
    }
    for (const topic of data.RelatedTopics ?? []) {
      if (!topic.Text || !topic.FirstURL) continue;
      snippets.push({
        title: styleTerm,
        snippet: topic.Text,
        url: topic.FirstURL,
      });
      if (snippets.length >= 4) break;
    }
    return { snippets };
  } catch (error) {
    return { snippets: [], error: (error as Error).message };
  }
}
