"use client";
import { useEffect, useState } from 'react';
import { PaperCard } from '@/components/papers/PaperCard';
import { getBookmarkedPapers } from '@/lib/data';
import type { Paper } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookmarkCheck, Frown, LogInIcon } from 'lucide-react';

export default function BookmarksPage() {
  const [bookmarkedPapers, setBookmarkedPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to be determined

    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        // Pass user.id if your mock function needs it. For this example, it's generic.
        const papers = await getBookmarkedPapers(user.id);
        setBookmarkedPapers(papers);
      } catch (e) {
        setError("Failed to load bookmarked papers.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, [user, isAuthenticated, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={48} />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <LogInIcon className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-semibold mb-4 font-headline">Sign In Required</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your bookmarked papers.</p>
        <Button asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <Frown className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-3">
        <BookmarkCheck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Your Bookmarks</h1>
      </div>
      
      {bookmarkedPapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarkedPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
            <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-medium text-foreground">No Bookmarks Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Start exploring and bookmark papers for easy access later.
            </p>
            <Button asChild className="mt-6">
                <Link href="/">Find Papers</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
