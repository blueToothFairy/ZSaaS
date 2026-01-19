import { NextResponse } from "next/server";
import { singletonGeminiService } from "@/lib/ai";
import { auth } from "@clerk/nextjs/server";
import { RESUME_ANALYSIS_PROMPT } from "@/lib/ai/prompt-builder";
import { saveOutput } from "@/lib/db/queries";
import { parsePdf } from "@/lib/utils/pdf-parser";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pdfBuffer } = await request.json();
  if (!pdfBuffer) {
    return NextResponse.json({ error: "Missing PDF Buffer." }, { status: 400 });
  }
  
  const prompt = RESUME_ANALYSIS_PROMPT;
  const aiService = singletonGeminiService;
  const resumeText = await parsePdf(Buffer.from(pdfBuffer.data));
  try {
    const aiResponse = await aiService.analyzeResume(prompt, resumeText);

    try {
      await saveOutput({
        user_id: userId,
        feature_type: "resume_analysis",
        input_params: { prompt, resumeText },
        output_data: { aiResponse },
      });
    } catch (dbError) {
      // do nothing
      console.error("Error saving resume analysis output to DB:", dbError);
    }

    return NextResponse.json({ result: aiResponse });
  } catch (error) {
    // console.error("Error in /api/analyze-resume:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}