import { NextResponse } from "next/server";
import { singletonGeminiService } from "@/lib/ai";
import { auth } from "@clerk/nextjs/server";
import { matchMusicPrompt } from "@/lib/ai/prompt-builder";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { base64ImageFile } = await request.json();
  if (!base64ImageFile) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }

  const prompt = matchMusicPrompt;

  try {
    const aiService = singletonGeminiService;
    const aiResponse = await aiService.matchMusicToImage(prompt, base64ImageFile);
    return NextResponse.json({ result: aiResponse });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}