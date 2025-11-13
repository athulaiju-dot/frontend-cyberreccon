import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  href: string;
  icon: LucideIcon;
  name: string;
  description: string;
}

export function ToolCard({ href, icon: Icon, name, description }: ToolCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-accent/80 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
        <CardHeader className="flex flex-col items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
            <Icon className="size-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-headline text-lg text-foreground group-hover:text-primary transition-colors">
              {name}
            </CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
