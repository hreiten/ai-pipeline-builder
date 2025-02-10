import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UseFileManagerProps {
  projectId: string;
}

export function useFileManager({ projectId }: UseFileManagerProps) {
  const [currentFile, setCurrentFile] = useState("main.py");
  const [files, setFiles] = useState<{ path: string; code: string }[]>([]);
  const { toast } = useToast();

  const loadLatestCode = async () => {
    if (!projectId) return;

    const { data: repoData, error: repoError } = await supabase
      .from("repositories")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle();

    if (repoError) {
      console.error("Error loading repository:", repoError);
      return;
    }

    if (repoData) {
      const { data, error } = await supabase
        .from("project_code")
        .select("code_content, file_path")
        .eq("repository_id", repoData.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading code:", error);
        toast({
          title: "Error loading code",
          description: "There was a problem loading the latest code.",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        console.log("Raw data from database:", data);

        // Create a map to store the latest version of each file
        const latestFiles = new Map<string, string>();

        // Group by file path and take the most recent version
        data.forEach((item) => {
          if (!latestFiles.has(item.file_path)) {
            console.log(
              `Setting content for ${item.file_path}:`,
              item.code_content
            );
            latestFiles.set(item.file_path, item.code_content);
          }
        });

        const filesList = Array.from(latestFiles.entries()).map(
          ([path, code]) => ({
            path,
            code,
          })
        );

        console.log("Processed files list:", filesList);
        setFiles(filesList);

        if (
          filesList.length > 0 &&
          !filesList.some((f) => f.path === currentFile)
        ) {
          setCurrentFile(filesList[0].path);
        }
      } else {
        setFiles([
          {
            path: "main.py",
            code: "No code generated yet. Start a conversation to generate code.",
          },
        ]);
      }
    }
  };

  const updateFiles = async (filesToModify: any[], code: any[]) => {
    console.log("Updating files with:", { filesToModify, code });

    if (Array.isArray(code)) {
      // First update local state immediately
      const existingFilesMap = new Map(files.map((f) => [f.path, f]));

      code.forEach((file: { path: string; code: string }) => {
        console.log(`Updating file ${file.path} with new content:`, file.code);
        existingFilesMap.set(file.path, {
          path: file.path,
          code: file.code || "// New file created, waiting for content...",
        });
      });

      const updatedFiles = Array.from(existingFilesMap.values());
      console.log("Final updated files:", updatedFiles);

      // Update state immediately with new content
      setFiles(updatedFiles);

      // Update current file if needed
      if (!currentFile || code.length === 1) {
        setCurrentFile(code[0].path);
      }

      // Then fetch latest from database to ensure consistency
      try {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay to ensure DB write is complete
        await loadLatestCode();
      } catch (error) {
        console.error("Error reloading latest code:", error);
      }
    }
  };

  const switchFile = (filePath: string) => {
    console.log("Switching to file:", filePath);
    const fileExists = files.some((f) => f.path === filePath);
    if (fileExists) {
      setCurrentFile(filePath);
    } else {
      console.warn(`Attempted to switch to non-existent file: ${filePath}`);
    }
  };

  useEffect(() => {
    loadLatestCode();
  }, [projectId]);

  return {
    files,
    currentFile,
    setCurrentFile: switchFile,
    updateFiles,
  };
}
