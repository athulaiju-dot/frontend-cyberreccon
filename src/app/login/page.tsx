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

    // Simple validation for sample credentials
    if (username === 'admin' && password === 'admin') {
      // In a real app, you'd set a session/token here
      router.push('/');
    } else {
      setError('Invalid username or password');
    }
  };

  const imageUrl = "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop";

  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${imageUrl})` }}
      data-ai-hint="cyber security city"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <Card className="mx-auto max-w-sm w-full z-10 bg-card/80">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
             <TerminalSquare className="size-8 text-primary" />
             <CardTitle className="text-3xl font-bold font-headline text-primary">CyberTrace</CardTitle>
          </div>
          <CardDescription>Enter your credentials to access your toolkit</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="admin"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full">
              <LogIn className="mr-2" /> Login
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline text-accent">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
