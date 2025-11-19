"use client";

import { useState } from "react";
import { UserSearch, LoaderCircle, CheckCircle, Search, ChevronDown } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { searchUsernames, type UsernameSearchResults } from "./actions";
import { AppLayout } from "@/components/layout/AppLayout";
import { Switch } from "@/components/ui/switch";

type Results = UsernameSearchResults;

const ALL_PLATFORMS = [
  "GitHub",
  "Twitter",
  "Reddit",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "Pinterest",
  "Medium",
  "YouTube",
  "Quora",
] as const;

type PlatformKey = (typeof ALL_PLATFORMS)[number];

const initialSelectedPlatforms = ALL_PLATFORMS.reduce((acc, platform) => {
  acc[platform] = true;
  return acc;
}, {} as Record<string, boolean>);


export default function UsernameLookupPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [isPlatformsOpen, setIsPlatformsOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>(initialSelectedPlatforms);
  const [includeDiscovery, setIncludeDiscovery] = useState(true);

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const handleSelectAll = () => {
     const allSelected = ALL_PLATFORMS.reduce((acc, platform) => {
      acc[platform] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setSelectedPlatforms(allSelected);
  }

  const handleDeselectAll = () => {
    const allDeselected = ALL_PLATFORMS.reduce((acc, platform) => {
      acc[platform] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setSelectedPlatforms(allDeselected);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setResults(null);
    
    const activePlatforms = Object.entries(selectedPlatforms)
        .filter(([,isSelected]) => isSelected)
        .map(([platform]) => platform) as PlatformKey[];

    try {
        const searchResults = await searchUsernames(username, activePlatforms, includeDiscovery);
        setResults(searchResults);
    } catch(error) {
        console.error("Username search failed:", error);
        // Optionally, show an error toast to the user
    }

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

  const selectedCount = Object.values(selectedPlatforms).filter(Boolean).length;

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Username Lookup"
        description="Find social media profiles and online accounts by username."
        icon={UserSearch}
      >
        <div className="space-y-8">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Enter Username</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
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
                </div>

                <Collapsible open={isPlatformsOpen} onOpenChange={setIsPlatformsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Select Platforms ({selectedCount} / {ALL_PLATFORMS.length})</span>
                      <ChevronDown className={`transform transition-transform ${isPlatformsOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                     <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleSelectAll}>Select All</Button>
                        <Button variant="ghost" size="sm" onClick={handleDeselectAll}>Deselect All</Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {ALL_PLATFORMS.map(platform => (
                        <div key={platform} className="flex items-center space-x-2">
                          <Checkbox
                            id={platform}
                            checked={selectedPlatforms[platform]}
                            onCheckedChange={() => handlePlatformChange(platform)}
                          />
                          <Label htmlFor={platform} className="font-medium cursor-pointer">
                            {platform}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="discovery-mode" 
                        checked={includeDiscovery}
                        onCheckedChange={setIncludeDiscovery}
                    />
                    <Label htmlFor="discovery-mode">Enable DuckDuckGo Discovery</Label>
                </div>

              </CardContent>
            </form>
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
                 {Object.keys(results).length > 0 && Object.values(results).some(r => r.found.length > 0 || r.discovered.length > 0) ? (
                  <Accordion type="multiple" defaultValue={Object.keys(results).filter(p => results[p as PlatformKey].found.length > 0 || results[p as PlatformKey].discovered.length > 0)} className="w-full">
                    {Object.entries(results).map(([platform, data]) => (
                      (data.found.length > 0 || data.discovered.length > 0) && (
                        <AccordionItem value={platform} key={platform}>
                          <AccordionTrigger className="font-headline text-lg hover:no-underline">
                            <div className="flex items-center gap-3">
                              {platform}
                              <Badge variant="secondary">{data.found.length} Found</Badge>
                              {includeDiscovery && <Badge variant="outline">{data.discovered.length} Discovered</Badge>}
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
                            {data.discovered.length > 0 && includeDiscovery && (
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
                ) : (
                  <p className="text-muted-foreground text-center">No accounts found for the selected platforms.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
