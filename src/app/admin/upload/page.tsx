
"use client";
import { FileUploadForm } from '@/components/admin/FileUploadForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogInIcon, UploadCloud } from 'lucide-react';

export default function AdminUploadPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // In a real app, you'd also check for an admin role here.
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
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

  // Add a conceptual check for admin role, though not strictly enforced here
  // const isAdmin = user?.role === 'University'; // Example: Define what constitutes an admin
  // if (!isAdmin) {
  //   return (
  //     <div className="container mx-auto py-12 px-4 text-center">
  //       <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
  //       <p className="text-muted-foreground mb-6">You do not have permission to access this page.</p>
  //       <Button asChild><Link href="/">Go to Homepage</Link></Button>
  //     </div>
  //   );
  // }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-3">
        <UploadCloud className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Upload New Question Paper</h1>
      </div>
      <FileUploadForm />
    </div>
  );
}
