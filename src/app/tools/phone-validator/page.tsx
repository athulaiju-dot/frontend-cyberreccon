"use client";

import { useState } from "react";
import { Phone, LoaderCircle } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { validatePhone, type PhoneValidationResult } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";


export default function PhoneValidatorPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PhoneValidationResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setResults(null);
    
    const validationResult = await validatePhone(phone);
    
    if (validationResult.error) {
       toast({
            variant: "destructive",
            title: "Validation Failed",
            description: validationResult.error,
        });
    } else {
        setResults(validationResult);
    }
    
    setLoading(false);
  };

  return (
    <AppLayout>
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
                  placeholder="e.g., +919876543210"
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
              <span>Contacting global telecom networks...</span>
            </div>
          )}

          {results && 
            <Card>
              <CardHeader>
                  <CardTitle className="font-headline text-primary">Validation Results</CardTitle>
              </CardHeader>
              <CardContent>
                  <ResultsDisplay results={results} />
              </CardContent>
            </Card>
          }
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
