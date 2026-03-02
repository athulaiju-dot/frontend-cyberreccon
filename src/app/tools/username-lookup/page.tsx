"use client";

import { useState } from "react";
import { UserSearch, LoaderCircle, Search, ExternalLink, UserCheck, AlertCircle, ShieldCheck } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { searchUsernames, type UsernameSearchResults, type PlatformKey } from "./actions";
import { AppLayout } from "@/components/layout/AppLayout";

const ALL_PLATFORMS: PlatformKey[] = [
  "Instagram",
  "Twitter",
  "GitHub",
  "TikTok",
  "YouTube",
  "Facebook",
  "Reddit",
  "Pinterest",
  "Medium"
];

export default function UsernameLookupPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UsernameSearchResults | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>(
    ALL_PLATFORMS.reduce((acc, p) => ({ ...acc, [p]: true }), {})
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setResults(null);
    
    const activePlatforms = Object.entries(selectedPlatforms)
        .filter(([,isSelected]) => isSelected)
        .map(([platform]) => platform) as PlatformKey[];

    try {
        const searchResults = await searchUsernames(username.trim(), activePlatforms);
        setResults(searchResults);
    } catch(error) {
        console.error("Username reconnaissance failed:", error);
    }

    setLoading(false);
  };
  
  const ResultItem = ({ label, value, isExact }: { label: string, value: string, isExact?: boolean }) => (
    <div className={`flex items-center justify-between gap-4 text-sm py-3 px-4 rounded-lg border transition-all ${isExact ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-border/50 hover:bg-muted/50'}`}>
      <div className="flex items-center gap-3 overflow-hidden">
        {isExact ? (
           <UserCheck className="size-5 text-primary shrink-0" />
        ) : (
          <ShieldCheck className="size-4 text-muted-foreground shrink-0" />
        )}
        <div className="flex flex-col truncate">
           <span className={`font-mono truncate ${isExact ? 'font-bold text-primary text-base' : 'text-muted-foreground'}`}>{label}</span>
           {isExact && <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Exact Match Found</span>}
        </div>
      </div>
      <a 
        href={value} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`flex items-center gap-1.5 font-bold hover:underline shrink-0 ${isExact ? 'text-primary' : 'text-accent'}`}
      >
        View Profile <ExternalLink className="size-4" />
      </a>
    </div>
  )

  const totalExactMatches = results ? Object.values(results).filter(r => r.exactMatch).length : 0;
  const totalMatches = results ? Object.values(results).reduce((acc, r) => acc + (r.exactMatch ? 1 : 0) + r.found.length, 0) : 0;

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Username Reconnaissance"
        description="High-priority literal input scanning across global social registries."
        icon={UserSearch}
      >
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-xl font-headline">Recon Parameters</CardTitle>
                <CardDescription>Your literal input is verified FIRST before any variations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative flex-grow w-full">
                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter exact username..."
                      className="pl-10 h-12 bg-background/50 border-primary/30 focus:border-primary text-lg"
                      aria-label="Username or Name"
                    />
                  </div>
                  <Button type="submit" disabled={loading || !username} className="h-12 w-full sm:w-auto px-8 shadow-lg shadow-primary/20">
                    {loading ? (
                      <LoaderCircle className="animate-spin size-5" />
                    ) : (
                      <><Search className="mr-2 size-5" /> Execute Scan</>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 rounded-lg bg-background/30 border border-border/50">
                    {ALL_PLATFORMS.map(platform => (
                        <div key={platform} className="flex items-center space-x-2">
                            <Checkbox
                                id={platform}
                                checked={selectedPlatforms[platform]}
                                onCheckedChange={() => setSelectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }))}
                                className="border-primary data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor={platform} className="text-sm font-medium cursor-pointer">
                                {platform}
                            </Label>
                        </div>
                    ))}
                </div>
              </CardContent>
            </form>
          </Card>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderCircle className="animate-spin size-12 text-primary" />
              <div className="text-center">
                <p className="font-headline font-bold text-lg text-primary uppercase tracking-widest">Scanning Literal Input</p>
                <p className="text-xs text-muted-foreground uppercase">Executing server-side bypass for "{username}"...</p>
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-6">
              {/* LITERAL MATCHES - ABSOLUTE HIGHEST PRIORITY */}
              {totalExactMatches > 0 ? (
                <Card className="border-primary bg-primary/10 shadow-2xl shadow-primary/10 overflow-hidden ring-1 ring-primary/40">
                  <CardHeader className="border-b border-primary/20 py-4 bg-primary/10">
                    <div className="flex items-center gap-2">
                      <UserCheck className="size-6 text-primary" />
                      <CardTitle className="text-xl font-headline text-primary">Literal Input Matches</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(results).map(([platform, data]) => (
                      data.exactMatch && <ResultItem key={platform} label={`${platform}: ${data.exactMatch.username}`} value={data.exactMatch.url} isExact />
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-destructive/30 bg-destructive/5 overflow-hidden">
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="size-5 text-destructive" />
                      <CardTitle className="text-lg font-headline text-destructive uppercase">No Literal Match Found</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {/* DETAILED REPORT SECTION */}
              <Card className="bg-card/30 backdrop-blur-xl border-border/50 overflow-hidden shadow-2xl">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <div className="flex items-center justify-between">
                      <CardTitle className="font-headline text-lg">Discovery Report</CardTitle>
                      <Badge variant="outline" className="text-primary border-primary">
                          {totalMatches} Active Profiles
                      </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {totalMatches > 0 ? (
                    <Accordion type="multiple" defaultValue={ALL_PLATFORMS} className="w-full">
                      {Object.entries(results).map(([platform, data]) => (
                        (data.exactMatch || data.found.length > 0) && (
                          <AccordionItem value={platform} key={platform} className="border-b border-border/10 last:border-0">
                            <AccordionTrigger className="px-6 py-4 font-headline text-lg hover:no-underline hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-4">
                                <span className="font-bold">{platform}</span>
                                {data.exactMatch && <Badge className="bg-primary text-[10px]">LITERAL MATCH</Badge>}
                                {data.found.length > 0 && <Badge variant="secondary" className="text-[10px]">+{data.found.length} Variants</Badge>}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pt-2 pb-6 space-y-4 bg-background/20">
                              {data.exactMatch && (
                                <ResultItem label={data.exactMatch.username} value={data.exactMatch.url} isExact />
                              )}
                              {data.found.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {data.found.map(item => (
                                    <ResultItem key={item.url} label={item.username} value={item.url} />
                                  ))}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        )
                      ))}
                    </Accordion>
                  ) : (
                    <div className="py-20 text-center space-y-3">
                        <AlertCircle className="size-12 text-muted-foreground mx-auto opacity-20" />
                        <p className="text-muted-foreground font-headline font-bold">No active profiles identified for "{username}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
