"use client";

import { useState } from "react";
import { UserSearch, LoaderCircle, CheckCircle, Search } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface PlatformResult {
  found: { username: string; url: string }[];
  discovered: string[];
}

interface Results {
  [platform: string]: PlatformResult;
}

export default function UsernameLookupPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setResults(null);
    // Simulate API call based on the provided python script's logic
    await new Promise(resolve => setTimeout(resolve, 2000));
    setResults({
      "GitHub": {
        "found": [
          { "username": username, "url": `https://github.com/${username}` },
          { "username": `${username}_dev`, "url": `https://github.com/${username}_dev` }
        ],
        "discovered": [`${username}123`, `${username}-portfolio`, `dev_${username}`]
      },
      "Twitter": {
        "found": [
          { "username": username, "url": `https://twitter.com/${username}` }
        ],
        "discovered": []
      },
      "Reddit": {
        "found": [
           { "username": username, "url": `https://reddit.com/u/${username}` }
        ],
        "discovered": [`u_${username}_alt`, `${username}_fan`]
      },
      "Instagram": {
        "found": [],
        "discovered": [`real_${username}`, `the.${username}`]
      }
    });
    setLoading(false);
  };
  
  const ResultItem = ({ label, value, isUrl = false }: { label: string, value: string, isUrl?: boolean }) => (
    <div className="flex items-center gap-2 text-sm py-1">
      {isUrl ? (
        <>
          <CheckCircle className="size-4 text-primary" />
          <strong className="font-mono">{label}:</strong>
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate">{value}</a>
        </>
      ) : (
        <>
          <Search className="size-4 text-muted-foreground" />
          <span className="font-mono text-muted-foreground">{value}</span>
        </>
      )}
    </div>
  )

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
                placeholder="e.g., niazahamed"
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

        {results && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="font-headline text-primary">Investigation Results for "{username}"</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={Object.keys(results)} className="w-full">
                {Object.entries(results).map(([platform, data]) => (
                  (data.found.length > 0 || data.discovered.length > 0) && (
                    <AccordionItem value={platform} key={platform}>
                      <AccordionTrigger className="font-headline text-lg hover:no-underline">
                        <div className="flex items-center gap-3">
                          {platform}
                          <Badge variant="secondary">{data.found.length} Found</Badge>
                          <Badge variant="outline">{data.discovered.length} Discovered</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-3">
                        {data.found.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-primary mb-2">Found Accounts</h4>
                            <div className="flex flex-col gap-1">
                              {data.found.map(item => (
                                <ResultItem key={item.url} label={item.username} value={item.url} isUrl />
                              ))}
                            </div>
                          </div>
                        )}
                        {data.discovered.length > 0 && (
                          <div>
                             <h4 className="font-semibold text-accent mb-2">Discovered Usernames</h4>
                             <div className="flex flex-wrap gap-2">
                                {data.discovered.map(name => (
                                  <Badge key={name} variant="outline" className="font-mono bg-background/50">{name}</Badge>
                                ))}
                             </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolPageWrapper>
  );
}
