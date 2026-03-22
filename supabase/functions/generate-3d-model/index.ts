import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const cleanTopic = typeof topic === "string" && topic.trim() ? topic.trim() : "3D Object";

    const systemPrompt = `You are a 3D model generator. Given a topic, you generate a JSON description of primitive 3D shapes that approximate the object.
Use ONLY these primitive types: sphere, box, cylinder, cone, torus.
Each primitive has: name (unique mesh name), type, position [x,y,z], scale [x,y,z], rotation [x,y,z] (radians, optional), color (#RRGGBB), label (human readable).
Make the model recognizable and detailed using 8-15 primitives. Center it around origin. Keep scale within -2 to 2 range.
Return ONLY valid JSON array, no markdown, no explanation.`;

    const userPrompt = `Generate a 3D primitive model for: "${cleanTopic}"

Return a JSON array of primitives. Example format:
[
  {"name":"body","type":"box","position":[0,0,0],"scale":[1,0.5,2],"color":"#4488CC","label":"Main Body"},
  {"name":"wheel_fl","type":"cylinder","position":[-0.5,-0.3,0.7],"scale":[0.3,0.1,0.3],"rotation":[0,0,1.57],"color":"#333333","label":"Front Left Wheel"}
]

Make it anatomically/structurally accurate. Use distinct colors for different parts. Include 8-15 parts.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const firstBracket = content.indexOf("[");
    const lastBracket = content.lastIndexOf("]");
    if (firstBracket >= 0 && lastBracket > firstBracket) content = content.slice(firstBracket, lastBracket + 1);

    const primitives = JSON.parse(content);

    // Validate primitives
    const validTypes = ["sphere", "box", "cylinder", "cone", "torus"];
    const validated = Array.isArray(primitives) ? primitives.filter((p: any) =>
      typeof p.name === "string" && validTypes.includes(p.type) &&
      Array.isArray(p.position) && p.position.length === 3 &&
      Array.isArray(p.scale) && p.scale.length === 3
    ).map((p: any) => ({
      name: p.name,
      type: p.type,
      position: p.position.map(Number),
      scale: p.scale.map(Number),
      rotation: Array.isArray(p.rotation) && p.rotation.length === 3 ? p.rotation.map(Number) : [0, 0, 0],
      color: typeof p.color === "string" && /^#[0-9a-fA-F]{6}$/.test(p.color) ? p.color : "#888888",
      label: typeof p.label === "string" ? p.label : p.name,
    })) : [];

    return new Response(JSON.stringify(validated), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-3d-model error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
