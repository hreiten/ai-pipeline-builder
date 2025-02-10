
export const WhyChooseUs = () => {
  const advantages = [
    {
      title: "Extract value from your data",
      description: "Transform raw data into actionable insights with AI-powered analysis"
    },
    {
      title: "Focus on creating value",
      description: "Spend time on strategy and results, not writing code"
    },
    {
      title: "Reduce time-to-value",
      description: "Create and iterate with lightning speed using AI assistance"
    },
    {
      title: "Reduce costs and complexity",
      description: "Simplify development and maintenance with AI-generated solutions"
    }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Why Choose Us
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {advantages.map((advantage) => (
          <div key={advantage.title} className="p-6 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm text-card-foreground shadow-lg">
            <h3 className="font-semibold mb-2">{advantage.title}</h3>
            <p className="text-sm text-muted-foreground">{advantage.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
