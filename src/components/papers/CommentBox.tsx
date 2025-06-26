
"use client";

import { useState, useTransition, FormEvent, useEffect, useRef } from 'react';
import type { Comment as CommentTypeFromLib } from '@/lib/types'; // This might have Timestamp type
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleAddComment } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageCircle, AtSign } from 'lucide-react';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore'; // Import Firestore Timestamp
import { Badge } from '@/components/ui/badge';

// Client-side Comment type where Timestamp is a string
interface CommentClient extends Omit<CommentTypeFromLib, 'timestamp' | 'id'> {
  id: string; // Ensure ID is always present
  timestamp: string; // ISO string
}

interface CommentBoxProps {
  paperId: string;
  initialComments: CommentClient[]; // Expecting comments with string timestamps
}

interface MentionSuggestion {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

function MentionDropdown({ 
  suggestions, 
  onSelect, 
  isVisible, 
  position 
}: {
  suggestions: MentionSuggestion[];
  onSelect: (user: MentionSuggestion) => void;
  isVisible: boolean;
  position: { top: number; left: number };
}) {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div 
      className="absolute z-50 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-[200px]"
      style={{ top: position.top, left: position.left }}
    >
      {suggestions.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
          onClick={() => onSelect(user)}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage 
              src={user.avatar || `https://placehold.co/60x60/4DB6AC/FFFFFF?text=${user.name.charAt(0)}`} 
              alt={user.name} 
            />
            <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{user.name}</p>
            {user.role && <p className="text-xs text-muted-foreground capitalize">{user.role}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommentBox({ paperId, initialComments }: CommentBoxProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentClient[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isPending, startTransition] = useTransition();
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Extract unique users from comments for mention suggestions
  const availableUsers = comments.reduce((users, comment) => {
    const existingUser = users.find(u => u.id === comment.userId);
    if (!existingUser && comment.userId !== user?.id) {
      users.push({
        id: comment.userId,
        name: comment.userName,
        avatar: comment.userAvatar,
        role: comment.userRole
      });
    }
    return users;
  }, [] as MentionSuggestion[]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setNewComment(value);
    setCursorPosition(position);

    // Check for @ mentions
    const textBeforeCursor = value.substring(0, position);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const searchTerm = mentionMatch[1].toLowerCase();
      const filteredUsers = availableUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm)
      );
      
      if (filteredUsers.length > 0) {
        setMentionSuggestions(filteredUsers);
        setShowMentions(true);
        
        // Calculate position for dropdown
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          setMentionPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX
          });
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (mentionedUser: MentionSuggestion) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
      const newText = `${beforeMention}@${mentionedUser.name} ${textAfterCursor}`;
      setNewComment(newText);
      setShowMentions(false);
      
      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeMention.length + mentionedUser.name.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const renderCommentText = (text: string) => {
    // Replace @mentions with highlighted text
    const mentionRegex = /@(\w+)/g;
    const parts = text.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention (odd indices after split)
        const mentionedUser = availableUsers.find(u => u.name === part) || 
                             comments.find(c => c.userName === part);
        if (mentionedUser) {
          return (
            <Badge key={index} variant="secondary" className="mx-1 inline-flex items-center gap-1">
              <AtSign className="h-3 w-3" />
              {part}
            </Badge>
          );
        }
        return `@${part}`;
      }
      return part;
    });
  };

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
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold font-headline flex items-center">
          <MessageCircle className="mr-2 h-6 w-6 text-primary" />
          Discussion ({comments.length} {comments.length === 1 ? 'comment' : 'comments'})
        </h3>
        {availableUsers.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <AtSign className="h-4 w-4" />
            <span>Use @ to mention users</span>
          </div>
        )}
      </div>

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
                <div className="text-sm whitespace-pre-wrap break-words">
                  {renderCommentText(comment.text)}
                </div>
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
        <div className="flex-1 relative">
          <Textarea
              ref={textareaRef}
              placeholder={isAuthenticated ? "Write your message... (use @ to mention users)" : "Sign in to post a message."}
              value={newComment}
              onChange={handleTextareaChange}
              rows={1}
              className="w-full resize-none focus-visible:ring-primary min-h-[40px]"
              onKeyDown={(e) => {
                  if (showMentions && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
                      e.preventDefault();
                      if (e.key === 'Enter' && mentionSuggestions.length > 0) {
                          handleMentionSelect(mentionSuggestions[0]);
                      }
                      return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey && isAuthenticated && !showMentions) {
                      e.preventDefault();
                      submitCommentLogic();
                  }
                  if (e.key === 'Escape') {
                      setShowMentions(false);
                  }
              }}
              disabled={!isAuthenticated || isPending}
          />
          <MentionDropdown
              suggestions={mentionSuggestions}
              onSelect={handleMentionSelect}
              isVisible={showMentions}
              position={mentionPosition}
          />
        </div>
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

