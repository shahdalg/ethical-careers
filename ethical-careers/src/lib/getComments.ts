import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface Comment {
  id: string;
  reviewId: string;
  text: string;
  createdAt: any;
  userId: string;
  authorEmail?: string;
}

// Fetch comments for a specific review
export async function getComments(reviewId: string): Promise<Comment[]> {
  try {
    const q = query(
      collection(db, "comments"),
      where("reviewId", "==", reviewId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

// Add a new comment
export async function addComment(reviewId: string, text: string) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to comment');
    }

    const comment = {
      reviewId,
      text: text.trim(),
      createdAt: Timestamp.now(),
      userId: currentUser.uid,
      authorId: currentUser.uid,
      authorEmail: currentUser.email
    };

    const docRef = await addDoc(collection(db, 'comments'), comment);
    return {
      id: docRef.id,
      ...comment
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}