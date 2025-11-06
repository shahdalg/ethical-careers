import { useState } from 'react';
import { addComment } from '@/lib/getComments';
import Button from './Button';

interface CommentProps {
  reviewId: string;
  onCommentAdded: () => void;
  comments: CommentData[];
}

export interface CommentData {
  id: string;
  reviewId: string;
  text: string;
  createdAt: any;
  userId: string;
}

export default function Comment({ reviewId, onCommentAdded, comments }: CommentProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment(reviewId, newComment);
      setNewComment('');
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Existing Comments */}
      <div className="space-y-2">
        {comments.map((comment) => (
          <div 
            key={comment.id} 
            className="bg-gray-50 p-3 rounded-lg text-sm"
          >
            <div className="flex justify-between items-start">
              <p className="text-gray-700">{comment.text}</p>
              <span className="text-xs text-gray-500">
                {comment.createdAt?.toDate().toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {comment.userId && (
              <p className="text-xs text-gray-500 mt-1">
                User #{comment.userId.slice(0, 6)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 border rounded-lg text-sm resize-none"
          rows={2}
        />
        <Button
          disabled={isSubmitting || !newComment.trim()}
          style={{ backgroundColor: "#3D348B" }}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>
    </div>
  );
}