import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, language } = await req.json();
    if (!text) throw new Error("Text is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use Lovable AI with a TTS-optimized approach: generate SSML-clean text
    // For actual TTS, we'll use the Web Speech API on client side as fallback
    // and provide the cleaned text back
    
    // For now, return the text cleaned for speech synthesis
    // The client will use the browser's built-in SpeechSynthesis API
    // This is free and supports both English and Hindi
    
    const cleanedText = text
      .replace(/[#*_~`]/g, "") // Remove markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links to text
      .replace(/\n+/g, ". ") // Newlines to pauses
      .trim();

    return new Response(JSON.stringify({ 
      text: cleanedText, 
      language: language || "en",
      engine: "browser" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
