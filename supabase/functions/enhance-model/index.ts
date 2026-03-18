import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { modelName, subject, namedParts, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lang = language || "en";
    const partsInfo = namedParts?.length
      ? `The 3D model has these named mesh parts: ${namedParts.join(", ")}.`
      : "The model may not have named parts. Generate reasonable part names that could exist in such a 3D model.";

    const systemPrompt = `You are an expert science educator creating interactive 3D learning experiences for students. You must return ONLY valid JSON with no markdown formatting, no code blocks, no extra text.`;

    const userPrompt = `Create an educational simulation for a 3D model of "${modelName}" (subject: ${subject}).
${partsInfo}

Return a JSON object with this exact structure:
{
  "title": "Title of the simulation",
  "steps": [
    {
      "title": "Step title",
      "part": "mesh_part_name_to_highlight or empty string for overview",
      "color": "#hex color for the highlighted part",
      "narration_en": "English narration text (2-3 sentences, educational)",
      "narration_hi": "Hindi narration text (2-3 sentences, educational)",
      "label_en": "Short English label for the part",
      "label_hi": "Short Hindi label for the part",
      "camera": { "x": 0, "y": 0, "z": 4 }
    }
  ]
}

Rules:
- Generate exactly 5-6 steps
- First step should be an overview (part = "")
- Last step should be a summary/conclusion (part = "")
- Middle steps should highlight specific parts
- Colors should be scientifically meaningful (red for arteries, blue for veins, etc.)
- Camera positions should vary to show different angles
- Narrations should be factual, engaging, and grade 6-10 level
- Hindi narrations should be natural Hindi, not transliteration
- If parts list is empty, use descriptive part names like "main_body", "top_section" etc.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    const simulation = JSON.parse(content);

    return new Response(JSON.stringify(simulation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enhance-model error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
