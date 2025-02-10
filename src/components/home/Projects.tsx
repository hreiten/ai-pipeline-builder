
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  data_description?: string;
}

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user, toast]);

  const handleProjectClick = (project: Project) => {
    navigate("/build-model", {
      state: {
        modelName: project.name,
        description: project.description,
        data: project.data_description || "",
        projectId: project.id
      }
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-4 text-left pt-8 border-t border-border/50">
      <h2 className="text-2xl font-semibold">Your Projects</h2>
      {isLoading ? (
        <p className="text-muted-foreground">Loading projects...</p>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((project) => (
            <Card 
              key={project.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors backdrop-blur-sm border-border/50"
              onClick={() => handleProjectClick(project)}
            >
              <CardHeader className="space-y-1 p-4">
                <CardTitle className="text-base">{project.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-1">
                  {project.description}
                </CardDescription>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(project.created_at), 'MMM d, yyyy')}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No projects yet. Start by creating one!</p>
      )}
    </div>
  );
};
