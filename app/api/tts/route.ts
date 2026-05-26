import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function buildWavHeader(pcmLen: number, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate   = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmLen, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmLen, 40);
  return header;
}

const STYLE_PROMPTS: Record<string, string> = {
  normal:        "Say naturally and clearly",
  excited:       "Say enthusiastically and with high energy",
  whispers:      "Say in a quiet, intimate, gentle whisper",
  "news-anchor": "Say in a formal, authoritative news anchor style",
  calm:          "Say softly, calmly, and peacefully",
  cheerful:      "Say in a highly cheerful, warm, and positive voice",
  sad:           "Say with a somber, melancholic, and emotional tone",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, style = "normal", voice = "Kore", apiKey } = body as {
      text?:   string;
      style?:  string;
      voice?:  string;
      apiKey?: string;
    };

    // ── Resolve API key: request body first, then env fallback ──────────
    const resolvedKey = apiKey?.trim() || process.env.GEMINI_API_KEY || "";
    if (!resolvedKey) {
      return NextResponse.json(
        { error: "No API key provided. Enter your Gemini API key above." },
        { status: 401 }
      );
    }
    if (!resolvedKey.startsWith("AIza")) {
      return NextResponse.json(
        { error: "Invalid API key format. Gemini keys start with 'AIza'." },
        { status: 401 }
      );
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text cannot be empty." }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ error: "Text exceeds 4,000 character limit." }, { status: 400 });
    }

    const stylePrefix = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.normal;
    const prompt      = `${stylePrefix}: ${text.trim()}`;

    const ai = new GoogleGenAI({ apiKey: resolvedKey });

    const response = await ai.models.generateContent({
      model:    "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inlineData = (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) {
      return NextResponse.json(
        { error: "Gemini returned no audio. Ensure your key has Gemini TTS access." },
        { status: 502 }
      );
    }

    const pcm    = Buffer.from(inlineData.data, "base64");
    const wav    = Buffer.concat([buildWavHeader(pcm.length), pcm]);

    return new NextResponse(wav, {
      status: 200,
      headers: {
        "Content-Type":        "audio/wav",
        "Content-Length":      String(wav.length),
        "Content-Disposition": 'inline; filename="myanmar-voice.wav"',
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected server error.";
    console.error("[/api/tts]", msg);

    // Surface helpful messages for common Gemini errors
    if (msg.includes("API_KEY_INVALID") || msg.includes("401")) {
      return NextResponse.json({ error: "Invalid API key. Please check and try again." }, { status: 401 });
    }
    if (msg.includes("PERMISSION_DENIED") || msg.includes("403")) {
      return NextResponse.json({ error: "API key doesn't have TTS permission. Enable Gemini API in Google AI Studio." }, { status: 403 });
    }
    if (msg.includes("quota") || msg.includes("429")) {
      return NextResponse.json({ error: "API quota exceeded. Wait a moment and try again." }, { status: 429 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
