import { PromptBuilder } from "@/lib/ai/prompt-builder";
import { singletonGeminiService } from "@/lib/ai";

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { topic, role, style, tone, audience, format, length } = await request.json();

  if (!topic) {
    return NextResponse.json({ error: "Topic is required." }, { status: 400 });
  }

  const promptBuilder = new PromptBuilder()
    .withRole(role)
    .withObjective(topic, length)
    .withStyle(style)
    .withTone(tone)
    .withAudience(audience)
    .withResponseFormat(format);
  const prompt = promptBuilder.build();
  const aiService = singletonGeminiService;

  try {
    const aiResponse = await aiService.generateText(prompt);
    return NextResponse.json({ result: aiResponse });
  } catch (error) {
    // console.error("Error in /api/generate:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}