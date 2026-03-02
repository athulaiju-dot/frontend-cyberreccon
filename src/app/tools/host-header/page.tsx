"use client";

import { useState } from "react";
import { Terminal, LoaderCircle, Bug, ShieldCheck } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { AppLayout } from "@/components/layout/AppLayout";
import { testHostHeader, type HostHeaderResult } from "./actions";
import { useToast } from "@/hooks/use-toast";

export default function HostHeaderPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HostHeaderResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setResults(null);
    
    try {
      const data = await testHostHeader(url);
      setResults(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: error.message || "Failed to communicate with target.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Host Header Tester"
        description="Inject custom Host headers to identify vulnerabilities in server configuration."
        icon={Terminal}
      >
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Target System</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <Input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g., example.com"
                  className="flex-grow"
                />
                <Button type="submit" disabled={loading || !url} className="w-full sm:w-auto">
                  {loading ? <LoaderCircle className="animate-spin" /> : <Terminal className="mr-2" />}
                  Inject & Test
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex justify-center items-center gap-2 text-muted-foreground">
              <LoaderCircle className="animate-spin text-primary" />
              <span>Sending payload and monitoring response...</span>
            </div>
          )}

          {results && (
            <Card className={results.isVulnerable ? "border-destructive/50" : "border-primary/50"}>
               <CardHeader className="flex flex-row items-center gap-3">
                  {results.isVulnerable ? (
                    <Bug className="text-destructive size-6" />
                  ) : (
                    <ShieldCheck className="text-primary size-6" />
                  )}
                  <CardTitle className="font-headline text-primary">Injection Report</CardTitle>
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
