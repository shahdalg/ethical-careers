import { useState, useEffect } from 'react';
import Link from 'next/link';
import { addComment } from '@/lib/getComments';
import Button from './Button';
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc, deleteDoc } from "firebase/firestore";

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
  authorId?: string;
  authorEmail?: string;
  likes?: number;
  likedBy?: string[];
}

export default function Comment({ reviewId, onCommentAdded, comments }: CommentProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState(comments);
  const [pseudonymMap, setPseudonymMap] = useState<Record<string, string>>({}); // cache pseudonyms
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Update local comments when props change
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  // 🔹 Fetch pseudonyms for comment authors
  useEffect(() => {
    const fetchPseudonyms = async () => {
      const missingUserIds = comments
        .map((c) => c.userId)
        .filter((id) => id && !pseudonymMap[id]);

      if (missingUserIds.length === 0) return;

      const newMap: Record<string, string> = {};
      await Promise.all(
        missingUserIds.map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              newMap[uid] = data.pseudonym || "AnonymousUser";
            } else {
              newMap[uid] = "AnonymousUser";
            }
          } catch {
            newMap[uid] = "AnonymousUser";
          }
        })
      );

      setPseudonymMap((prev) => ({ ...prev, ...newMap }));
    };

    fetchPseudonyms();
  }, [comments]);

  const handleLikeComment = async (commentId: string, currentLikedBy: string[] = []) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Please sign in to like comments');
      return;
    }

    try {
      const commentRef = doc(db, "comments", commentId);
      const isLiked = currentLikedBy.includes(currentUser.uid);

      if (isLiked) {
        await updateDoc(commentRef, {
          likes: increment(-1),
          likedBy: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(commentRef, {
          likes: increment(1),
          likedBy: arrayUnion(currentUser.uid)
        });
      }

      setLocalComments(prev => prev.map(c => 
        c.id === commentId 
          ? {
              ...c,
              likes: (c.likes || 0) + (isLiked ? -1 : 1),
              likedBy: isLiked 
                ? (c.likedBy || []).filter(id => id !== currentUser.uid)
                : [...(c.likedBy || []), currentUser.uid]
            }
          : c
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Check with Perspective API first
      const moderationResponse = await fetch('/api/perspective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      });

      const moderationResult = await moderationResponse.json();

      if (!moderationResult.allowed) {
        setError(moderationResult.message || 'Your comment contains inappropriate content.');
        setIsSubmitting(false);
        return;
      }

      // If approved, add the comment
      await addComment(reviewId, newComment);
      setNewComment('');
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Please sign in to delete comments');
      return;
    }

    setDeletingId(commentId);
    try {
      await deleteDoc(doc(db, "comments", commentId));
      setLocalComments(prev => prev.filter(c => c.id !== commentId));
      onCommentAdded(); // Refresh parent component
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Existing Comments */}
      <div className="space-y-2">
        {localComments.map((comment) => (
          <div 
            key={comment.id} 
            className="bg-gray-50 p-3 rounded-lg text-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                {/* Pseudonym links to profile */}
                <Link
                  href={`/profile/${comment.userId}`}
                  className="font-semibold text-[#3D348B] hover:underline"
                >
                  {pseudonymMap[comment.userId] || "AnonymousUser"}
                </Link>
                <p className="text-gray-700 mt-1">{comment.text}</p>
              </div>
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

            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => handleLikeComment(comment.id, comment.likedBy)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  comment.likedBy?.includes(auth.currentUser?.uid || '')
                    ? 'bg-[#3D348B] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span>👍</span>
                <span>{comment.likes || 0}</span>
              </button>
              {auth.currentUser?.uid === comment.userId && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deletingId === comment.id}
                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                >
                  {deletingId === comment.id ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-2">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
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
