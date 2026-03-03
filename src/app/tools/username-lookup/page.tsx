"use client";

import { useState, useMemo } from "react";
import { UserSearch, LoaderCircle, Search, ExternalLink, ShieldCheck, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { searchUsernames, type UsernameLookupResponse, PLATFORM_GROUPS } from "./actions";
import { AppLayout } from "@/components/layout/AppLayout";
import { Separator } from "@/components/ui/separator";

export default function UsernameLookupPage() {
  const allPlatformNames = useMemo(() => {
    return Object.values(PLATFORM_GROUPS).flatMap(group => Object.keys(group));
  }, []);

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UsernameLookupResponse | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(allPlatformNames);

  const handleSelectAll = () => setSelectedPlatforms(allPlatformNames);
  const handleDeselectAll = () => setSelectedPlatforms([]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || selectedPlatforms.length === 0) return;

    setLoading(true);
    setResults(null);
    
    try {
        const searchResults = await searchUsernames(username.trim(), selectedPlatforms);
        setResults(searchResults);
    } catch(error) {
        console.error("Username reconnaissance failed:", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <AppLayout>
      <ToolPageWrapper
        title="Username Intelligence"
        description="Comprehensive reconnaissance using multi-category direct probing and content verification."
        icon={UserSearch}
      >
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-xl font-headline">Target Parameters</CardTitle>
                <CardDescription>Enter the username to trace across chosen platforms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative flex-grow w-full">
                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter target username..."
                      className="pl-10 h-12 bg-background/50 border-primary/30 focus:border-primary text-lg"
                      aria-label="Username"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading || !username || selectedPlatforms.length === 0} 
                    className="h-12 w-full sm:w-auto px-8 shadow-lg shadow-primary/20"
                  >
                    {loading ? (
                      <LoaderCircle className="animate-spin size-5" />
                    ) : (
                      <><Search className="mr-2 size-5" /> Execute Trace</>
                    )}
                  </Button>
                </div>

                <Separator className="bg-primary/10" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                      <LayoutGrid className="size-4" /> Platform Selection
                    </h3>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} className="h-7 text-[10px] uppercase font-bold">
                        Select All
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll} className="h-7 text-[10px] uppercase font-bold">
                        Deselect All
                      </Button>
                    </div>
                  </div>

                  <Accordion type="multiple" className="w-full">
                    {Object.entries(PLATFORM_GROUPS).map(([category, sites]) => (
                      <AccordionItem key={category} value={category} className="border-primary/10">
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3">
                            <span className="font-headline font-bold text-sm uppercase">{category}</span>
                            <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                              {Object.keys(sites).filter(s => selectedPlatforms.includes(s)).length} / {Object.keys(sites).length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                            {Object.keys(sites).map((site) => (
                              <div key={site} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`site-${site}`} 
                                  checked={selectedPlatforms.includes(site)}
                                  onCheckedChange={() => togglePlatform(site)}
                                />
                                <Label 
                                  htmlFor={`site-${site}`}
                                  className="text-xs font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {site}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  {selectedPlatforms.length === 0 && (
                    <p className="text-xs text-destructive font-bold uppercase text-center py-2 animate-pulse">
                      Warning: No platforms selected. Search will return 0 results.
                    </p>
                  )}
                </div>
              </CardContent>
            </form>
          </Card>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderCircle className="animate-spin size-12 text-primary" />
              <div className="text-center">
                <p className="font-headline font-bold text-lg text-primary uppercase tracking-widest">Probing Selected Networks</p>
                <p className="text-xs text-muted-foreground uppercase">Probing {selectedPlatforms.length} targets concurrently...</p>
              </div>
            </div>
          )}

          {results && (
            <Card className="border-primary/50 shadow-2xl overflow-hidden bg-card/40 backdrop-blur-xl">
               <CardHeader className="bg-primary/5 border-b border-primary/20 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline text-primary">Intelligence Report</CardTitle>
                    <CardDescription>Verified profiles found for "{username}"</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary font-mono text-sm px-3">
                    {results.total_found} Identified
                  </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px] w-full">
                  <div className="p-6 space-y-4">
                    {results.accounts.map((account, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-border/50 bg-background/30 hover:border-primary/50 transition-all group hover:bg-primary/5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <p className="font-bold text-lg text-foreground uppercase tracking-tight">
                                 {account.platform}
                               </p>
                               <Badge variant="secondary" className="text-[10px] h-4 py-0 font-bold bg-muted/50 border-none uppercase">
                                 {account.category}
                               </Badge>
                            </div>
                            <p className="text-xs font-mono text-muted-foreground truncate max-w-md">
                              {account.url}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors border-primary/30 group-hover:border-primary">
                            <a href={account.url} target="_blank" rel="noopener noreferrer">
                              View Profile <ExternalLink className="ml-2 size-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {results.total_found === 0 && (
                      <div className="py-20 text-center space-y-3">
                          <AlertCircle className="size-12 text-muted-foreground mx-auto opacity-20" />
                          <p className="text-muted-foreground font-headline font-bold uppercase tracking-widest">No Matches Identified</p>
                          <p className="text-xs text-muted-foreground">The username does not appear to be active on any of the {selectedPlatforms.length} chosen platforms.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <Separator className="bg-primary/10" />
              <div className="p-4 bg-primary/5 text-center flex items-center justify-center gap-2">
                 <ShieldCheck className="size-4 text-primary" />
                 <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                   Direct verification engine complete • {selectedPlatforms.length} platform(s) scanned
                 </p>
              </div>
            </Card>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}

import { LayoutGrid } from "lucide-react";
