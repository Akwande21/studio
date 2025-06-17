
"use client";

import type { Paper as PaperTypeWithTimestamp, Comment as CommentTypeWithTimestamp } from '@/lib/types';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseConfig'; 
import { collection, query, orderBy, onSnapshot, Timestamp, DocumentData } from "firebase/firestore";
import { QuestionItem } from './QuestionItem';
import { RatingInput } from './RatingInput';
import { CommentBox } from './CommentBox';
import { DownloadPaperButton } from './DownloadPaperButton';
import { BookmarkButton } from './BookmarkButton';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, BookOpen, Users, Star, FileText, GraduationCap } from 'lucide-react'; // Added GraduationCap
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

interface PaperClient extends Omit<PaperTypeWithTimestamp, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}
interface CommentClient extends Omit<CommentTypeWithTimestamp, 'timestamp'> {
  timestamp: string;
}


interface PaperDetailClientProps {
  paper: PaperClient; 
}

export function PaperDetailClient({ paper: initialPaper }: PaperDetailClientProps) {
  const { user } = useAuth();
  const [paper, setPaper] = useState<PaperClient>(initialPaper);
  const [comments, setComments] = useState<CommentClient[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isBookmarkedClient, setIsBookmarkedClient] = useState(false);


  useEffect(() => {
    if (user && paper.id) {
      setIsBookmarkedClient(user.bookmarkedPaperIds?.includes(paper.id) ?? false);
    } else {
      setIsBookmarkedClient(false);
    }
  }, [user, paper.id]);

  useEffect(() => {
    setPaper(initialPaper);
  }, [initialPaper]);
  
  useEffect(() => {
    if (!paper.id) return;
    setIsLoadingComments(true);
    const commentsQuery = query(
      collection(db, `papers/${paper.id}/comments`),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(commentsQuery, (querySnapshot) => {
      const fetchedComments: CommentClient[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        fetchedComments.push({
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as CommentClient);
      });
      setComments(fetchedComments);
      setIsLoadingComments(false);
    }, (error) => {
      console.error("Error fetching comments in real-time: ", error);
      setIsLoadingComments(false);
    });

    return () => unsubscribe(); 
  }, [paper.id]);

  const handleRatingSubmitted = (newAverage: number, newCount: number) => {
    setPaper(prevPaper => ({ ...prevPaper, averageRating: newAverage, ratingsCount: newCount }));
  };

  const handleBookmarkToggled = (newBookmarkStatus: boolean) => {
    setIsBookmarkedClient(newBookmarkStatus);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <article className="bg-card p-6 md:p-8 rounded-xl shadow-xl">
        <header className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
              {paper.title}
            </h1>
            <BookmarkButton 
                paperId={paper.id} 
                initialIsBookmarked={isBookmarkedClient} 
                size="lg" 
                onBookmarkToggled={handleBookmarkToggled} 
            />
          </div>
          {paper.description && <p className="text-lg text-muted-foreground mb-4">{paper.description}</p>}
          
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              <span>{paper.subject}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <Badge variant="secondary">{paper.level}</Badge>
            </div>
            {paper.level === "High School" && paper.grade && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-accent" />
                <Badge variant="outline" className="border-accent/50 text-accent">{paper.grade}</Badge>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-accent" />
              <span>{paper.year}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span>{paper.averageRating.toFixed(1)} ({paper.ratingsCount} ratings)</span>
            </div>
          </div>
          {paper.downloadUrl && <DownloadPaperButton paperName={paper.title} downloadUrl={paper.downloadUrl} />}
        </header>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Questions
          </h2>
          {paper.questions && paper.questions.length > 0 ? ( 
            paper.questions.map((q, index) => (
              <QuestionItem 
                key={q.id} 
                question={q} 
                index={index}
                paperLevel={paper.level}
                paperSubject={paper.subject}
              />
            ))
          ) : (
            <p className="text-muted-foreground">No questions available for this paper yet.</p>
          )}
        </section>

        <Separator className="my-8" />

        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold font-headline mb-3">Rate this Paper</h3>
            <RatingInput 
              paperId={paper.id} 
              currentAverageRating={paper.averageRating}
              currentRatingsCount={paper.ratingsCount}
              onRatingSubmitted={handleRatingSubmitted}
            />
          </div>
          <div className="md:col-span-2">
             {isLoadingComments && comments.length === 0 ? (
                <div>
                  <Skeleton className="h-8 w-1/3 mb-4" />
                  <Skeleton className="h-20 w-full mb-2" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <CommentBox paperId={paper.id} initialComments={comments} />
              )}
          </div>
        </section>
      </article>
    </div>
  );
}
