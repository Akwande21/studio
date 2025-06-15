
"use client";
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function ResetPasswordPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push('/'); // Redirect if already logged in
    }
  }, [isAuthenticated, loading, router]);

  // We don't show loading spinner here because this page is typically accessed
  // when not logged in. If a logged-in user somehow lands here, they'll be redirected.
  // If auth is still loading and they aren't authenticated yet, the form should be usable.

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <ResetPasswordForm />
    </div>
  );
}
