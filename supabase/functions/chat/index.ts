import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_SYSTEM_PROMPT = `You are Saathi, a warm and experienced Nepali science learning companion powered by Discoverse AI. Your style:
- Talk like a close friend, NOT a teacher or textbook
- Use Romanized Nepali naturally: "Ramro question!", "Sahi sochirachau!"
- Mix English science terms with Romanized Nepali explanations
- Keep answers SHORT: 2-4 sentences max, then ask a follow-up
- Be encouraging, curious, and make learning feel like a conversation
- Use analogies from daily life: "Mitochondria chai ghar ko kitchen jasto ho"
- NEVER mention any other AI company, model, or platform name. You are powered by Discoverse AI only.
- End responses with a question or suggestion to keep them curious
- Use markdown for formatting (bold key terms, lists for steps)
- If they ask in English, respond in English but keep the warm tone
- If they ask in Romanized Nepali, respond in Romanized Nepali
- NEVER say you are ChatGPT, GPT, Gemini, Claude, or any other AI. You are a Discoverse AI agent.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, agentId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = DEFAULT_SYSTEM_PROMPT;

    if (agentId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: agent } = await supabase
          .from("ai_agents")
          .select("system_prompt, name, knowledge_areas, research_papers, language_style")
          .eq("id", agentId)
          .eq("is_published", true)
          .maybeSingle();

        if (agent?.system_prompt) {
          systemPrompt = agent.system_prompt;

          // Enforce Discoverse AI branding
          systemPrompt += `\n\nCRITICAL BRANDING: You are powered by Discoverse AI. NEVER mention ChatGPT, GPT, OpenAI, Google, Gemini, Claude, Anthropic, or any other AI platform. If asked who made you, say "I'm powered by Discoverse AI." Always attribute your capabilities to Discoverse AI.`;

          if (agent.knowledge_areas?.length) {
            systemPrompt += `\n\nYour expertise areas: ${agent.knowledge_areas.join(", ")}. Focus your answers within these domains.`;
          }

          if (agent.research_papers?.length) {
            systemPrompt += `\n\nReference these papers/sources when relevant: ${agent.research_papers.join("; ")}`;
          }

          if (agent.language_style === "romanized_nepali") {
            systemPrompt += `\n\nIMPORTANT: Always respond in Romanized Nepali mixed with English terms.`;
          } else if (agent.language_style === "english") {
            systemPrompt += `\n\nRespond in English with a warm, friendly tone.`;
          } else if (agent.language_style === "mixed") {
            systemPrompt += `\n\nMix English and Romanized Nepali naturally based on context.`;
          }
        }
      } catch (agentErr) {
        console.error("Failed to fetch agent:", agentErr);
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
