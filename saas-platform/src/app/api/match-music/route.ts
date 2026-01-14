import { NextResponse } from "next/server";
import { singletonGeminiService } from "@/lib/ai";
import { auth } from "@clerk/nextjs/server";
import { matchMusicPrompt } from "@/lib/ai/prompt-builder";
import axios from "axios";

async function searchItunes(term: string, limit: number) {
    try {
        // Clean term: bỏ các ký tự lạ, khoảng trắng thừa
        const cleanTerm = term.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        if (!cleanTerm) return [];

        const response = await axios.get(`https://itunes.apple.com/search`, {
            params: {
                term: cleanTerm,
                media: "music",
                entity: "song",
                limit: limit
            }
        });
        return response.data.results;
    } catch (error) {
        console.error(`Error searching "${term}":`, error);
        return [];
    }
}

async function fetchSongsForGenre(genre: string[], keywords: string[], targetCount: number = 15) {
    const collectedSongs: any[] = [];
    const collectedIds = new Set<number>(); 

    for (const genreTerm of genre) {
        const searchTerms = [genreTerm, ...keywords];

        for (let i = keywords.length; i >= 0; i--) {
            const term = searchTerms.slice(0, i + 1).join(" ");
            const results = await searchItunes(term, targetCount - collectedSongs.length);
            for (const song of results) {
                if (!collectedIds.has(song.trackId)) {
                    collectedSongs.push(song);
                    collectedIds.add(song.trackId);
                    if (collectedSongs.length >= targetCount) break;
                }
            }
        }
    }
    
    return collectedSongs;
}

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
    const parsedResponse = JSON.parse(aiResponse);
    console.log("AI Parsed Response:", parsedResponse);
    // const finalResults: any[] = [];

    const { suggested_genres, keywords } = parsedResponse;
    if (!suggested_genres || !keywords) {
      return NextResponse.json({ error: "AI response is missing required fields." }, { status: 500 });
    }

    const songs = await fetchSongsForGenre(suggested_genres, keywords, 50);
    return NextResponse.json({ result: songs });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}