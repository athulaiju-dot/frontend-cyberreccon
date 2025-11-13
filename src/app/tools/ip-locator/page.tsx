"use client";

import { useState } from "react";
import { Globe, LoaderCircle, MapPin } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";

interface Geolocation {
  lat?: number;
  lon?: number;
}

export default function IpLocatorPage() {
  const [ipAddress, setIpAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<object | null>(null);
  const [geolocation, setGeolocation] = useState<Geolocation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress) return;

    setLoading(true);
    setResults(null);
    setGeolocation(null);

    // Simulate API call based on the python script's output
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const apiResponse = {
      "query": ipAddress,
      "status": "success",
      "country": "United States",
      "countryCode": "US",
      "region": "CA",
      "regionName": "California",
      "city": "Mountain View",
      "zip": "94043",
      "lat": 37.422,
      "lon": -122.084,
      "timezone": "America/Los_Angeles",
      "isp": "Google LLC",
      "org": "Google LLC",
      "as": "AS15169 Google LLC"
    };

    setResults(apiResponse);
    if (apiResponse.lat && apiResponse.lon) {
      setGeolocation({ lat: apiResponse.lat, lon: apiResponse.lon });
    }
    setLoading(false);
  };

  const openMap = () => {
    if (geolocation?.lat && geolocation?.lon) {
      const url = `https://www.google.com/maps?q=${geolocation.lat},${geolocation.lon}`;
      window.open(url, "_blank");
    }
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

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-primary">Investigation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsDisplay results={results} />
            </CardContent>
            {geolocation && (
              <CardFooter>
                <Button onClick={openMap} variant="outline" className="w-full sm:w-auto ml-auto">
                  <MapPin className="mr-2" />
                  Open in Map
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
      </div>
    </ToolPageWrapper>
  );
}
