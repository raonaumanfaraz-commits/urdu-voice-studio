export type Plan = "free" | "starter" | "pro";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  chars_used: number;
  chars_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  script_text: string;
  language: string;
  voice_name: string;
  speed: number;
  pitch: number;
  audio_url: string | null;
  file_size: number | null;
  char_count: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceInfo {
  name: string;                // e.g. "ur-IN-Chirp3-HD-Achernar"
  languageCodes: string[];     // e.g. ["ur-IN"]
  ssmlGender: "MALE" | "FEMALE" | "NEUTRAL" | "SSML_VOICE_GENDER_UNSPECIFIED";
  naturalSampleRateHertz: number;
  displayName?: string;
  modelType?: string;
  supportsPitch?: boolean;
  baseVoiceName?: string;
  presetPitch?: number;
  presetSpeed?: number;
  description?: string;
}

export interface TTSGenerateRequest {
  scriptText: string;
  language: string;
  voiceName: string;
  speed: number;
  pitch: number;
  projectTitle?: string;
  projectId?: string;         // pass when re-generating an existing project
}

export interface TTSGenerateResponse {
  audioUrl: string;
  projectId: string;
  charCount: number;
}

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 5_000,
  starter: 100_000,
  pro: 500_000,
};

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};
