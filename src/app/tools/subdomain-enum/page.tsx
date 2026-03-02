"use client";

import { useState } from "react";
import { Layers, LoaderCircle, Search, ExternalLink, Globe, ShieldCheck } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { enumerateSubdomains, type SubdomainResult } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
      const data = await enumerateSubdomains(domain.trim().toLowerCase());
      setResults(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Enumeration Error",
        description: error.message || "Failed to scan infrastructure.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Subdomain Discovery"
        description="Hybrid reconnaissance combining wordlist bruteforcing with certificate log analysis."
        icon={Layers}
      >
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Infrastructure Mapping</CardTitle>
              <CardDescription>Enter a domain to begin active and passive asset discovery.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary" />
                  <Input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g., tesla.com"
                    className="pl-10 h-12 bg-background/50 border-primary/30 focus:border-primary text-lg"
                  />
                </div>
                <Button type="submit" disabled={loading || !domain} className="h-12 w-full sm:w-auto px-8 shadow-lg shadow-primary/20">
                  {loading ? (
                    <LoaderCircle className="animate-spin size-5" />
                  ) : (
                    <><Search className="mr-2 size-5" /> Discover Assets</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderCircle className="animate-spin size-12 text-primary" />
              <div className="text-center">
                <p className="font-headline font-bold text-lg text-primary uppercase tracking-widest">Scanning Logs & Wordlist</p>
                <p className="text-xs text-muted-foreground uppercase">Querying crt.sh and executing active probes...</p>
              </div>
            </div>
          )}

          {results && (
            <Card className="border-primary/50 shadow-2xl overflow-hidden">
               <CardHeader className="bg-primary/5 border-b border-primary/20 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline text-primary">Discovered Assets</CardTitle>
                    <CardDescription>Target: {results.domain}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary font-mono text-sm">
                    {results.found} Found
                  </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] w-full">
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {results.subdomains.map((sub) => (
                      <div key={sub} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/30 hover:bg-primary/5 group transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <ShieldCheck className="size-4 text-primary shrink-0 opacity-50 group-hover:opacity-100" />
                          <span className="font-mono text-sm truncate">{sub}</span>
                        </div>
                        <a 
                          href={`https://${sub}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-primary/20 text-accent transition-colors"
                          title="Open in Browser"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </div>
                    ))}
                    {results.subdomains.length === 0 && (
                      <div className="col-span-full py-20 text-center space-y-3">
                          <Layers className="size-12 text-muted-foreground mx-auto opacity-20" />
                          <p className="text-muted-foreground font-headline font-bold">No subdomains discovered for this domain.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <Separator className="bg-primary/10" />
              <div className="p-3 bg-muted/20 text-center">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                   Data sourced from active wordlist probes and public CT logs
                 </p>
              </div>
            </Card>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
