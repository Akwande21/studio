
"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogInIcon, ShieldAlert, MessageSquareQuote, UserCircle, Mail, CalendarDays } from 'lucide-react';
import type { Suggestion as SuggestionTypeFromLib } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebaseConfig';
import { collection, query, orderBy, onSnapshot, Timestamp, DocumentData } from 'firebase/firestore';

interface SuggestionClient extends Omit<SuggestionTypeFromLib, 'timestamp'> {
  timestamp: string; // ISO string
}

export default function AdminSuggestionsPage() {
  const { isAuthenticated, loading: authLoading, user: adminUser } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<SuggestionClient[]>([]);
  const [pageLoading, setPageLoading] = useState(true); // Combined loading state for auth and data

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/signin');
      setPageLoading(false);
      return;
    }
    if (adminUser?.role !== 'Admin') {
      setPageLoading(false); // Not an admin, stop page loading, will show access denied
      return;
    }

    // Admin is authenticated, set up real-time listener for suggestions
    setPageLoading(true); // Start loading suggestions
    const suggestionsQuery = query(
      collection(db, "suggestions"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(suggestionsQuery, (querySnapshot) => {
      const fetchedSuggestions: SuggestionClient[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        fetchedSuggestions.push({
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as SuggestionClient);
      });
      setSuggestions(fetchedSuggestions);
      setPageLoading(false); // Suggestions loaded
    }, (error) => {
      console.error("Error fetching suggestions in real-time: ", error);
      // Optionally set an error state to display to the user
      setPageLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount

  }, [isAuthenticated, authLoading, adminUser, router]);


  if (authLoading || (pageLoading && suggestions.length === 0 && adminUser?.role === 'Admin') ) { // Show spinner if auth is loading OR page is loading initial data as admin
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!isAuthenticated) { // This case should be handled by the redirect in useEffect, but as a fallback
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
      <div className="mb-8 flex items-center gap-3">
        <MessageSquareQuote className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">User Suggestions</h1>
      </div>
      
      {suggestions.length > 0 ? (
        <div className="space-y-6">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-xl">{suggestion.subject}</CardTitle>
                    <Badge variant={suggestion.isRead ? "secondary" : "default"}>
                        {suggestion.isRead ? "Read" : "Unread"}
                    </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground pt-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                    {suggestion.name && (
                        <span className="flex items-center gap-1"><UserCircle className="h-3.5 w-3.5"/> {suggestion.name}</span>
                    )}
                    {suggestion.email && (
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5"/> {suggestion.email}</span>
                    )}
                     <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5"/> 
                        {formatDistanceToNow(new Date(suggestion.timestamp), { addSuffix: true })}
                     </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{suggestion.message}</p>
              </CardContent>
              {/* TODO: Add CardFooter for actions like "Mark as Read", "Delete" if needed in future */}
              {/* These actions would update the Firestore document */}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
            <CardContent>
                <MessageSquareQuote className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium text-foreground">No Suggestions Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    When users submit suggestions, they will appear here in real-time.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

