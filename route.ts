import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { BirthData, MonthlyAstroReading } from "@/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { birthData, monthKey }: { birthData: BirthData; monthKey: string } = await req.json();

    const [year, month] = monthKey.split("-").map(Number);
    const monthName = new Date(year, month - 1, 1).toLocaleString("default", {
      month: "long", year: "numeric"
    });

    const prompt = `You are a gifted, intuitive astrologer who combines traditional astrological wisdom with modern psychological depth. Your tone is warm, poetic, and empowering — like a wise older sister who also reads charts.

The person you're reading for:
- Birth date: ${birthData.date}
- Birth time: ${birthData.time} (or unknown if not set)
- Birth location: ${birthData.location}
- Sun: Capricorn | Moon: Aries | Rising: Leo
- Human Design: Projector, Splenic Authority, 1/3 Profile (Investigator/Martyr)
- She is building a personal brand called "Dark Feminine Sage" — a blend of coaching/healing, beauty/lifestyle, and content creation
- Jupiter is entering Leo around July 25, 2026 — a major emergence window for her

Generate a monthly astrology transit reading for ${monthName}. Include:

1. **Overall theme** for the month (2-3 sentences, evocative and personal)
2. **Key transits** affecting her chart specifically (mention 3-4 major ones)
3. **For her Aries Moon** — emotional weather this month
4. **For her Leo Rising** — visibility, presence, and social dynamics
5. **For her Capricorn stellium** — career, ambition, and building
6. **Dark Feminine Sage brand** — how the energy supports or challenges her launch work
7. **Shadow work theme** — one thing her 1/3 profile is being asked to examine
8. **Power dates this month** — 3-5 specific dates with a brief note on the energy

Keep it under 600 words. Make it feel like a real reading, not a horoscope column. Speak directly to her — use "you" language.

Also output a JSON block at the end in this exact format (after all the reading text):
<KEY_DATES_JSON>
[
  {"date": "YYYY-MM-DD", "event": "Transit name", "energy": "One-line note"},
  ...
]
</KEY_DATES_JSON>`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const fullText = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract key dates JSON
    const jsonMatch = fullText.match(/<KEY_DATES_JSON>([\s\S]*?)<\/KEY_DATES_JSON>/);
    let keyDates: { date: string; event: string; energy: string }[] = [];
    if (jsonMatch) {
      try {
        keyDates = JSON.parse(jsonMatch[1].trim());
      } catch {
        keyDates = [];
      }
    }

    const aiSummary = fullText.replace(/<KEY_DATES_JSON>[\s\S]*?<\/KEY_DATES_JSON>/, "").trim();

    const reading: MonthlyAstroReading = {
      monthKey,
      aiSummary,
      userNotes: "",
      generatedAt: new Date().toISOString(),
      keyDates,
    };

    return NextResponse.json(reading);
  } catch (error) {
    console.error("Astrology API error:", error);
    return NextResponse.json({ error: "Failed to generate reading" }, { status: 500 });
  }
}
