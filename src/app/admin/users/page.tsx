
"use client";
import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogInIcon, ShieldAlert, UsersIcon, Pencil } from 'lucide-react';
import type { User, UserRole } from '@/lib/types';
import { mockUsers } from '@/lib/data'; 
import { nonAdminRoles } from '@/lib/types';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from '@/hooks/use-toast';
import { handleUpdateUserDetails } from '@/lib/actions';

const editUserFormSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters.").max(50, "Full name must be 50 characters or less."),
  role: z.enum(nonAdminRoles).optional(), // Role is optional here as Admins roles are not changed by this form.
});
type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export default function AdminUsersPage() {
  const { isAuthenticated, loading: authLoading, user: adminUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else if (adminUser?.role !== 'Admin') {
        setPageLoading(false);
      } else {
        // Simulate fetching users (in a real app, this would be an API call)
        setUsers(mockUsers); 
        setPageLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, adminUser, router]);

  const openEditDialog = (userToEdit: User) => {
    setEditingUser(userToEdit);
    form.reset({
      name: userToEdit.name,
      role: userToEdit.role !== 'Admin' ? userToEdit.role : undefined, // only set role if not Admin
    });
    setIsEditDialogOpen(true);
  };

  const onEditFormSubmit = (values: EditUserFormValues) => {
    if (!editingUser) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('userId', editingUser.id);
      formData.append('name', values.name);
      // Only append role if the user is not an admin and role is provided
      if (editingUser.role !== 'Admin' && values.role) {
        formData.append('role', values.role);
      }
      
      const result = await handleUpdateUserDetails(formData);
      if (result.success && result.user) {
        toast({
          title: "User Updated",
          description: `${result.user.name}'s details have been updated.`,
        });
        setUsers(prevUsers => prevUsers.map(u => u.id === result.user!.id ? result.user! : u));
        setIsEditDialogOpen(false);
        setEditingUser(null);
      } else {
        toast({
          title: "Update Failed",
          description: result.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };


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
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(user)} disabled={isPending}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit User</span>
                        </Button>
                      </TableCell>
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

      {editingUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.name}</DialogTitle>
              <DialogDescription>
                Make changes to the user's profile. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onEditFormSubmit)} className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  {...form.register("name")} 
                  className="mt-1"
                  disabled={isPending}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              {editingUser.role !== 'Admin' && (
                 <div>
                  <Label htmlFor="role">Role</Label>
                   <Controller
                      name="role"
                      control={form.control}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isPending}
                        >
                          <SelectTrigger id="role" className="mt-1">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {nonAdminRoles.map((roleOption) => (
                              <SelectItem key={roleOption} value={roleOption}>
                                {roleOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  {form.formState.errors.role && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.role.message}</p>
                  )}
                </div>
              )}

              {editingUser.role === 'Admin' && (
                <div>
                  <Label htmlFor="role-admin">Role</Label>
                  <Input id="role-admin" value="Admin" readOnly disabled className="mt-1 bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">Admin role cannot be changed through this form.</p>
                </div>
              )}
             
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isPending}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <LoadingSpinner size={16} className="mr-2" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

