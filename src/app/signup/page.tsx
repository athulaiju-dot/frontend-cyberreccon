'use client';

import Link from 'next/link';
import { TerminalSquare, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';

export default function SignupPage() {
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would handle user registration here
    alert('Sign up functionality not implemented yet.');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
           <div className="flex justify-center items-center gap-2 mb-4">
             <TerminalSquare className="size-8 text-primary" />
             <CardTitle className="text-3xl font-bold font-headline text-primary">CyberTrace</CardTitle>
          </div>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="hacker-ace" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              <UserPlus className="mr-2" /> Sign Up
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-accent">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
