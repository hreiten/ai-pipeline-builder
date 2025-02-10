
export const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "Describe what you want to build",
      description: "Share your vision in plain English"
    },
    {
      number: "2",
      title: "Get a first version in seconds",
      description: "AI generates complete, working code"
    },
    {
      number: "3",
      title: "Iterate & improve with chat",
      description: "Refine through natural conversation"
    },
    {
      number: "4",
      title: "One-click to deploy and share",
      description: "Share your solution instantly"
    }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        How It Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step) => (
          <div key={step.number} className="relative p-6 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm text-card-foreground shadow-lg">
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-lg">
              {step.number}
            </div>
            <h3 className="font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
