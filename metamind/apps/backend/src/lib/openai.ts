import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Meta Tag Generation ─────────────────────────────────────

interface MetaGenerationInput {
  content: string;
  pageType: string;
  keyword?: string;
  brandName?: string;
  tone?: string;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  language?: string;
}

interface MetaGenerationOutput {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export async function generateMeta(
  input: MetaGenerationInput
): Promise<MetaGenerationOutput> {
  const {
    content,
    pageType,
    keyword = "",
    brandName = "",
    tone = "professional",
    maxTitleLength = 60,
    maxDescriptionLength = 155,
    language = "en",
  } = input;

  const systemPrompt = `You are an expert SEO copywriter. Generate meta tags in ${language}. 
Respond ONLY in valid JSON with keys: title, description, ogTitle, ogDescription.
No markdown, no code fences, just JSON.`;

  const userPrompt = `Generate SEO meta tags for this ${pageType}.

Constraints:
- Title: max ${maxTitleLength} characters${keyword ? `, include keyword "${keyword}"` : ""}${brandName ? `, end with "| ${brandName}"` : ""}
- Description: max ${maxDescriptionLength} characters, compelling call to action
- OG Title: can be slightly more creative than meta title, max 70 chars
- OG Description: max 200 chars, social-media friendly
- Tone: ${tone}

Page content:
${content.slice(0, 3000)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const text = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(text);

  return {
    title: parsed.title || "",
    description: parsed.description || "",
    ogTitle: parsed.ogTitle || parsed.title || "",
    ogDescription: parsed.ogDescription || parsed.description || "",
  };
}

// ─── Alt Text Generation (Vision) ───────────────────────────

interface AltTextInput {
  imageUrl: string;
  pageContext?: string;
  maxLength?: number;
}

export async function generateAltText(
  input: AltTextInput
): Promise<string> {
  const { imageUrl, pageContext = "", maxLength = 125 } = input;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You describe images for alt text attributes. Rules:
- Max ${maxLength} characters
- Be specific and descriptive
- Don't start with "Image of" or "Picture of"
- Return ONLY the alt text, nothing else`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: pageContext
              ? `Describe this image. It appears on a page about: ${pageContext}`
              : "Describe this image for an alt text attribute.",
          },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "low" },
          },
        ],
      },
    ],
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}

// ─── Token counting helper ───────────────────────────────────

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}
