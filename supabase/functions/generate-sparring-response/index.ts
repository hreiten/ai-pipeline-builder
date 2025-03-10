import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY_V2");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessCase, messages } = await req.json();

    const systemPrompt = `You are a business coach helping brainstorm and refine ideas. 
    
The business case is: ${businessCase}

Format your responses as follows:
- Use bullet points for lists
- Use '**bold**' markdown for important concepts
- Break paragraphs into easily readable chunks
- Use clear headings with '###' when organizing different topics
- Keep responses concise and focused
- Use '>' for quotes or highlighting key insights

Provide constructive feedback, ask thought-provoking questions, and help develop the idea further.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    const data = await response.json();
    console.log("OpenAI response:", data);

    if (!data.choices?.[0]?.message) {
      throw new Error("Invalid response from OpenAI");
    }

    return new Response(
      JSON.stringify({ message: data.choices[0].message.content }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-sparring-response:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
