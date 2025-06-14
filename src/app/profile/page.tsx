"use client";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import { UserCircle, Edit3, LogInIcon } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <LogInIcon className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-semibold mb-4 font-headline">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your profile.</p>
        <Button asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
            <AvatarImage src={user.avatarUrl || `https://placehold.co/150x150/64B5F6/FFFFFF?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="user avatar" />
            <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-headline">{user.name}</CardTitle>
          <CardDescription className="text-base">{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center">
              <UserCircle className="mr-2 h-5 w-5 text-primary" />
              Account Details
            </h3>
            <div className="p-4 bg-secondary rounded-md space-y-2 text-sm">
              <p><span className="font-medium text-foreground">Name:</span> {user.name}</p>
              <p><span className="font-medium text-foreground">Email:</span> {user.email}</p>
              <p><span className="font-medium text-foreground">Role:</span> <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{user.role} Student</span></p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="w-full" disabled> {/* TODO: Implement edit profile */}
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile (Coming Soon)
            </Button>
            <Button variant="destructive" onClick={signOut} className="w-full">
              Sign Out
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
