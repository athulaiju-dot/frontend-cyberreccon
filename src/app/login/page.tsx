'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TerminalSquare, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Credentials requested by user: admin / admin
    if (username === 'admin' && password === 'admin') {
      router.push('/');
    } else {
      setError('Invalid operator ID or access key');
    }
  };

  const imageUrl = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop";

  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-cover bg-center relative overflow-hidden"
      style={{ backgroundImage: `url(${imageUrl})` }}
      data-ai-hint="matrix code"
    >
      {/* Dark overlay for better contrast and depth */}
      <div className="absolute inset-0 bg-black/70 z-0" />
      
      {/* Decorative scanning line effect */}
      <div className="absolute inset-0 pointer-events-none z-1 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-20 w-full animate-[scan_4s_linear_infinite]" style={{ top: '-10%' }} />

      <Card className="mx-auto max-w-sm w-full z-10 bg-black/40 backdrop-blur-2xl border-primary/20 shadow-[0_0_50px_rgba(0,255,0,0.1)]">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center items-center gap-3 mb-4">
             <TerminalSquare className="size-10 text-primary animate-pulse" />
             <CardTitle className="text-4xl font-bold font-headline text-primary uppercase tracking-tighter">CyberRecon</CardTitle>
          </div>
          <CardDescription className="text-primary/60 font-mono text-xs uppercase tracking-widest font-bold">Secure Terminal Access</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-primary/80 font-mono text-[10px] uppercase tracking-widest">Operator ID</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/60 border-primary/30 text-primary placeholder:text-primary/20 focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-primary/80 font-mono text-[10px] uppercase tracking-widest">Access Key</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="admin"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/60 border-primary/30 text-primary placeholder:text-primary/20 focus:border-primary/60 focus:ring-1 focus:ring-primary/40 font-mono"
              />
            </div>
            {error && (
              <p className="text-[10px] text-destructive text-center font-bold uppercase tracking-widest animate-pulse border border-destructive/20 py-1 rounded">
                [ACCESS DENIED]: {error}
              </p>
            )}
            <Button type="submit" className="w-full shadow-lg shadow-primary/20 font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/80 transition-all h-11">
              <LogIn className="mr-2 size-4" /> Authenticate
            </Button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-[9px] text-primary/40 uppercase tracking-[0.2em] leading-relaxed">
              Proprietary OSINT Architecture<br />
              Unauthorized access is tracked and prosecuted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
