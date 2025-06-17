
"use client";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import { UserCircle, Edit3, LogInIcon, KeyRound, BookCopy } from 'lucide-react'; 
import { useState, useTransition, useEffect } from 'react';
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
import { nonAdminRoles, type UserRole, type Grade, grades } from '@/lib/types'; 

const editProfileFormSchema = z.object({
  role: z.enum(nonAdminRoles, { required_error: "Please select a role." }),
  grade: z.enum(grades).optional(),
}).superRefine((data, ctx) => {
  if (data.role === "High School" && !data.grade) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Grade is required for High School students.",
      path: ["grade"],
    });
  }
});
type EditProfileFormValues = z.infer<typeof editProfileFormSchema>;

export default function ProfilePage() {
  const { user, isAuthenticated, loading, signOut, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileFormSchema),
  });

  useEffect(() => {
    if (user && isEditDialogOpen) { 
      form.reset({
        role: user.role !== 'Admin' ? user.role as Exclude<UserRole, "Admin"> : undefined,
        grade: user.role === "High School" ? user.grade : undefined,
      });
    }
  }, [user, form, isEditDialogOpen]); 

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

  const onEditFormSubmit = (values: EditProfileFormValues) => {
    if (!user) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('name', user.name); // Name is not changed in this form, but action expects it.
      
      if (user.role !== 'Admin') {
        // For non-admins, always send the role from the form (values.role).
        // This ensures the server action's superRefine can check grade if role is High School.
        formData.append('role', values.role); 
        
        if (values.role === "High School" && values.grade) {
          formData.append('grade', values.grade);
        }
        // If values.role is not "High School", grade is not appended here.
        // The server action will handle clearing the grade if the role changes from High School.
      }
      // If user.role IS 'Admin', 'role' and 'grade' are not appended to formData from here.
      // The server action's schema has role/grade as optional, and server logic prevents Admin role change.
      
      const result = await handleUpdateUserDetails(formData);
      if (result.success && result.user) {
        toast({
          title: "Profile Updated",
          description: `Your profile has been updated.`,
        });
        await refreshUserProfile(); 
        setIsEditDialogOpen(false);
      } else {
        toast({
          title: "Update Failed",
          description: result.message || (result.errors ? JSON.stringify(result.errors) : "An unknown error occurred."),
          variant: "destructive",
        });
      }
    });
  };
  
  const selectedRoleForDialog = form.watch("role");

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
              <p><span className="font-medium text-foreground">Role:</span> <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{user.role}</span></p>
              {user.role === "High School" && user.grade && (
                <p><span className="font-medium text-foreground">Grade:</span> <span className="capitalize bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs">{user.grade}</span></p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="w-full" onClick={() => setIsEditDialogOpen(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Change Role / Grade
            </Button>
            <Button variant="destructive" onClick={signOut} className="w-full">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {user && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
            setIsEditDialogOpen(isOpen);
            if (!isOpen) form.reset(); // Reset form on close
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change Your Role / Grade</DialogTitle>
              <DialogDescription>
                Select your new role. Admins cannot change their role. High School students can also update their grade.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onEditFormSubmit)} className="space-y-4 py-4">
              <div>
                <Label htmlFor="current-name">Full Name (Read-only)</Label>
                <Input 
                  id="current-name" 
                  value={user.name} 
                  readOnly 
                  className="mt-1 bg-muted"
                />
              </div>
               <div>
                <Label htmlFor="current-email">Email (Read-only)</Label>
                <Input 
                  id="current-email" 
                  value={user.email} 
                  readOnly 
                  className="mt-1 bg-muted"
                />
              </div>
              
              {user.role !== 'Admin' && (
                 <>
                    <div>
                        <Label htmlFor="role">New Role</Label>
                        <Controller
                            name="role"
                            control={form.control}
                            // defaultValue is set by form.reset in useEffect
                            render={({ field }) => (
                                <Select 
                                onValueChange={(value) => {
                                    field.onChange(value as Exclude<UserRole, "Admin">);
                                    if (value !== "High School") {
                                        form.setValue("grade", undefined, { shouldValidate: true }); 
                                    } else {
                                        // If changing TO High School, prefill with current grade if it exists, or leave for user to select
                                        const currentGradeIfHighSchool = user.role === "High School" ? user.grade : undefined;
                                        form.setValue("grade", currentGradeIfHighSchool , { shouldValidate: true });
                                    }
                                }}
                                value={field.value || ""} // Ensure value is not undefined for Select
                                disabled={isPending || user.role === 'Admin'}
                                >
                                <SelectTrigger id="role" className="mt-1">
                                    <SelectValue placeholder="Select new role" />
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
                    {selectedRoleForDialog === "High School" && (
                         <div>
                            <Label htmlFor="grade">Grade</Label>
                            <Controller
                                name="grade"
                                control={form.control}
                                // defaultValue is set by form.reset in useEffect
                                render={({ field }) => (
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value || ""} // Ensure value is not undefined
                                        disabled={isPending}
                                    >
                                    <SelectTrigger id="grade" className="mt-1">
                                        <SelectValue placeholder="Select grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {grades.map((gradeOption) => (
                                        <SelectItem key={gradeOption} value={gradeOption}>
                                            {gradeOption}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                )}
                            />
                            {form.formState.errors.grade && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.grade.message}</p>
                            )}
                        </div>
                    )}
                 </>
              )}

              {user.role === 'Admin' && (
                <div>
                  <Label htmlFor="role-admin">Role</Label>
                  <Input id="role-admin" value="Admin" readOnly disabled className="mt-1 bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">Admin role cannot be changed.</p>
                </div>
              )}
             
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isPending} onClick={() => { setIsEditDialogOpen(false); form.reset();}}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending || user.role === 'Admin'}>
                  {isPending ? <LoadingSpinner size={16} className="mr-2" /> : <KeyRound className="mr-2 h-4 w-4"/>}
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
