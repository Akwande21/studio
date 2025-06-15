
"use client";
import { useState, FormEvent, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { MailQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleForgotPasswordRequest } from '@/lib/actions';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await handleForgotPasswordRequest(email);
      if (result.success) {
        toast({
          title: "Request Submitted",
          description: result.message,
        });
        setEmail(''); // Clear email field on success
      } else {
        toast({
          title: "Error",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <MailQuestion className="mx-auto h-10 w-10 text-primary mb-3" />
        <CardTitle className="text-2xl font-headline">Forgot Password?</CardTitle>
        <CardDescription>Enter your email address and we&apos;ll send you instructions to reset your password.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="focus-visible:ring-primary"
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <LoadingSpinner size={20} className="mr-2"/> : <MailQuestion className="mr-2 h-4 w-4" /> }
            Send Reset Instructions
          </Button>
          <p className="text-sm text-muted-foreground">
            Remember your password?{' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
