import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Voice mapping for natural native-sounding voices
const VOICE_MAP: Record<string, string> = {
  en: "CwhRBWXzGAHq8TQ4Fs17", // Roger — clear, warm male English
  hi: "EXAVITQu4vr4xnSDxMaL", // Sarah — excellent Hindi via multilingual v2
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, voiceId, language } = await req.json();
    if (!text) throw new Error("Text is required");

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is not configured");

    // Pick voice based on language, allow override
    const lang = typeof language === "string" ? language : "en";
    const selectedVoice = voiceId || VOICE_MAP[lang] || VOICE_MAP["en"];

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.85,
            style: 0.4,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs error:", response.status, errText);
      // Return 503 for auth/rate issues so client falls back to browser TTS silently
      const clientStatus = response.status === 401 || response.status === 403 ? 503 : response.status === 429 ? 429 : 502;
      return new Response(JSON.stringify({ error: "Voice temporarily unavailable", fallback: true }), {
        status: clientStatus, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    console.error("elevenlabs-tts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
