"use client";

import { useState } from "react";
import { Network, LoaderCircle } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { AppLayout } from "@/components/layout/AppLayout";
import { lookupDomain, type DomainLookupResult } from "./actions";
import { useToast } from "@/hooks/use-toast";

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
      const data = await lookupDomain(domain);
      setResults(data);
      if (data.status === 'fail') {
         toast({
          variant: "destructive",
          title: "Lookup Incomplete",
          description: data.message || "Could not retrieve all DNS records.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lookup Failed",
        description: error.message || "Failed to resolve domain.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Domain Lookup"
        description="Retrieve DNS and other infrastructure records for a domain."
        icon={Network}
      >
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Enter Domain Name</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <Input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., google.com"
                  className="flex-grow"
                  aria-label="Domain Name"
                />
                <Button type="submit" disabled={loading || !domain} className="w-full sm:w-auto">
                  {loading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Network className="mr-2" />
                  )}
                  Lookup
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex justify-center items-center gap-2 text-muted-foreground">
              <LoaderCircle className="animate-spin text-primary" />
              <span>Querying authoritative DNS servers...</span>
            </div>
          )}

          {results && (
            <Card>
               <CardHeader>
                  <CardTitle className="font-headline text-primary">DNS Discovery Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ResultsDisplay results={results} />
              </CardContent>
            </Card>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}