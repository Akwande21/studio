
"use client";

import { useState, useTransition, FormEvent, useEffect } from 'react';
import type { Comment as CommentTypeFromLib } from '@/lib/types'; // This might have Timestamp type
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleAddComment } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageCircle } from 'lucide-react';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore'; // Import Firestore Timestamp

// Client-side Comment type where Timestamp is a string
interface CommentClient extends Omit<CommentTypeFromLib, 'timestamp' | 'id'> {
  id: string; // Ensure ID is always present
  timestamp: string; // ISO string
}

interface CommentBoxProps {
  paperId: string;
  initialComments: CommentClient[]; // Expecting comments with string timestamps
}

export function CommentBox({ paperId, initialComments }: CommentBoxProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentClient[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const submitCommentLogic = async () => {
    if (!newComment.trim() || !isAuthenticated || !user) {
      toast({
        title: "Cannot submit",
        description: "Comment is empty or you are not signed in.",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update
    const optimisticComment: CommentClient = {
      id: `temp-${Date.now()}`, // Temporary ID
      paperId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      userRole: user.role,
      text: newComment.trim(),
      timestamp: new Date().toISOString(), // Current time as ISO string
    };
    setComments(prevComments => [optimisticComment, ...prevComments]);
    const oldCommentText = newComment;
    setNewComment('');

    startTransition(async () => {
      try {
        const result = await handleAddComment(paperId, user.id, oldCommentText.trim());
        if (result.success && result.comment) {
          // Server action returns comment with string timestamp
          // The real-time listener in PaperDetailClient will update the list with the server-confirmed comment.
          // We can remove the optimistic one if its temp ID is still there, or rely on keys if ID matches.
          setComments(prev => prev.filter(c => c.id !== optimisticComment.id)); 
          // The new comment from server will be added by the onSnapshot listener in parent.
          toast({ title: "Comment Added", description: "Your comment has been posted." });
        } else {
          // Revert optimistic update on failure
          setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
          setNewComment(oldCommentText); // Restore text
          toast({ title: "Error", description: result.message || "Failed to add comment.", variant: "destructive" });
        }
      } catch (e) {
         // Revert optimistic update on unexpected error
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
        setNewComment(oldCommentText);
        toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      }
    });
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitCommentLogic();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold font-headline flex items-center">
        <MessageCircle className="mr-2 h-6 w-6 text-primary" />
        Discussion ({comments.length})
      </h3>

      <div className="space-y-4 pr-2 max-h-[500px] overflow-y-auto">
        {comments.length > 0 ? comments.map((comment) => {
          const isCurrentUser = user && user.id === comment.userId;
          return (
            <div 
              key={comment.id} 
              className={cn(
                "flex mb-3", 
                isCurrentUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] p-3 rounded-xl shadow-md",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-card text-card-foreground rounded-bl-none border"
                )}
              >
                {!isCurrentUser && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar className="h-6 w-6 border">
                      <AvatarImage 
                        src={comment.userAvatar || `https://placehold.co/60x60/4DB6AC/FFFFFF?text=${comment.userName.charAt(0)}`} 
                        alt={comment.userName} 
                        data-ai-hint="user avatar" 
                      />
                      <AvatarFallback className="text-xs">{comment.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold">{comment.userName}</p>
                      {comment.userRole && <p className="text-[10px] opacity-80 capitalize">{comment.userRole}</p>}
                    </div>
                  </div>
                )}
                 {isCurrentUser && (
                  <p className="text-xs font-semibold mb-1 text-primary-foreground/80">You</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                <p className={cn(
                  "text-xs mt-1.5 opacity-70", 
                  isCurrentUser ? "text-right text-primary-foreground/70" : "text-left"
                )}>
                  {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        }) : (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
      
      <form onSubmit={handleFormSubmit} className="flex items-start gap-2 mt-6 border-t pt-6">
        {user && (
            <Avatar className="h-9 w-9 border mt-0.5 flex-shrink-0">
                <AvatarImage src={user.avatarUrl || `https://placehold.co/60x60/64B5F6/FFFFFF?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="user avatar" />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
        )}
        {!user && (
             <Avatar className="h-9 w-9 border mt-0.5 flex-shrink-0">
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
        )}
        <Textarea
            placeholder={isAuthenticated ? "Write your message..." : "Sign in to post a message."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={1}
            className="flex-1 resize-none focus-visible:ring-primary min-h-[40px]"
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && isAuthenticated) {
                    e.preventDefault();
                    submitCommentLogic();
                }
            }}
            disabled={!isAuthenticated || isPending}
        />
        <Button 
            type="submit" 
            size="icon" 
            className="h-10 w-10 flex-shrink-0" 
            disabled={!isAuthenticated || isPending || !newComment.trim()}
            aria-label="Send message"
        >
            {isPending ? <LoadingSpinner size={20} /> : <Send className="h-5 w-5" />}
        </Button>
      </form>
      {!isAuthenticated && (
        <p className="text-sm text-muted-foreground text-center -mt-2">
            <Button variant="link" className="p-0 h-auto" asChild><Link href="/auth/signin">Sign in</Link></Button> to join the discussion.
        </p>
      )}
    </div>
  );
}

