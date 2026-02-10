"use client";

import { useState } from "react";
import { Mail, LoaderCircle } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { AppLayout } from "@/components/layout/AppLayout";
import { lookupEmail, type EmailLookupResult } from "./actions";
import { useToast } from "@/hooks/use-toast";

export default function EmailLookupPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EmailLookupResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setResults(null);
    
    try {
      const data = await lookupEmail(email);
      setResults(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lookup Failed",
        description: error.message || "Failed to analyze email address.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Email Lookup"
        description="Gather information associated with an email address."
        icon={Mail}
      >
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Enter Email Address</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., user@example.com"
                  className="flex-grow"
                  aria-label="Email Address"
                />
                <Button type="submit" disabled={loading || !email} className="w-full sm:w-auto">
                  {loading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Mail className="mr-2" />
                  )}
                  Lookup
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex justify-center items-center gap-2 text-muted-foreground">
              <LoaderCircle className="animate-spin text-primary" />
              <span>Verifying domain MX records...</span>
            </div>
          )}

          {results && (
            <Card>
               <CardHeader>
                  <CardTitle className="font-headline text-primary">Analysis Results</CardTitle>
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