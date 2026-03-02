"use client";

import { useState } from "react";
import { Phone, LoaderCircle, ShieldCheck, MapPin, Signal, Hash } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { validatePhone, type PhoneValidationResult } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";

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
    
    try {
      const validationResult = await validatePhone(phone);
      if (validationResult.error) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: validationResult.error,
        });
      } else {
        setResults(validationResult);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Failed to communicate with the validation engine.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Telecom Intelligence"
        description="Verify validity, identify origin, and determine carrier type for any phone number globally."
        icon={Phone}
      >
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Phone Input</CardTitle>
              <CardDescription>Enter the number as-is. We will attempt to auto-detect the country.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., 9876543210 (Auto-detection enabled)"
                    className="pl-10 h-12 bg-background/50 border-primary/30 focus:border-primary text-lg font-mono"
                    aria-label="Phone Number"
                  />
                </div>
                <Button type="submit" disabled={loading || !phone} className="h-12 w-full sm:w-auto px-8 shadow-lg shadow-primary/20">
                  {loading ? (
                    <LoaderCircle className="animate-spin size-5" />
                  ) : (
                    <><ShieldCheck className="mr-2 size-5" /> Execute Analysis</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderCircle className="animate-spin size-12 text-primary" />
              <div className="text-center">
                <p className="font-headline font-bold text-lg text-primary uppercase tracking-widest">Querying HLR/VLR Databases</p>
                <p className="text-xs text-muted-foreground uppercase">Parsing number structure and identifying prefix origin...</p>
              </div>
            </div>
          )}

          {results && (
            <div className="grid grid-cols-1 gap-6">
              <Card className="border-primary/50 shadow-2xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/20 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline text-primary">Intelligence Report</CardTitle>
                    <CardDescription>Network Metadata for {results.international}</CardDescription>
                  </div>
                  <Badge variant={results.valid ? "default" : "destructive"} className="uppercase">
                    {results.valid ? "Valid Active Number" : "Invalid/Inactive"}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <MapPin className="size-5 text-primary shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Country Origin</p>
                        <p className="font-semibold text-lg">{results.country}</p>
                        <Badge variant="outline" className="mt-1 text-[10px]">{results.countryCode}</Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <Signal className="size-5 text-primary shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Service Type</p>
                        <p className="font-semibold text-lg">{results.type}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <Hash className="size-5 text-primary shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Identification</p>
                        <p className="font-mono text-sm">{results.e164}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                     <p className="text-sm font-bold uppercase text-muted-foreground border-b pb-2">Technical Analysis</p>
                     <ResultsDisplay results={{
                       "International Format": results.international,
                       "National Format": results.national,
                       "Carrier Info": results.carrier,
                       "Possible Status": results.possible ? "Yes" : "No",
                     }} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
