"use client";

import { useState } from "react";
import { Mail, LoaderCircle } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";

export default function EmailLookupPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<object | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setResults(null);
    await new Promise(resolve => setTimeout(resolve, 1800));
    setResults({
      "Email Address": email,
      "Is Deliverable": "Yes",
      "Domain Details": {
        "Domain": email.split('@')[1],
        "MX Records Found": true,
      },
      "Data Breaches": [
        { "breach": "Large Social Media Platform 2021", "data_exposed": ["email", "password", "phone_number"] },
        { "breach": "E-commerce Site 2020", "data_exposed": ["email", "address", "name"] },
      ],
    });
    setLoading(false);
  };

  return (
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
            <span>Searching through data breaches...</span>
          </div>
        )}

        {results && <ResultsDisplay results={results} />}
      </div>
    </ToolPageWrapper>
  );
}
