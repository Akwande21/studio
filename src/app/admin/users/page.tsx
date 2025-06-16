
"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogInIcon, ShieldAlert, UsersIcon } from 'lucide-react';
import type { User } from '@/lib/types';
import { mockUsers } from '@/lib/data'; // Direct import for mock data
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminUsersPage() {
  const { isAuthenticated, loading: authLoading, user: adminUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (adminUser?.role !== 'Admin') {
        // Let the render handle the access denied message
        setPageLoading(false);
      } else {
        // Simulate fetching users (in a real app, this would be an API call)
        setUsers(mockUsers);
        setPageLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, adminUser, router]);

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
     return (
      <div className="container mx-auto py-12 px-4 text-center">
        <LogInIcon className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-semibold mb-4 font-headline">Authentication Required</h1>
        <p className="text-muted-foreground mb-6">Please sign in to access this page.</p>
        <Button asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (adminUser?.role !== 'Admin') {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-4 font-headline text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to access this page. Admin role required.</p>
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Manage Users</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Registered Users List</CardTitle>
          <CardDescription>Overview of all users who have created an account.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>User ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40/64B5F6/FFFFFF?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="user avatar" />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'} className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{user.id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
