"use client";

import { useState } from "react";
import { Layers, LoaderCircle, Search, ExternalLink } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { enumerateSubdomains, type SubdomainResult } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SubdomainEnumPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SubdomainResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setResults(null);
    
    try {
      const data = await enumerateSubdomains(domain);
      setResults(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Enumeration Error",
        description: error.message || "Failed to scan CT logs.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Subdomain Enumeration"
        description="Search Certificate Transparency logs to discover subdomains for a target domain."
        icon={Layers}
      >
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <Input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., tesla.com"
                  className="flex-grow"
                />
                <Button type="submit" disabled={loading || !domain} className="w-full sm:w-auto">
                  {loading ? <LoaderCircle className="animate-spin" /> : <Search className="mr-2" />}
                  Discover
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex justify-center items-center gap-2 text-muted-foreground">
              <LoaderCircle className="animate-spin text-primary" />
              <span>Querying global certificate transparency logs...</span>
            </div>
          )}

          {results && (
            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-headline text-primary">Discovered Assets</CardTitle>
                  <Badge variant="outline" className="text-primary">{results.found} Found</Badge>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-background/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {results.subdomains.map((sub) => (
                      <div key={sub} className="flex items-center justify-between p-2 rounded hover:bg-primary/10 group transition-colors">
                        <span className="font-mono text-sm truncate">{sub}</span>
                        <a 
                          href={`https://${sub}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="size-4 text-accent" />
                        </a>
                      </div>
                    ))}
                    {results.subdomains.length === 0 && (
                      <p className="text-muted-foreground col-span-2 text-center py-10">No subdomains found in logs.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
