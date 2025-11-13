"use client";

import { useState } from "react";
import { UserSearch, LoaderCircle } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";

export default function UsernameLookupPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<object | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setResults(null);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setResults({
      "Username": username,
      "Platform Checks": {
        "Twitter": { "found": true, "url": `https://twitter.com/${username}` },
        "GitHub": { "found": true, "url": `https://github.com/${username}` },
        "Instagram": { "found": false, "url": null },
        "Reddit": { "found": true, "url": `https://reddit.com/u/${username}` },
      },
      "Last Seen": new Date().toUTCString(),
    });
    setLoading(false);
  };

  return (
    <ToolPageWrapper
      title="Username Lookup"
      description="Find social media profiles and online accounts by username."
      icon={UserSearch}
    >
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Enter Username</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., johndoe"
                className="flex-grow"
                aria-label="Username"
              />
              <Button type="submit" disabled={loading || !username} className="w-full sm:w-auto">
                {loading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <UserSearch className="mr-2" />
                )}
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex justify-center items-center gap-2 text-muted-foreground">
            <LoaderCircle className="animate-spin text-primary" />
            <span>Scanning the digital universe...</span>
          </div>
        )}

        {results && <ResultsDisplay results={results} />}
      </div>
    </ToolPageWrapper>
  );
}
