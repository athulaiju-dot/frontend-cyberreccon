"use client";

import { useState } from "react";
import { Globe, LoaderCircle } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";

export default function IpLocatorPage() {
  const [ipAddress, setIpAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<object | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress) return;

    setLoading(true);
    setResults(null);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setResults({
      "IP Address": ipAddress,
      "Geolocation": {
        "City": "Mountain View",
        "Region": "California",
        "Country": "United States",
        "Postal Code": "94043",
        "Latitude": 37.422,
        "Longitude": -122.084,
      },
      "ISP": "Google LLC",
      "ASN": "AS15169",
    });
    setLoading(false);
  };

  return (
    <ToolPageWrapper
      title="IP Locator"
      description="Trace an IP address to its geographic location."
      icon={Globe}
    >
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Enter IP Address</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
              <Input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g., 8.8.8.8"
                className="flex-grow"
                aria-label="IP Address"
              />
              <Button type="submit" disabled={loading || !ipAddress} className="w-full sm:w-auto">
                {loading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Globe className="mr-2" />
                )}
                Locate
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex justify-center items-center gap-2 text-muted-foreground">
            <LoaderCircle className="animate-spin text-primary" />
            <span>Triangulating position...</span>
          </div>
        )}

        {results && <ResultsDisplay results={results} />}
      </div>
    </ToolPageWrapper>
  );
}
