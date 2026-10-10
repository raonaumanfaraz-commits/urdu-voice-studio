import { NextResponse } from "next/server";

const VOICES_CACHE_DURATION = 24 * 60 * 60; // 24h in seconds

let cachedVoices: unknown = null;
let cacheTimestamp = 0;

function parseVoice(
  v: {
    name: string;
    languageCodes: string[];
    ssmlGender: string;
    naturalSampleRateHertz: number;
  },
  languageName: string
) {
  const parts = v.name.split("-");
  let modelType = "Standard";
  let supportsPitch = true;
  let displayName = "";

  if (v.name.toLowerCase().includes("chirp")) {
    modelType = "Chirp3-HD";
    supportsPitch = false;
    const rawName = parts.slice(3).filter((p) => !/^(chirp|hd|chirp3)$/i.test(p)).join(" ");
    displayName = rawName || parts.slice(3).join(" ") || v.name;
  } else if (v.name.toLowerCase().includes("wavenet")) {
    modelType = "WaveNet";
    supportsPitch = true;
    const voiceLetter = parts[parts.length - 1];
    displayName = `WaveNet ${voiceLetter}`;
  } else if (v.name.toLowerCase().includes("standard")) {
    modelType = "Standard";
    supportsPitch = true;
    const voiceLetter = parts[parts.length - 1];
    displayName = `Standard ${voiceLetter}`;
  } else if (v.name.toLowerCase().includes("neural2")) {
    modelType = "Neural2";
    supportsPitch = true;
    const voiceLetter = parts[parts.length - 1];
    displayName = `Neural2 ${voiceLetter}`;
  } else if (v.name.toLowerCase().includes("journey")) {
    modelType = "Journey";
    supportsPitch = false;
    const voiceLetter = parts[parts.length - 1];
    displayName = `Journey ${voiceLetter}`;
  } else {
    modelType = parts[2] || "Standard";
    displayName = parts.slice(3).join(" ") || v.name;
  }

  return {
    name: v.name,
    languageCodes: v.languageCodes,
    ssmlGender: v.ssmlGender,
    naturalSampleRateHertz: v.naturalSampleRateHertz,
    displayName,
    modelType,
    supportsPitch,
    language: languageName,
  };
}

export async function GET() {
  const now = Date.now();

  // Serve from in-memory cache if still fresh (24h)
  if (cachedVoices && now - cacheTimestamp < VOICES_CACHE_DURATION * 1000) {
    return NextResponse.json(cachedVoices, {
      headers: {
        "Cache-Control": `public, s-maxage=${VOICES_CACHE_DURATION}, stale-while-revalidate=3600`,
      },
    });
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TTS API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?key=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: VOICES_CACHE_DURATION } }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[voices] Google TTS error:", err);
      return NextResponse.json({ error: "Failed to fetch voices from Google TTS" }, { status: 502 });
    }

    const data = await res.json();
    const allVoices = (data.voices ?? []) as Array<{
      name: string;
      languageCodes: string[];
      ssmlGender: string;
      naturalSampleRateHertz: number;
    }>;

    // Filter: Urdu (ur-IN) + English (en-US, en-GB, en-AU) voices
    const filtered = allVoices.filter((v) =>
      v.languageCodes.some(
        (lc) =>
          lc.startsWith("ur-") ||
          lc === "en-US" ||
          lc === "en-GB" ||
          lc === "en-AU"
      )
    );

const URDU_PRESETS = [
  {
    name: "ur-IN-Wavenet-A-child",
    baseVoiceName: "ur-IN-Wavenet-A",
    languageCodes: ["ur-IN"],
    ssmlGender: "FEMALE",
    naturalSampleRateHertz: 24000,
    displayName: "Child (Preset)",
    modelType: "Preset",
    supportsPitch: true,
    language: "Urdu",
    presetPitch: 8,
    presetSpeed: 1.15,
    description: "Young child voice (WaveNet A · +8 pitch · 1.15× speed)",
  },
  {
    name: "ur-IN-Wavenet-B-oldman",
    baseVoiceName: "ur-IN-Wavenet-B",
    languageCodes: ["ur-IN"],
    ssmlGender: "MALE",
    naturalSampleRateHertz: 24000,
    displayName: "Old Man (Preset)",
    modelType: "Preset",
    supportsPitch: true,
    language: "Urdu",
    presetPitch: -8,
    presetSpeed: 0.85,
    description: "Elderly male voice (WaveNet B · -8 pitch · 0.85× speed)",
  },
];

// Group by language
    const urduParsed = filtered
      .filter((v) => v.languageCodes.some((lc) => lc.startsWith("ur-")))
      .map((v) => parseVoice(v, "Urdu"));

    const urdu = [...URDU_PRESETS, ...urduParsed];

    const english = filtered
      .filter((v) => v.languageCodes.some((lc) => lc.startsWith("en-")))
      .map((v) => parseVoice(v, "English"));

    const result = { urdu, english, fetchedAt: new Date().toISOString() };

    cachedVoices = result;
    cacheTimestamp = now;

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": `public, s-maxage=${VOICES_CACHE_DURATION}, stale-while-revalidate=3600`,
      },
    });
  } catch (err) {
    console.error("[voices] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
