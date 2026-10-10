import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_CHARS_PER_REQUEST = 5000;

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────
  const supabase = createSupabaseServerClient();
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const {
    data: { user },
  } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ───────────────────────────────────────────────
  let body: {
    scriptText: string;
    language: string;
    voiceName: string;
    speed: number;
    pitch: number;
    projectTitle?: string;
    projectId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    scriptText,
    language,
    voiceName,
    speed,
    pitch,
    projectTitle = "Untitled Project",
    projectId,
  } = body;

  if (!scriptText?.trim()) {
    return NextResponse.json({ error: "scriptText is required" }, { status: 400 });
  }

  if (scriptText.length > MAX_CHARS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Script exceeds ${MAX_CHARS_PER_REQUEST.toLocaleString()} characters per request` },
      { status: 400 }
    );
  }

  // ── Quota check ───────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("chars_used, chars_limit, plan")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const charCount = scriptText.length;

  if (profile.chars_used + charCount > profile.chars_limit) {
    return NextResponse.json(
      {
        error: "quota_exceeded",
        detail: `You have ${profile.chars_limit - profile.chars_used} characters remaining (${profile.chars_limit.toLocaleString()} limit on ${profile.plan} plan).`,
      },
      { status: 402 }
    );
  }

  // ── Call Google TTS ───────────────────────────────────────────
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TTS service not configured" }, { status: 500 });
  }

  // Voice presets mapping
  const VOICE_PRESETS: Record<string, { targetVoice: string; defaultPitch: number; defaultSpeed: number }> = {
    "ur-IN-Wavenet-A-child": { targetVoice: "ur-IN-Wavenet-A", defaultPitch: 8, defaultSpeed: 1.15 },
    "preset-child": { targetVoice: "ur-IN-Wavenet-A", defaultPitch: 8, defaultSpeed: 1.15 },
    "Child (Preset)": { targetVoice: "ur-IN-Wavenet-A", defaultPitch: 8, defaultSpeed: 1.15 },
    "ur-IN-Wavenet-B-oldman": { targetVoice: "ur-IN-Wavenet-B", defaultPitch: -8, defaultSpeed: 0.85 },
    "preset-old-man": { targetVoice: "ur-IN-Wavenet-B", defaultPitch: -8, defaultSpeed: 0.85 },
    "Old Man (Preset)": { targetVoice: "ur-IN-Wavenet-B", defaultPitch: -8, defaultSpeed: 0.85 },
  };

  const preset = VOICE_PRESETS[voiceName];
  const targetVoice = preset ? preset.targetVoice : voiceName;
  const effectiveSpeed = typeof speed === "number" && !isNaN(speed) ? speed : (preset ? preset.defaultSpeed : 1.0);
  const effectivePitch = typeof pitch === "number" && !isNaN(pitch) ? pitch : (preset ? preset.defaultPitch : 0);

  // Chirp voices (e.g. ur-IN-Chirp3-HD-*) do not support the pitch parameter in Google Cloud TTS
  const supportsPitch = !targetVoice.toLowerCase().includes("chirp");

  const audioConfig: {
    audioEncoding: string;
    speakingRate: number;
    pitch?: number;
  } = {
    audioEncoding: "MP3",
    speakingRate: Math.min(Math.max(effectiveSpeed, 0.25), 4.0),
  };

  if (supportsPitch && typeof effectivePitch === "number" && !isNaN(effectivePitch)) {
    audioConfig.pitch = Math.min(Math.max(effectivePitch, -20), 20);
  }

  // Always use the selected voice's own language code parsed from the voice name
  const voiceLangParts = targetVoice.split("-");
  const parsedLanguageCode =
    voiceLangParts.length >= 2 && voiceLangParts[0].length >= 2 && voiceLangParts[1].length >= 2
      ? `${voiceLangParts[0].toLowerCase()}-${voiceLangParts[1].toUpperCase()}`
      : language || "ur-IN";

  const ttsPayload = {
    input: { text: scriptText },
    voice: {
      languageCode: parsedLanguageCode,
      name: targetVoice,
    },
    audioConfig,
  };

  let audioBase64: string;
  try {
    const ttsRes = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ttsPayload),
      }
    );

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error("[tts/generate] Google TTS error:", errText);
      return NextResponse.json(
        { error: "Text-to-speech synthesis failed", detail: errText },
        { status: 502 }
      );
    }

    const ttsData = await ttsRes.json();
    audioBase64 = ttsData.audioContent;
  } catch (err) {
    console.error("[tts/generate] TTS request failed:", err);
    return NextResponse.json({ error: "TTS request failed" }, { status: 500 });
  }

  // ── Upload to Supabase Storage ────────────────────────────────
  const audioBuffer = Buffer.from(audioBase64, "base64");
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("voiceovers")
    .upload(fileName, audioBuffer, {
      contentType: "audio/mpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("[tts/generate] Storage upload error:", uploadError);
    const detailMsg =
      uploadError.message ||
      (typeof uploadError === "object" ? JSON.stringify(uploadError) : String(uploadError));
    return NextResponse.json(
      { error: "Audio upload failed", detail: detailMsg },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("voiceovers")
    .getPublicUrl(fileName);

  const audioUrl = publicUrlData.publicUrl;

  // ── Increment chars_used ──────────────────────────────────────
  await supabaseAdmin
    .from("profiles")
    .update({ chars_used: profile.chars_used + charCount })
    .eq("id", user.id);

  // ── Save / update project ────────────────────────────────────
  let savedProjectId = projectId;
  const savedPitch = supportsPitch && typeof effectivePitch === "number" ? effectivePitch : 0;

  if (projectId) {
    // Update existing project
    await supabaseAdmin
      .from("projects")
      .update({
        script_text: scriptText,
        language: parsedLanguageCode,
        voice_name: voiceName,
        speed: effectiveSpeed,
        pitch: savedPitch,
        audio_url: audioUrl,
        file_size: audioBuffer.byteLength,
        char_count: charCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", user.id);
  } else {
    // Create new project
    const { data: newProject } = await supabaseAdmin
      .from("projects")
      .insert({
        user_id: user.id,
        title: projectTitle,
        script_text: scriptText,
        language: parsedLanguageCode,
        voice_name: voiceName,
        speed: effectiveSpeed,
        pitch: savedPitch,
        audio_url: audioUrl,
        file_size: audioBuffer.byteLength,
        char_count: charCount,
      })
      .select("id")
      .single();

    savedProjectId = newProject?.id;
  }

  return NextResponse.json({
    audioUrl,
    projectId: savedProjectId,
    charCount,
  });
}
