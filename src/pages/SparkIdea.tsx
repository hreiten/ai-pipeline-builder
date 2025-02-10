
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Json } from "@/integrations/supabase/types";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SparkIdea = () => {
  const location = useLocation();
  const businessCase = location.state?.businessCase || "No business case provided";
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Only load chat history if user is authenticated
    if (user) {
      loadChatHistory();
    }
  }, [user]); // Add user as a dependency to reload when user changes

  const loadChatHistory = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('chat_history')
        .select('messages')
        .eq('business_case', businessCase)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.messages) {
        setMessages(data.messages as unknown as Message[]);
      }
      // If no data, messages will remain an empty array
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Don't show error toast as this is expected for new conversations
    }
  };

  const saveChatHistory = async (newMessages: Message[]) => {
    try {
      if (!user?.id) return;

      const { error } = await supabase
        .from('chat_history')
        .upsert({
          user_id: user.id,
          business_case: businessCase,
          messages: newMessages as unknown as Json[],
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving chat history:', error);
      toast({
        title: "Error",
        description: "Failed to save chat history",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id) return;

    const userMessage: Message = { role: 'user', content: newMessage.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setNewMessage("");
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('generate-sparring-response', {
        body: {
          businessCase,
          messages: updatedMessages,
        },
      });

      if (response.error) throw new Error(response.error.message);
      const aiMessage: Message = { 
        role: 'assistant', 
        content: response.data.message 
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Idea Sparring</h1>
        <div className="bg-card rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Business Case:</h2>
          <p className="text-muted-foreground">{businessCase}</p>
        </div>

        <div className="space-y-4 mb-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "p-4 rounded-lg",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground ml-12" 
                  : "bg-muted mr-12"
              )}
            >
              <p>{message.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="bg-muted mr-12 p-4 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="min-h-[100px]"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !newMessage.trim()}
            className="w-full"
          >
            {isLoading ? "Thinking..." : "Send Message"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SparkIdea;
