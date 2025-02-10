import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY_V2") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Message {
  role: string;
  content: string;
}

interface OrchestratorResult {
  needsCode: boolean;
  userResponse: string;
  codeInstructions?: string;
}

const sanitizeMessages = (messages: Message[]) => {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content.replace(/\n/g, " ").trim(),
  }));
};

async function callOpenAI(
  endpoint: string,
  payload: any,
  retries = 2
): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `OpenAI API error (attempt ${attempt}/${retries}):`,
          errorText
        );
        if (attempt < retries)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

const getOrchestratorResponse = async (
  businessCase: string,
  messages: Message[],
  currentContent: string
): Promise<OrchestratorResult> => {
  console.log("Getting orchestrator response:", {
    businessCase,
    messagesCount: messages.length,
    hasCurrentContent: !!currentContent,
  });

  const data = await callOpenAI("chat/completions", {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant helping to develop Python code. You must ALWAYS respond with a JSON object in this exact format:

{
  "needsCode": boolean,
  "userResponse": string (your response to the user's request),
  "codeInstructions": string (only if needsCode is true)
}

DO NOT include any other text or markdown formatting. ONLY return the JSON object.

Guidelines for your responses in userResponse:
- Start with phrases like "I'll help you..." or "Let me explain..."
- For code changes: "I'll modify/update/change the code to..."
- For explanations: "The code works by..." or "This part of the code..."
- Keep it focused on what YOU will do or explain

Example responses:
{
  "needsCode": true,
  "userResponse": "I'll update the code to add error handling for the API calls",
  "codeInstructions": "Add try-except blocks around API calls"
}

{
  "needsCode": false,
  "userResponse": "Let me explain how the data processing works. The process_data function takes raw candlestick data and..."
}`,
      },
      {
        role: "user",
        content: `Business Case: ${businessCase}\nExisting Code:\n${currentContent}\nLatest Message: ${
          messages[messages.length - 1].content
        }`,
      },
    ],
  });

  const content = data.choices[0].message.content;
  console.log("Raw AI response:", content);

  const cleanJson = content.replace(/```json\n|\n```/g, "").trim();
  return JSON.parse(cleanJson);
};

const generateCode = async (
  instructions: string,
  currentContent: string
): Promise<string> => {
  console.log("Generating code:", {
    instructionsLength: instructions.length,
    hasCurrentContent: !!currentContent,
  });

  const data = await callOpenAI("chat/completions", {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert Python developer. Generate or modify the main.py file.

Current file content:
${currentContent || "No existing code"}

Your coding style is: 
- Following PEP 8 guidelines
- Writing clean, concise, efficient, and modular code and extract common functionality into functions
- Use common and understandable naming conventions
- Write modular code

Return ONLY the complete Python code, no explanations or markdown.`,
      },
      {
        role: "user",
        content: instructions,
      },
    ],
  });

  const code = data.choices[0].message.content.trim();
  console.log("Generated code length:", code.length);
  return code;
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: corsHeaders });

  try {
    console.log("Request received");
    if (!openAIApiKey) throw new Error("OpenAI API key not configured");

    const { businessCase, messages, projectId } = await req.json();
    console.log("Request payload:", {
      businessCaseLength: businessCase.length,
      messagesCount: messages.length,
      projectId,
    });

    // Get existing code if any
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { data: repoData } = await supabase
      .from("repositories")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle();

    console.log("Repository data:", repoData);

    let currentContent = "";
    if (repoData?.id) {
      const { data } = await supabase
        .from("project_code")
        .select("code_content")
        .eq("repository_id", repoData.id)
        .eq("file_path", "main.py")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data?.[0]) {
        currentContent = data[0].code_content;
        console.log("Found existing code, length:", currentContent.length);
      }
    }

    const orchestratorResult = await getOrchestratorResponse(
      businessCase,
      sanitizeMessages(messages),
      currentContent
    );

    let generatedCode = "";
    if (orchestratorResult.needsCode) {
      console.log("Code generation needed");
      generatedCode = await generateCode(
        orchestratorResult.codeInstructions!,
        currentContent
      );

      // Store the generated code
      const repositoryId =
        repoData?.id ||
        (
          await supabase
            .from("repositories")
            .insert({ project_id: projectId })
            .select("id")
            .single()
        ).data.id;

      console.log("Storing code in repository:", repositoryId);

      await supabase.from("project_code").insert({
        project_id: projectId,
        repository_id: repositoryId,
        file_path: "main.py",
        code_content: generatedCode,
        prompt: messages[messages.length - 1].content,
        orchestrator_response: orchestratorResult.userResponse,
      });
    }

    console.log("Request completed successfully");
    return new Response(
      JSON.stringify({
        message: orchestratorResult.userResponse,
        filesToModify: orchestratorResult.needsCode
          ? [{ path: "main.py" }]
          : [],
        code: orchestratorResult.needsCode
          ? [
              {
                path: "main.py",
                code: generatedCode,
              },
            ]
          : [],
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in orchestrate-response function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
