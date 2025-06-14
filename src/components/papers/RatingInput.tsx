"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleSubmitRating } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface RatingInputProps {
  paperId: string;
  currentAverageRating: number;
  currentRatingsCount: number;
  onRatingSubmitted: (newAverage: number, newCount: number) => void;
}

export function RatingInput({ paperId, currentAverageRating, currentRatingsCount, onRatingSubmitted }: RatingInputProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleRating = (ratingValue: number) => {
    if (!isAuthenticated || !user) {
      toast({ title: "Authentication Required", description: "Please sign in to rate papers.", variant: "destructive" });
      return;
    }
    setSelectedRating(ratingValue);
    startTransition(async () => {
      const result = await handleSubmitRating(paperId, user.id, ratingValue);
      if (result.success && result.averageRating !== undefined && result.ratingsCount !== undefined) {
        toast({ title: "Rating Submitted", description: `You rated this paper ${ratingValue} stars.` });
        onRatingSubmitted(result.averageRating, result.ratingsCount);
      } else {
        toast({ title: "Error", description: result.message || "Failed to submit rating.", variant: "destructive" });
        setSelectedRating(0); // Reset if failed
      }
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Your Rating:</p>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            variant="ghost"
            size="icon"
            className="p-1 h-auto w-auto"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => handleRating(star)}
            disabled={isPending || !isAuthenticated}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                (hoverRating >= star || selectedRating >= star)
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-muted-foreground"
              )}
            />
          </Button>
        ))}
      </div>
      {selectedRating > 0 && <p className="text-xs text-muted-foreground">You rated: {selectedRating} stars.</p>}
      {!isAuthenticated && <p className="text-xs text-destructive">Sign in to rate.</p>}
    </div>
  );
}
