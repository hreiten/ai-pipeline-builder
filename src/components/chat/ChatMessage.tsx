
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "p-4 rounded-lg",
        message.role === 'user' 
          ? "bg-primary text-primary-foreground ml-8" 
          : "bg-muted mr-8"
      )}
    >
      {message.role === 'assistant' ? (
        <ReactMarkdown
          className="prose prose-sm dark:prose-invert max-w-none"
          components={{
            h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
            ul: ({ children }) => <ul className="my-2 list-disc pl-4">{children}</ul>,
            li: ({ children }) => <li className="my-1">{children}</li>,
            p: ({ children }) => <p className="my-2">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 my-2 italic">{children}</blockquote>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      ) : (
        <p>{message.content}</p>
      )}
    </div>
  );
};
