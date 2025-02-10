
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/chat";
import { useToast } from "@/components/ui/use-toast";

interface UseChatHistoryProps {
  userId: string | undefined;
  projectId: string;
  description: string;
}

export const useChatHistory = ({ userId, projectId, description }: UseChatHistoryProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const loadChatHistory = async () => {
    try {
      if (!userId || !projectId) {
        console.log('Missing userId or projectId, skipping chat history load');
        return;
      }

      console.log('Loading chat history for project:', projectId);

      const { data, error } = await supabase
        .from('chat_history')
        .select('messages')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) {
        console.error('Error loading chat history:', error);
        throw error;
      }
      
      console.log('Loaded chat history:', data);
      
      if (data?.messages) {
        const parsedMessages = data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })) as Message[];
        
        console.log('Parsed messages:', parsedMessages);
        setMessages(parsedMessages);
      } else {
        console.log('No messages found in chat history');
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const saveChatHistory = async (newMessages: Message[]) => {
    try {
      if (!userId || !projectId) {
        console.log('Missing userId or projectId, skipping chat history save');
        return;
      }

      console.log('Saving chat history for project:', projectId);
      console.log('Messages to save:', newMessages);

      const jsonMessages = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { error } = await supabase
        .from('chat_history')
        .upsert({
          user_id: userId,
          project_id: projectId,
          business_case: description,
          messages: jsonMessages,
        }, {
          onConflict: 'project_id,user_id'
        });

      if (error) {
        console.error('Error saving chat history:', error);
        throw error;
      }
      
      console.log('Chat history saved successfully');
    } catch (error) {
      console.error('Error saving chat history:', error);
      toast({
        title: "Error",
        description: "Failed to save chat history",
        variant: "destructive",
      });
    }
  };

  // Load chat history when component mounts
  useEffect(() => {
    loadChatHistory();
  }, [userId, projectId]);

  return {
    messages,
    setMessages,
    loadChatHistory,
    saveChatHistory,
  };
};
