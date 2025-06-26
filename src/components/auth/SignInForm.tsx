"use client";
import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { LogIn } from 'lucide-react';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await signIn({ email, password }); 
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription className="text-sm sm:text-base">Sign in to your account to continue</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1 h-9 sm:h-10 focus-visible:ring-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Button variant="link" asChild className="p-0 h-auto text-xs sm:text-sm text-muted-foreground">
                  <Link href="/auth/forgot-password">Forgot password?</Link>
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1 h-9 sm:h-10 focus-visible:ring-primary"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-center p-4 sm:p-6 pt-0">
          <Button type="submit" className="w-full h-9 sm:h-10" disabled={loading}>
            {loading ? <LoadingSpinner size={16} className="mr-2"/> : <LogIn className="mr-2 h-4 w-4" /> }
            <span className="text-sm sm:text-base">Sign In</span>
          </Button>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary">
              <Link href="/auth/signup">Sign up</Link>
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}