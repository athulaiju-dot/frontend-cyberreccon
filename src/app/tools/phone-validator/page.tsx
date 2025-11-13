"use client";

import { useState } from "react";
import { Phone, LoaderCircle } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";

export default function PhoneValidatorPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<object | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setResults(null);
    // Simulate API call based on the python script's output
    await new Promise(resolve => setTimeout(resolve, 1500));
    setResults({
      "input": phone,
      "e164": "+15551234567",
      "international": "+1 555-123-4567",
      "national": "(555) 123-4567",
      "valid": true,
      "possible": true,
      "country": "United States",
      "carrier": "T-Mobile",
      "type": "MOBILE",
    });
    setLoading(false);
  };

  return (
    <ToolPageWrapper
      title="Phone Validator"
      description="Validate and get information about a phone number."
      icon={Phone}
    >
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Enter Phone Number</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., +15551234567"
                className="flex-grow"
                aria-label="Phone Number"
              />
              <Button type="submit" disabled={loading || !phone} className="w-full sm:w-auto">
                {loading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Phone className="mr-2" />
                )}
                Validate
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex justify-center items-center gap-2 text-muted-foreground">
            <LoaderCircle className="animate-spin text-primary" />
            <span>Contacting orbital satellites...</span>
          </div>
        )}

        {results && <ResultsDisplay results={results} />}
      </div>
    </ToolPageWrapper>
  );
}
