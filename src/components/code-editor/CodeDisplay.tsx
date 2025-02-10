import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/themes/prism.css";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CodeDisplayProps {
  code: string;
  className?: string;
}

export function CodeDisplay({ code, className }: CodeDisplayProps) {
  const { toast } = useToast();
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        description: "Code copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy code",
        duration: 2000,
      });
    }
  };

  // Ensure we always have valid Python code with a main function
  const formattedCode =
    code.trim() ===
    "No code generated yet. Start a conversation to generate code."
      ? code
      : formatPythonCode(code);

  return (
    <div className="relative group h-full" key={code}>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background"
        onClick={copyToClipboard}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <pre
        className={cn(
          "relative bg-muted px-4 py-4 font-mono text-sm leading-6",
          "h-full overflow-auto rounded-b-xl",
          className
        )}
      >
        <code
          ref={codeRef}
          className="language-python whitespace-pre block min-w-full"
          key={`code-${code}`}
        >
          {formattedCode}
        </code>
      </pre>
    </div>
  );
}

function formatPythonCode(code: string): string {
  // Extract code from markdown code blocks if present
  if (code.includes("```python")) {
    const match = code.match(/```python\n([\s\S]*?)```/);
    if (match) {
      code = match[1].trim();
    }
  } else if (code.includes("```")) {
    const match = code.match(/```\n([\s\S]*?)```/);
    if (match) {
      code = match[1].trim();
    }
  }

  // Split the code into lines while preserving original indentation
  const lines = code.split("\n");

  // Remove shebang if present
  if (lines[0]?.startsWith("#!/usr/bin/env python3")) {
    lines.shift();
    if (lines[0]?.trim() === "") lines.shift(); // Remove empty line after shebang
  }

  // Filter empty lines at the start and end, but preserve empty lines in between
  while (lines[0]?.trim() === "") lines.shift();
  while (lines[lines.length - 1]?.trim() === "") lines.pop();

  // Add two newlines at the end for better readability
  return lines.join("\n") + "\n\n";
}
