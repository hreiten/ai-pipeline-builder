import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { Star, ArrowRight } from "lucide-react";
import { Projects } from "@/components/home/Projects";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";

const Index = () => {
  const [businessCase, setBusinessCase] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const suggestions = [
    "A demand forecast model for a car dealership",
    "A bitcoin price prediction model",
    "A route optimizer for my vehicle fleet",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessCase.trim()) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue.",
      });
      navigate("/auth", { state: { businessCase } });
    } else {
      navigate("/model-details", { state: { businessCase } });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4 min-h-[calc(100vh-3.5rem)]">
      <div className="w-full max-w-2xl text-center space-y-8 mt-24">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Build AI with AI
          </h1>
          <p className="text-xl text-muted-foreground">
            Build end-to-end AI pipelines within seconds
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-16">
          <div className="relative max-w-xl mx-auto">
            <Input
              value={businessCase}
              onChange={(e) => setBusinessCase(e.target.value)}
              placeholder="What AI model do you want to build?"
              className="text-lg p-6 pr-12 bg-background/50 backdrop-blur-sm border-foreground/10 shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-accent rounded-full transition-colors"
              disabled={!businessCase.trim()}
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </form>

        <div className="space-y-4 mt-12">
          <p className="text-sm font-medium text-muted-foreground">Maybe:</p>
          <div className="flex flex-col gap-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setBusinessCase(suggestion)}
                className="flex items-center gap-3 p-4 rounded-lg border border-border/50 hover:bg-accent/50 backdrop-blur-sm transition-colors text-left group"
              >
                <Star className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {suggestion}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Projects />

        <div className="mt-16 pt-16 border-t border-border/50 space-y-16">
          <HowItWorks />
          <WhyChooseUs />
        </div>
      </div>
    </div>
  );
};

export default Index;
