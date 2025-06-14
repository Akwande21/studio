"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleToggleBookmark } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  paperId: string;
  initialIsBookmarked: boolean;
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function BookmarkButton({ paperId, initialIsBookmarked, size = "icon", className, showText = false }: BookmarkButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "Authentication Required", description: "Please sign in to bookmark papers.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await handleToggleBookmark(paperId, user.id);
      if (result.success) {
        setIsBookmarked(result.isBookmarked!);
        toast({
          title: result.isBookmarked ? "Bookmarked!" : "Bookmark Removed",
          description: `Paper ${result.isBookmarked ? "added to" : "removed from"} your bookmarks.`,
        });
      } else {
        toast({ title: "Error", description: result.message || "Failed to update bookmark.", variant: "destructive" });
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={isPending || !isAuthenticated}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      className={cn("p-2", className)}
    >
      <Bookmark className={cn("h-5 w-5", isBookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
      {showText && <span className="ml-2">{isBookmarked ? "Bookmarked" : "Bookmark"}</span>}
    </Button>
  );
}
