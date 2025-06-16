
"use client";
import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/types';
import { userRoles } from '@/lib/types';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { UserPlus } from 'lucide-react';

export function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const { signUp, loading } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!role) {
        alert("Please select a role.");
        return;
    }
    // The password here is for the form field but not strictly used by the mock signUp
    await signUp({ name, email, role });
  };

  // Filter out 'Admin' role for selection
  const selectableRoles = userRoles.filter(r => r !== 'Admin');

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
        <CardDescription>Join PaperVault to enhance your studies.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="focus-visible:ring-primary"
            />
          </div>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">I am a...</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)} required>
              <SelectTrigger id="role" className="focus-visible:ring-primary">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {selectableRoles.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {/* 'Admin' role is filtered out, so this ternary is effectively for student roles */}
                    {lvl === 'Admin' ? 'Admin' : `${lvl} Student`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading || !role}>
            {loading ? <LoadingSpinner size={20} className="mr-2"/> : <UserPlus className="mr-2 h-4 w-4" /> }
            Sign Up
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
