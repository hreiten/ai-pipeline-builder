
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/chat";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface UseModelApiProps {
  modelContext: string;
  projectId: string;
  currentFile: string;
}

export function useModelApi({
  modelContext,
  projectId,
  currentFile,
}: UseModelApiProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessageToApi = async (messages: Message[]) => {
    setIsLoading(true);
    try {
      console.log("Sending message to API with context:", {
        modelContext,
        currentFile,
        messages,
      });

      const response = await supabase.functions.invoke("orchestrate-response", {
        body: {
          businessCase: modelContext,
          messages,
          projectId,
          currentFilePath: currentFile,
        },
      });

      if (response.error) {
        console.error("API response error:", response.error);
        throw new Error(response.error.message);
      }

      console.log("API response:", response.data);

      return {
        message: { role: "assistant" as const, content: response.data.message },
        filesToModify: response.data.filesToModify,
        code: response.data.code,
      };
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessageToApi,
    isLoading,
  };
}
