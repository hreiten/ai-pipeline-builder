import { CodeDisplay } from "@/components/code-editor/CodeDisplay";

interface CodeFile {
  path: string;
  code: string;
}

interface CodePanelProps {
  files: CodeFile[];
  currentFile: string;
  onFileChange: (path: string) => void;
}

export const CodePanel = ({
  files,
  currentFile,
  onFileChange,
}: CodePanelProps) => {
  const currentFileContent =
    files.find((f) => f.path === currentFile)?.code || "";

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4">
      {files.length > 0 ? (
        <>
          <div className="flex gap-2 p-2 border-b overflow-x-auto rounded-t-xl bg-muted">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => onFileChange(file.path)}
                className={`px-3 py-1 rounded whitespace-nowrap ${
                  currentFile === file.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted-foreground/10"
                }`}
              >
                {file.path}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden rounded-b-xl">
            <CodeDisplay
              key={`${currentFile}-${currentFileContent}`}
              code={currentFileContent}
              className="h-[calc(100vh-8rem)] rounded-b-xl"
            />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No files available
        </div>
      )}
    </div>
  );
};
