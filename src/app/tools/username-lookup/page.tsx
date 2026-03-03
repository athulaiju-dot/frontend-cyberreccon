"use client";

import { useState } from "react";
import { UserSearch, LoaderCircle, Search, ExternalLink, UserCheck, ShieldCheck, Globe, AlertCircle } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchUsernames, type UsernameLookupResponse } from "./actions";
import { AppLayout } from "@/components/layout/AppLayout";
import { Separator } from "@/components/ui/separator";

export default function UsernameLookupPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UsernameLookupResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setResults(null);
    
    try {
        const searchResults = await searchUsernames(username.trim());
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
        title="Username Reconnaissance"
        description="Discovery using DuckDuckGo scraping, literal matches, and variation analysis."
        icon={UserSearch}
      >
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-xl font-headline">Recon Parameters</CardTitle>
                <CardDescription>Enter the target username. We will search for literal matches and common variations.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative flex-grow w-full">
                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username (e.g., hacker-ace)..."
                      className="pl-10 h-12 bg-background/50 border-primary/30 focus:border-primary text-lg"
                      aria-label="Username"
                    />
                  </div>
                  <Button type="submit" disabled={loading || !username} className="h-12 w-full sm:w-auto px-8 shadow-lg shadow-primary/20">
                    {loading ? (
                      <LoaderCircle className="animate-spin size-5" />
                    ) : (
                      <><Search className="mr-2 size-5" /> Discover Profiles</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderCircle className="animate-spin size-12 text-primary" />
              <div className="text-center">
                <p className="font-headline font-bold text-lg text-primary uppercase tracking-widest">Scraping Global Indices</p>
                <p className="text-xs text-muted-foreground uppercase">Executing variation engine and search discovery...</p>
              </div>
            </div>
          )}

          {results && (
            <Card className="border-primary/50 shadow-2xl overflow-hidden bg-card/40 backdrop-blur-xl">
               <CardHeader className="bg-primary/5 border-b border-primary/20 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline text-primary">Intelligence Report</CardTitle>
                    <CardDescription>Discovery results for "{username}"</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary font-mono">
                    {results.total_found} Identified
                  </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px] w-full">
                  <div className="p-6 space-y-4">
                    {results.accounts.map((account, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-border/50 bg-background/30 hover:border-primary/50 transition-all group">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <p className="font-bold text-lg text-foreground uppercase tracking-tight">
                                 {account.platform}
                               </p>
                               {account.username_checked.toLowerCase() === username.toLowerCase() ? (
                                 <Badge className="bg-primary text-[10px] h-4 py-0">LITERAL MATCH</Badge>
                               ) : (
                                 <Badge variant="secondary" className="text-[10px] h-4 py-0">VARIATION: {account.username_checked}</Badge>
                               )}
                            </div>
                            <p className="text-xs font-mono text-muted-foreground truncate max-w-md">
                              {account.url}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
                          <p className="text-muted-foreground font-headline font-bold">No public accounts identified for "{username}"</p>
                          <p className="text-xs text-muted-foreground">Try searching for a different handle or nickname.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <Separator className="bg-primary/10" />
              <div className="p-4 bg-primary/5 text-center flex items-center justify-center gap-2">
                 <ShieldCheck className="size-4 text-primary" />
                 <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                   Data sourced via secure search engine reconnaissance
                 </p>
              </div>
            </Card>
          )}
        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
