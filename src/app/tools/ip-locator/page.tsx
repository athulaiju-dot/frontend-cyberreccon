"use client";

import { useState } from "react";
import { Globe, LoaderCircle, MapPin, Search } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { locateIp, type IpLookupResult } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";

export default function IpLocatorPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<IpLookupResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setResults(null);

    try {
      const apiResponse = await locateIp(query);
      if (apiResponse.status === 'success') {
          setResults(apiResponse);
      } else {
          toast({
              variant: "destructive",
              title: "Trace Failed",
              description: apiResponse.message || "Could not resolve geographic data for this target.",
          });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "An unexpected error occurred during the trace.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openMap = () => {
    if (results?.lat && results?.lon) {
      const url = `https://www.google.com/maps?q=${results.lat},${results.lon}`;
      window.open(url, "_blank");
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Network Locator"
        description="Trace IP addresses or Domain names to their physical geographic source."
        icon={Globe}
      >
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Trace Parameters</CardTitle>
              <CardDescription>Enter a valid IPv4/IPv6 address or a top-level domain.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary" />
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 8.8.8.8 or google.com"
                    className="pl-10 h-12 bg-background/50 border-primary/30 focus:border-primary text-lg"
                    aria-label="IP Address or Domain"
                  />
                </div>
                <Button type="submit" disabled={loading || !query} className="h-12 w-full sm:w-auto px-8 shadow-lg shadow-primary/20">
                  {loading ? (
                    <LoaderCircle className="animate-spin size-5" />
                  ) : (
                    <><Globe className="mr-2 size-5" /> Execute Trace</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderCircle className="animate-spin size-12 text-primary" />
              <div className="text-center">
                <p className="font-headline font-bold text-lg text-primary uppercase tracking-widest">Triangulating Source</p>
                <p className="text-xs text-muted-foreground uppercase">Querying global registry databases...</p>
              </div>
            </div>
          )}

          {results && (
            <Card className="border-primary/50 overflow-hidden shadow-2xl">
              <CardHeader className="bg-primary/5 border-b border-primary/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-primary">Intelligence Report</CardTitle>
                  <CardDescription>Source: {results.source || 'Aggregated Data'}</CardDescription>
                </div>
                {results.resolvedIp && <Badge variant="outline" className="text-primary border-primary">Resolved: {results.resolvedIp}</Badge>}
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6">
                  <ResultsDisplay results={results} />
                </div>
              </CardContent>
              {results.lat && results.lon && (
                <CardFooter className="bg-muted/30 border-t border-border/50 p-4">
                  <Button onClick={openMap} variant="default" className="w-full sm:w-auto ml-auto shadow-lg shadow-primary/20">
                    <MapPin className="mr-2" />
                    Visualize in Satellite Map
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
