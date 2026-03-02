"use client";

import { useState } from "react";
import { UserSearch, LoaderCircle, CheckCircle, Search, ChevronDown, Check, Info } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { searchUsernames, type UsernameSearchResults, type PlatformKey } from "./actions";
import { AppLayout } from "@/components/layout/AppLayout";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ALL_PLATFORMS: PlatformKey[] = [
  "GitHub",
  "Twitter",
  "Reddit",
  "Instagram",
  "TikTok",
  "Twitch",
  "Facebook",
  "LinkedIn",
  "Pinterest",
  "Medium",
  "YouTube",
  "Quora",
  "Steam"
];

const initialSelectedPlatforms = ALL_PLATFORMS.reduce((acc, platform) => {
  acc[platform] = true;
  return acc;
}, {} as Record<string, boolean>);


export default function UsernameLookupPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UsernameSearchResults | null>(null);
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
    }

    setLoading(false);
  };
  
  const ResultItem = ({ label, value, isUrl = false }: { label: string, value: string, isUrl?: boolean }) => (
    <div className="flex items-center gap-2 text-sm py-1.5 group border-b border-border/20 last:border-0">
      {isUrl ? (
        <>
          <CheckCircle className="size-4 text-primary shrink-0" />
          <strong className="font-mono text-primary/90 shrink-0">{label}:</strong>
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate transition-colors">{value}</a>
        </>
      ) : (
        <>
          <Search className="size-4 text-muted-foreground shrink-0" />
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
        description="OSINT reconnaissance for social media profiles and online accounts."
        icon={UserSearch}
      >
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-xl font-headline">Target Parameters</CardTitle>
                <CardDescription>Enter a username or person's name to begin discovery across global networks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative flex-grow w-full">
                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g., niazahamed"
                      className="pl-10 h-12 bg-background/50"
                      aria-label="Username or Name"
                    />
                  </div>
                  <Button type="submit" disabled={loading || !username} className="h-12 w-full sm:w-auto px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    {loading ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <><UserSearch className="mr-2 size-5" /> Investigate</>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <Collapsible open={isPlatformsOpen} onOpenChange={setIsPlatformsOpen} className="w-full">
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-10 bg-background/30 hover:bg-background/50">
                                <span className="flex items-center gap-2">
                                    <Check className="size-4 text-primary" />
                                    Target Platforms ({selectedCount})
                                </span>
                                <ChevronDown className={`size-4 transform transition-transform duration-200 ${isPlatformsOpen ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-4 px-1 pb-2">
                            <div className="flex items-center justify-end gap-2 mb-2">
                                <Button variant="ghost" size="xs" onClick={handleSelectAll} className="h-7 text-xs px-2">Select All</Button>
                                <Button variant="ghost" size="xs" onClick={handleDeselectAll} className="h-7 text-xs px-2">Deselect All</Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                                {ALL_PLATFORMS.map(platform => (
                                    <div key={platform} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={platform}
                                            checked={selectedPlatforms[platform]}
                                            onCheckedChange={() => handlePlatformChange(platform)}
                                            className="border-primary/50 data-[state=checked]:bg-primary"
                                        />
                                        <Label htmlFor={platform} className="text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                                            {platform}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <Card className="bg-background/20 border-border/50 p-4 flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="discovery-mode" className="font-headline text-sm font-semibold cursor-pointer">Reconnaissance Mode</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="size-3.5 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[250px] bg-card border-border text-xs">
                                            Uses search engines to discover profiles that aren't exact matches but are related to the target name.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Switch 
                                id="discovery-mode" 
                                checked={includeDiscovery}
                                onCheckedChange={setIncludeDiscovery}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed uppercase tracking-wider">
                            {includeDiscovery ? "Enabled: Deep-web discovery active" : "Disabled: Exact variations only"}
                        </p>
                    </Card>
                </div>
              </CardContent>
            </form>
          </Card>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <LoaderCircle className="animate-spin size-12 text-primary opacity-20" />
                <LoaderCircle className="animate-spin size-12 text-primary absolute top-0 left-0" style={{ animationDuration: '3s' }} />
              </div>
              <div className="text-center space-y-1">
                <p className="font-headline font-bold text-lg text-primary animate-pulse">Scanning Global Networks</p>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Intercepting digital signatures...</p>
              </div>
            </div>
          )}

          {results && (
            <Card className="bg-card/30 backdrop-blur-xl border-primary/10 overflow-hidden shadow-2xl">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-headline text-2xl text-primary">Intelligence Report</CardTitle>
                        <CardDescription className="text-muted-foreground">Results for target identification: <span className="text-accent font-mono">"{username}"</span></CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 h-8 px-4">
                        {Object.values(results).reduce((acc, r) => acc + r.found.length, 0)} Verified Matches
                    </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                 {Object.keys(results).length > 0 && Object.values(results).some(r => r.found.length > 0 || r.discovered.length > 0) ? (
                  <Accordion type="multiple" defaultValue={Object.keys(results).filter(p => results[p as PlatformKey].found.length > 0 || results[p as PlatformKey].discovered.length > 0)} className="w-full">
                    {Object.entries(results).map(([platform, data]) => (
                      (data.found.length > 0 || data.discovered.length > 0) && (
                        <AccordionItem value={platform} key={platform} className="border-b border-primary/5 last:border-0">
                          <AccordionTrigger className="px-6 py-4 font-headline text-lg hover:no-underline hover:bg-primary/5 transition-colors">
                            <div className="flex items-center gap-4">
                              <span className="font-bold">{platform}</span>
                              <div className="flex gap-2">
                                  {data.found.length > 0 && <Badge className="bg-primary/80 hover:bg-primary">{data.found.length} Matches</Badge>}
                                  {includeDiscovery && data.discovered.length > 0 && <Badge variant="outline" className="border-accent/40 text-accent bg-accent/5">{data.discovered.length} Discovered</Badge>}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pt-2 pb-6 space-y-6 bg-background/40">
                            {data.found.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-px bg-primary/20 flex-grow" />
                                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest px-2">Verified Profiles</h4>
                                    <div className="h-px bg-primary/20 flex-grow" />
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                  {data.found.map(item => (
                                    <ResultItem key={item.url} label={item.username} value={item.url} isUrl />
                                  ))}
                                </div>
                              </div>
                            )}
                            {data.discovered.length > 0 && includeDiscovery && (
                              <div className="space-y-3">
                                 <div className="flex items-center gap-2 mb-2">
                                    <div className="h-px bg-accent/20 flex-grow" />
                                    <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest px-2">Discovery Variants</h4>
                                    <div className="h-px bg-accent/20 flex-grow" />
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                    {data.discovered.map(name => (
                                      <Badge key={name} variant="outline" className="font-mono bg-accent/5 border-accent/20 hover:border-accent/50 transition-colors py-1 cursor-default">{name}</Badge>
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
                  <div className="py-20 text-center space-y-3">
                      <Search className="size-12 text-muted-foreground mx-auto opacity-20" />
                      <p className="text-muted-foreground font-headline">Zero records identified in global registries.</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Attempt broad variations or enable discovery mode.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}