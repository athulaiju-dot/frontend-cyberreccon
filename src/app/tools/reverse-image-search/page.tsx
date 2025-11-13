"use client";

import { useState } from "react";
import { Image as ImageIcon, LoaderCircle, Upload } from "lucide-react";
import { ToolPageWrapper } from "@/components/ToolPageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";

const FileUploader = ({ onFileSelect, selectedFile, disabled }: { onFileSelect: (file: File) => void, selectedFile: File | null, disabled: boolean }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <label htmlFor="file-upload" className={`relative cursor-pointer w-full rounded-lg border-2 border-dashed border-border flex flex-col justify-center items-center h-48 transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-accent'}`}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="font-semibold text-accent">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF</p>
        </div>
        <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={disabled} />
      </label>
      {selectedFile && (
        <div className="text-sm text-muted-foreground">
          Selected file: <span className="font-medium text-primary">{selectedFile.name}</span>
        </div>
      )}
    </div>
  );
};


export default function ReverseImageSearchPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<object | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;

    setLoading(true);
    setResults(null);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setResults({
      "Source Image": imageFile.name,
      "Matches Found": 3,
      "Similar Images": {
        "Match 1": { "url": "https://picsum.photos/seed/101/800/600", "confidence": "98%", "source": "example.com" },
        "Match 2": { "url": "https://picsum.photos/seed/102/800/600", "confidence": "92%", "source": "another-site.net" },
        "Match 3": { "url": "https://picsum.photos/seed/103/800/600", "confidence": "85%", "source": "images-db.org" },
      },
    });
    setLoading(false);
  };
  
  return (
    <AppLayout>
      <ToolPageWrapper
        title="Reverse Image Search"
        description="Find the source and similar images across the web."
        icon={ImageIcon}
      >
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent>
                <FileUploader onFileSelect={setImageFile} selectedFile={imageFile} disabled={loading} />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading || !imageFile} className="w-full sm:w-auto ml-auto">
                  {loading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2" />
                  )}
                  Search
                </Button>
              </CardFooter>
            </form>
          </Card>

          {loading && (
            <div className="flex justify-center items-center gap-2 text-muted-foreground">
              <LoaderCircle className="animate-spin text-primary" />
              <span>Analyzing image pixels...</span>
            </div>
          )}
          
          {results && <ResultsDisplay results={results} />}

        </div>
      </ToolPageWrapper>
    </AppLayout>
  );
}

// Dummy input component to satisfy the uploader's label
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />;
