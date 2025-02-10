import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";

const ModelDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialCase = location.state?.businessCase || "";
  const { user } = useAuth();
  const { toast } = useToast();

  const [modelName, setModelName] = useState(initialCase);
  const [description, setDescription] = useState(initialCase);
  const [data, setData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // First create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: modelName,
          description,
          data_description: data,
          user_id: user.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Then create initial chat history with project_id
      const { error: chatError } = await supabase.from("chat_history").insert({
        business_case: description,
        user_id: user.id,
        project_id: project.id,
      });

      if (chatError) throw chatError;

      navigate("/build-model", {
        state: {
          modelName,
          description,
          data,
          projectId: project.id,
        },
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Describe your model</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="modelName">Model name</Label>
            <Input
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Give your model a name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Model description and business case
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your model will do and the business problem it solves"
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data description / Inputs</Label>
            <Textarea
              id="data"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="Describe the data that will be used to train and run the model"
              className="min-h-[100px]"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating Project..." : "Build Model"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ModelDetails;
