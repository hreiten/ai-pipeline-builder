import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useChatHistory } from "@/hooks/useChatHistory";
import { LocationState } from "@/types/chat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { CodePanel } from "@/components/code-editor/CodePanel";
import { useModelApi } from "@/hooks/useModelApi";
import { useFileManager } from "@/hooks/useFileManager";
import { useToast } from "@/components/ui/use-toast";

const INITIAL_PROMPT = `Implement a first working version of the code.`;

const BuildModel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const { user } = useAuth();
  const { toast } = useToast();

  // Redirect if missing required state
  useEffect(() => {
    if (
      !state?.modelName ||
      !state?.description ||
      !state?.data ||
      !state?.projectId
    ) {
      navigate("/model-details");
    }
  }, [state, navigate]);

  if (!state?.modelName) return null;

  const modelContext = `Model Name: ${state.modelName}\nDescription: ${state.description}\nData: ${state.data}`;

  const { files, currentFile, setCurrentFile, updateFiles } = useFileManager({
    projectId: state.projectId,
  }) as {
    files: { path: string; code: string }[];
    currentFile: string;
    setCurrentFile: (path: string) => void;
    updateFiles: (filesToModify: any[], code: any[]) => Promise<void>;
  };

  const { sendMessageToApi, isLoading } = useModelApi({
    modelContext,
    projectId: state.projectId,
    currentFile,
  });

  const { messages, setMessages, saveChatHistory } = useChatHistory({
    userId: user?.id,
    projectId: state.projectId,
    description: state.description,
  });

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !user?.id) return;

    const userMessage = {
      role: "user" as const,
      content: messageContent.trim(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const response = await sendMessageToApi(updatedMessages);
      if (!response) {
        toast({
          title: "Error",
          description: "Failed to get AI response. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const finalMessages = [...updatedMessages, response.message];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);
      await updateFiles(response.filesToModify, response.code);
    } catch (error) {
      console.error("Error in sendMessage:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Send initial message if chat is empty
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage(INITIAL_PROMPT);
    }
  }, [messages]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={33}>
          <div className="p-6 flex flex-col h-[calc(100vh-3.5rem)]">
            <h2 className="text-2xl font-bold mb-6">{state.modelName}</h2>
            <ChatWindow messages={messages} isLoading={isLoading} />
            <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={67}>
          <CodePanel
            files={files}
            currentFile={currentFile}
            onFileChange={setCurrentFile}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default BuildModel;
