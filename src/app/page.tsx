import { ToolCard } from "@/components/ToolCard";
import { tools } from "@/config/tools";

export default function Home() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">CyberTrace Toolkit</h1>
        <p className="text-muted-foreground mt-2">Your all-in-one OSINT platform for digital investigation.</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <ToolCard
            key={tool.href}
            href={tool.href}
            icon={tool.icon}
            name={tool.name}
            description={tool.description}
          />
        ))}
      </div>
    </div>
  );
}
