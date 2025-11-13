import type { LucideIcon } from "lucide-react";

interface ToolPageWrapperProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function ToolPageWrapper({ title, description, icon: Icon, children }: ToolPageWrapperProps) {
  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <header className="mb-8 flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 flex-shrink-0">
          <Icon className="size-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">{title}</h1>
          <p className="mt-1.5 text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="max-w-4xl mx-auto">{children}</div>
    </main>
  );
}
