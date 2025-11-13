"use client";

import { useState } from "react";
import { Network, LoaderCircle } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";

export default function DomainLookupPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<object | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setResults(null);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setResults({
      "Domain Name": domain,
      "WHOIS": {
        "Registrar": "NameCheap, Inc.",
        "Creation Date": "2015-08-12T14:30:00Z",
        "Expiration Date": "2025-08-12T14:30:00Z",
        "Registrant": "REDACTED FOR PRIVACY",
      },
      "DNS Records": {
        "A": "192.0.2.1",
        "MX": "mail.example.com",
        "TXT": "v=spf1 ...",
      },
    });
    setLoading(false);
  };

  return (
    <ToolPageWrapper
      title="Domain Lookup"
      description="Retrieve WHOIS, DNS, and other records for a domain."
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
                placeholder="e.g., example.com"
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
            <span>Querying global DNS servers...</span>
          </div>
        )}

        {results && <ResultsDisplay results={results} />}
      </div>
    </ToolPageWrapper>
  );
}
