"use client";

import { useState } from "react";
import { Image as ImageIcon, LoaderCircle, Upload, Search, Link as LinkIcon, ShieldCheck, Fingerprint, ExternalLink, Globe } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";
import { searchByImage, type ReverseImageResult } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const FileUploader = ({ onFileSelect, preview, disabled }: { onFileSelect: (file: File) => void, preview: string | null, disabled: boolean }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <label 
        htmlFor="file-upload" 
        className={`relative cursor-pointer w-full rounded-xl border-2 border-dashed border-primary/30 flex flex-col justify-center items-center h-64 transition-all overflow-hidden ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:bg-primary/5'}`}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <Image src={preview} alt="Preview" fill className="object-contain p-4" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
               <p className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
                 <Upload className="size-5" /> Change Image
               </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-12 h-12 mb-4 text-primary animate-bounce" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-bold text-primary text-lg">UPLOAD IMAGE</span>
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-tighter">Drag and drop or click to browse</p>
          </div>
        )}
        <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={disabled} />
      </label>
    </div>
  );
};

export default function ReverseImageSearchPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ReverseImageResult | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setResults(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;

    setLoading(true);
    setResults(null);
    
    try {
      const data = await searchByImage(preview);
      setResults(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Recon Failure",
        description: error.message || "Visual analysis engine timed out.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openGlobalSearch = () => {
    if (results?.searchKeywords) {
      const url = `https://www.google.com/search?q=${encodeURIComponent(results.searchKeywords)}&tbm=isch`;
      window.open(url, "_blank");
    }
  };
  
  return (
    <AppLayout>
      <ToolPageWrapper
        title="Visual Intelligence"
        description="Extract perceptual hashes and trace image origins across global web sources."
        icon={ImageIcon}
      >
        <div className="space-y-8">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Target Image</CardTitle>
              <CardDescription>Upload a JPG/PNG to calculate fingerprint and trace sources.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent>
                <FileUploader onFileSelect={handleFileSelect} preview={preview} disabled={loading} />
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t border-border/50 pt-6">
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                  {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : "No file selected"}
                </div>
                <Button type="submit" disabled={loading || !imageFile} className="px-8 shadow-lg shadow-primary/20">
                  {loading ? (
                    <LoaderCircle className="animate-spin size-5" />
                  ) : (
                    <><Search className="mr-2 size-5" /> Execute Trace</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoaderCircle className="animate-spin size-12 text-primary" />
              <div className="text-center">
                <p className="font-headline font-bold text-lg text-primary uppercase tracking-widest">Calculating Perceptual Hash</p>
                <p className="text-xs text-muted-foreground uppercase">Analyzing pixel distribution and tracing sources...</p>
              </div>
            </div>
          )}
          
          {results && (
            <div className="space-y-6">
              {/* IMAGE FINGERPRINT */}
              <Card className="border-primary bg-primary/5 overflow-hidden">
                <CardHeader className="py-4 border-b border-primary/20">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="size-6 text-primary" />
                    <CardTitle className="text-lg font-headline text-primary">Image Fingerprint</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Calculated dHash</p>
                        <p className="text-2xl font-mono font-bold text-primary tracking-widest">{results.hash}</p>
                     </div>
                     <Badge variant="outline" className="border-primary text-primary">64-bit Hash</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* INTELLIGENCE REPORT */}
              <Card className="bg-card/30 backdrop-blur-xl border-border/50 overflow-hidden shadow-2xl">
                <CardHeader className="bg-muted/30 border-b border-border/50 flex flex-row items-center justify-between">
                  <CardTitle className="font-headline text-lg">Visual Reconnaissance Report</CardTitle>
                  <Button onClick={openGlobalSearch} size="sm" variant="default" className="shadow-lg shadow-primary/10">
                    <Globe className="mr-2 size-4" /> Global Search
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">AI Technical Analysis</p>
                    <p className="text-sm leading-relaxed text-foreground">{results.analysis}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Recommended Search Query</p>
                    <div className="p-3 rounded-lg bg-background/50 border border-primary/20 font-mono text-sm text-primary">
                        {results.searchKeywords}
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                      <LinkIcon className="size-3" /> Targeted Social Platforms
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      {results.matches.map((match, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-muted/30 border border-border/50 flex flex-col sm:flex-row justify-between gap-4 group hover:border-primary/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <p className="font-bold text-foreground text-lg">{match.platform}</p>
                               <Badge className="bg-primary/20 text-primary text-[10px] h-4 py-0">VERIFIED DOMAIN</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{match.description}</p>
                            <a 
                              href={match.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-accent hover:underline flex items-center gap-1 mt-2"
                            >
                              <LinkIcon className="size-3" /> {match.url}
                            </a>
                          </div>
                          <Button variant="outline" size="sm" asChild className="shrink-0">
                            <a href={match.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 size-3" /> Open Platform
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-primary/5 border-t border-primary/10 p-4">
                   <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase w-full justify-center">
                     <ShieldCheck className="size-3" /> Deep pixel analysis complete
                   </div>
                </CardFooter>
              </Card>
            </div>
          )}

        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}
