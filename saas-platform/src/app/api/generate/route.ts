import { PromptBuilder } from "@/lib/ai/prompt-builder";
import { singletonGeminiService } from "@/lib/ai";
import { NextResponse } from "next/server";
import { saveOutput } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    try {
      await saveOutput({
        user_id: userId,
        feature_type: "article_gen",
        input_params: { topic, role, style, tone, audience, format, length },
        output_data: { aiResponse },
      });
      console.log("Output saved successfully");
    } catch (error) {
      // do nothing
      console.error("Failed to save output:", error);
    }

    return NextResponse.json({ result: aiResponse });
  } catch (error) {
    // console.error("Error in /api/generate:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}