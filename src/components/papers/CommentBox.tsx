"use client";

import { useState, useTransition, FormEvent } from 'react';
import type { Comment as CommentType, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleAddComment } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageCircle } from 'lucide-react';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface CommentBoxProps {
  paperId: string;
  initialComments: CommentType[];
}

export function CommentBox({ paperId, initialComments }: CommentBoxProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated || !user) {
      toast({ title: "Cannot submit", description: "Comment is empty or you are not signed in.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await handleAddComment(paperId, user.id, newComment.trim());
      if (result.success && result.comment) {
        setComments(prevComments => [result.comment!, ...prevComments]);
        setNewComment('');
        toast({ title: "Comment Added", description: "Your comment has been posted." });
      } else {
        toast({ title: "Error", description: result.message || "Failed to add comment.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold font-headline flex items-center">
        <MessageCircle className="mr-2 h-6 w-6 text-primary" />
        Discussion ({comments.length})
      </h3>
      
      {isAuthenticated && user ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <Textarea
            placeholder="Write your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="focus-visible:ring-primary"
          />
          <Button type="submit" disabled={isPending || !newComment.trim()} className="w-full sm:w-auto">
            {isPending ? <LoadingSpinner size={20} className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
            Post Comment
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Button variant="link" className="p-0 h-auto" asChild><a href="/auth/signin">Sign in</a></Button> to join the discussion.
        </p>
      )}

      <div className="space-y-4">
        {comments.length > 0 ? comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3 p-4 bg-card rounded-lg shadow-sm">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={comment.userAvatar || `https://placehold.co/100x100/4DB6AC/FFFFFF?text=${comment.userName.charAt(0)}`} alt={comment.userName} data-ai-hint="user avatar" />
              <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{comment.userName} 
                  {comment.userRole && <span className="ml-2 text-xs font-normal text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">{comment.userRole}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                </p>
              </div>
              <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
            </div>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
    </div>
  );
}

