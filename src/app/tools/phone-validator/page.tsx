"use client";

import { useState } from "react";
import { Phone, LoaderCircle, ShieldCheck, MapPin, Signal, Hash, Info, Building2, Map } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { validatePhone, type PhoneValidationResult } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
      const validationResult = await validatePhone(phone.trim());
      if (validationResult.error && !validationResult.valid) {
        toast({
          variant: "destructive",
          title: "Lookup Failed",
          description: validationResult.error,
        });
      } else {
        setResults(validationResult);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Failed to communicate with the intelligence engine.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Phone Intelligence"
        description="Automatic country detection, carrier identification, and location tracing."
        icon={Phone}
      >
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Phone Reconnaissance</CardTitle>
              <CardDescription>Enter any number. The system will automatically identify the origin and carrier.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 919876543210 (No + required)"
                    className="pl-10 h-12 bg-background/50 border-primary/30 focus:border-primary text-lg font-mono"
                  />
                </div>
                <Button type="submit" disabled={loading || !phone} className="h-12 w-full sm:w-auto px-8 shadow-lg shadow-primary/20">
                  {loading ? (
                    <LoaderCircle className="animate-spin size-5" />
                  ) : (
                    <><ShieldCheck className="mr-2 size-5" /> Execute Trace</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderCircle className="animate-spin size-12 text-primary" />
              <div className="text-center">
                <p className="font-headline font-bold text-lg text-primary uppercase tracking-widest">Triangulating Carrier</p>
                <p className="text-xs text-muted-foreground uppercase">Analyzing global numbering plans and local registries...</p>
              </div>
            </div>
          )}

          {results && (
            <Card className={`border-primary/50 shadow-2xl overflow-hidden ${!results.valid ? 'border-destructive/50' : ''}`}>
              <CardHeader className="bg-primary/5 border-b border-primary/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-primary">Intelligence Report</CardTitle>
                  <CardDescription>Verified details for {results.international}</CardDescription>
                </div>
                <Badge variant={results.valid ? "default" : "destructive"} className="uppercase">
                  {results.valid ? "Active / Valid" : "Invalid Number"}
                </Badge>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="size-3" /> Country
                    </p>
                    <p className="text-lg font-semibold">{results.country}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="size-3" /> Carrier
                    </p>
                    <p className="text-lg font-semibold text-primary">{results.carrier}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Map className="size-3" /> Location
                    </p>
                    <p className="text-lg font-semibold">{results.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Signal className="size-3" /> Line Type
                    </p>
                    <p className="text-lg font-semibold capitalize">{results.lineType}</p>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground">
                    <Info className="size-4" /> Structural Analysis
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">International Format</p>
                        <p className="font-mono text-primary">{results.international}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">E.164 Standard</p>
                        <p className="font-mono text-primary">{results.e164}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              {!results.valid && (
                <CardFooter className="bg-destructive/5 border-t border-destructive/20 p-4">
                  <p className="text-xs text-destructive font-bold uppercase text-center w-full">
                    Warning: Number structure not recognized by any global registry.
                  </p>
                </CardFooter>
              )}
            </Card>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
