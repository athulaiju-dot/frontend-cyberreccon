"use client";

import { useState } from "react";
import { Network } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { getWhois, getDNS, getRecon, type WhoisResponse } from "@/lib/api";

interface DomainLookupResult {
  whois: WhoisResponse | null;
  dns: string[];
  recon: string;
}

export default function DomainLookupPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainLookupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setResults(null);

    const normalized = domain.trim().toLowerCase();
    if (!normalized) {
      setErrorMessage("Please enter a domain.");
      return;
    }

    setLoading(true);
    try {
      const [whoisRes, dnsRes, reconRes] = await Promise.allSettled([
        getWhois(normalized),
        getDNS(normalized),
        getRecon(normalized),
      ]);

      if (whoisRes.status === "rejected") {
        toast({ variant: "destructive", title: "WHOIS failed", description: whoisRes.reason?.message || "WHOIS lookup failed" });
      }
      if (dnsRes.status === "rejected") {
        toast({ variant: "destructive", title: "DNS failed", description: dnsRes.reason?.message || "DNS lookup failed" });
      }
      if (reconRes.status === "rejected") {
        toast({ variant: "destructive", title: "RECON failed", description: reconRes.reason?.message || "Recon lookup failed" });
      }

      const whois = whoisRes.status === "fulfilled" ? whoisRes.value : null;
      const dnsData = dnsRes.status === "fulfilled" ? dnsRes.value : { ips: [] };
      const reconData = reconRes.status === "fulfilled" ? reconRes.value : { raw: "No output" };

      const ipAddresses = dnsData.ips?.length ? dnsData.ips : dnsData.A?.length ? dnsData.A : [];
      const rawRecon = reconData.raw || reconData.output || reconData.data || "No Recon output available.";

      setResults({ whois, dns: ipAddresses, recon: rawRecon });
    } catch (err: any) {
      const msg = err?.message || "Unexpected error while querying backend.";
      setErrorMessage(msg);
      toast({ variant: "destructive", title: "Lookup failed", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper title="Domain Intelligence" description="Retrieve ownership, WHOIS, DNS and reconnaissance data." icon={Network}>
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Target Domain</CardTitle>
              <CardDescription>Enter a valid domain (e.g., google.com) to begin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-grow w-full">
                  <Network className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary" />
                  <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g., tesla.com" className="pl-10 h-12" />
                </div>
                <Button type="submit" disabled={loading || !domain} className="h-12">
                  {loading ? "Loading..." : "Run Lookup"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {errorMessage ? <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</div> : null}

          {loading && <div className="text-center text-sm text-muted-foreground">Loading data from backend...</div>}

          {results && (
            <div className="space-y-4">
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg">WHOIS</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.whois ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-xs uppercase text-muted-foreground">Registrar</div>
                        <div className="font-semibold">{results.whois.registrar || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-muted-foreground">Creation Date</div>
                        <div className="font-semibold">{results.whois.creation_date ? new Date(results.whois.creation_date).toLocaleString() : "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-muted-foreground">Expiration Date</div>
                        <div className="font-semibold">{results.whois.expiration_date ? new Date(results.whois.expiration_date).toLocaleString() : "N/A"}</div>
                      </div>
                    </div>
                  ) : (<div className="text-muted-foreground">WHOIS data unavailable.</div>)}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">DNS IP addresses</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.dns.length ? (
                    <ul className="list-disc pl-5 text-sm">
                      {results.dns.map((ip) => <li key={ip}>{ip}</li>)}
                    </ul>
                  ) : (<div className="text-muted-foreground">No IP addresses returned.</div>)}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">RECON Raw Output</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-xs bg-slate-900/10 p-3 rounded">{results.recon || "No recon output."}</pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
