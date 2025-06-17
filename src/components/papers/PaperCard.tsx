
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Paper } from '@/lib/types';
import { BookmarkButton } from './BookmarkButton';
import { Star, CalendarDays, BookOpen, Download, GraduationCap } from 'lucide-react'; // Added GraduationCap
import { DownloadPaperButton } from './DownloadPaperButton';

interface PaperCardProps {
  paper: Paper;
}

export function PaperCard({ paper }: PaperCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-shadow duration-300 hover:shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <Link href={`/papers/${paper.id}`} className="group">
            <CardTitle className="text-lg md:text-xl font-headline group-hover:text-primary transition-colors">
              {paper.title}
            </CardTitle>
          </Link>
          <BookmarkButton paperId={paper.id} initialIsBookmarked={!!paper.isBookmarked} />
        </div>
        <CardDescription className="text-sm line-clamp-2">{paper.description || `A ${paper.subject} paper from ${paper.year}.`}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-4 w-4 text-accent" />
          <span>{paper.subject}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
          <Badge variant="outline">{paper.level}</Badge>
          {paper.level === "High School" && paper.grade && (
            <Badge variant="secondary" className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5"/> {paper.grade}
            </Badge>
          )}
          <span className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4 text-accent" /> {paper.year}
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> 
          <span>{paper.averageRating.toFixed(1)} ({paper.ratingsCount} ratings)</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4">
        <Button asChild variant="default" size="sm">
          <Link href={`/papers/${paper.id}`}>View Paper</Link>
        </Button>
        {paper.downloadUrl && <DownloadPaperButton paperName={paper.title} downloadUrl={paper.downloadUrl} />}
      </CardFooter>
    </Card>
  );
}
