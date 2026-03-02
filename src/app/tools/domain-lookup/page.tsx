"use client";

import { useState } from "react";
import { Network, LoaderCircle, ShieldInfo, Database, Calendar, Users } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { AppLayout } from "@/components/layout/AppLayout";
import { lookupDomain, type DomainLookupResult } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DomainLookupPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainLookupResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setResults(null);
    
    try {
      const data = await lookupDomain(domain.trim().toLowerCase());
      setResults(data);
      if (data.status === 'fail') {
         toast({
          variant: "destructive",
          title: "Lookup Incomplete",
          description: data.message || "Failed to resolve domain infrastructure.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lookup Failed",
        description: error.message || "Connection to registry failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Domain Intelligence"
        description="Retrieve ownership, registration, and authoritative DNS records."
        icon={Network}
      >
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Target Domain</CardTitle>
              <CardDescription>Enter a valid TLD (e.g., google.com) to begin reconnaissance.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                  <Network className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary" />
                  <Input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g., tesla.com"
                    className="pl-10 h-12 bg-background/50 border-primary/30 focus:border-primary text-lg"
                    aria-label="Domain Name"
                  />
                </div>
                <Button type="submit" disabled={loading || !domain} className="h-12 w-full sm:w-auto px-8 shadow-lg shadow-primary/20">
                  {loading ? (
                    <LoaderCircle className="animate-spin size-5" />
                  ) : (
                    <><Network className="mr-2 size-5" /> Execute Query</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderCircle className="animate-spin size-12 text-primary" />
              <div className="text-center">
                <p className="font-headline font-bold text-lg text-primary uppercase tracking-widest">Querying Registry</p>
                <p className="text-xs text-muted-foreground uppercase">Accessing RDAP Bootstrap and Authoritative DNS...</p>
              </div>
            </div>
          )}

          {results && (
            <div className="grid grid-cols-1 gap-6">
              {/* WHOIS / REGISTRY DATA */}
              <Card className="border-primary/50 shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/20">
                  <div className="flex items-center gap-2">
                    <ShieldInfo className="size-6 text-primary" />
                    <CardTitle className="text-xl font-headline text-primary">Registration Data (WHOIS)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {results.whois ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                            <Database className="size-3" /> Registrar
                          </p>
                          <p className="text-lg font-semibold">{results.whois.registrar || "Protected / Redacted"}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase text-muted-foreground">Domain Status</p>
                          <div className="flex flex-wrap gap-2">
                            {results.whois.status.map(s => (
                              <Badge key={s} variant="outline" className="text-[10px] bg-primary/5">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-border/50" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-1">
                            <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="size-3" /> Created
                            </p>
                            <p className="text-sm font-mono">{results.whois.created ? new Date(results.whois.created).toLocaleDateString() : 'N/A'}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="size-3" /> Updated
                            </p>
                            <p className="text-sm font-mono">{results.whois.updated ? new Date(results.whois.updated).toLocaleDateString() : 'N/A'}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="size-3 text-destructive" /> Expires
                            </p>
                            <p className="text-sm font-mono font-bold text-primary">{results.whois.expires ? new Date(results.whois.expires).toLocaleDateString() : 'N/A'}</p>
                         </div>
                      </div>

                      <Separator className="bg-border/50" />

                      <div className="space-y-3">
                         <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                            <Users className="size-3" /> Identified Entities
                         </p>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {results.whois.entities?.map((ent, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
                                    <p className="font-bold text-foreground truncate">{ent.name}</p>
                                    <div className="flex gap-1.5 mt-1.5">
                                        {ent.roles.map(r => <Badge key={r} variant="secondary" className="text-[9px] h-4 py-0">{r}</Badge>)}
                                    </div>
                                </div>
                            ))}
                         </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center space-y-2">
                        <ShieldInfo className="size-12 text-muted-foreground mx-auto opacity-20" />
                        <p className="text-muted-foreground font-headline font-bold uppercase">No Registry Data Available</p>
                        <p className="text-xs text-muted-foreground">This TLD might not support RDAP lookup or the registry is blocked.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* DNS RECORDS */}
              <Card className="bg-card/30 backdrop-blur-xl border-border/50 overflow-hidden shadow-2xl">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <div className="flex items-center justify-between">
                      <CardTitle className="font-headline text-lg">Authoritative DNS Discovery</CardTitle>
                      <Badge variant="outline" className="text-primary border-primary">Live Scan Results</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ResultsDisplay results={results.dns} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
