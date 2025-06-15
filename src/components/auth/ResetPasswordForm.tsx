
"use client";

import { useState, FormEvent, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { KeyRound, LogInIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleResetPassword } from '@/lib/actions'; // We'll create this action
import { useRouter } from 'next/navigation';

export function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both password fields are identical.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) { // Basic password length check
        toast({
            title: "Password Too Short",
            description: "Password must be at least 6 characters long.",
            variant: "destructive",
        });
        return;
    }

    startTransition(async () => {
      // In a real app, you'd also pass a reset token here
      const result = await handleResetPassword(newPassword);
      if (result.success) {
        toast({
          title: "Password Reset Successful",
          description: result.message,
        });
        setNewPassword('');
        setConfirmPassword('');
        router.push('/auth/signin'); // Redirect to sign-in page on success
      } else {
        toast({
          title: "Error Resetting Password",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <KeyRound className="mx-auto h-10 w-10 text-primary mb-3" />
        <CardTitle className="text-2xl font-headline">Set New Password</CardTitle>
        <CardDescription>Enter your new password below. Make sure it&apos;s secure.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="focus-visible:ring-primary"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="focus-visible:ring-primary"
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <LoadingSpinner size={20} className="mr-2"/> : <KeyRound className="mr-2 h-4 w-4" /> }
            Set New Password
          </Button>
          <p className="text-sm text-muted-foreground">
            Remembered your password or don&apos;t need to reset?{' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
