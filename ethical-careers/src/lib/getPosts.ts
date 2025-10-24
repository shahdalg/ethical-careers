import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";

// Define what each post looks like
export type Post = {
  id: string;
  peopleText: string;
  peopleRating: string;
  peopleRecommend?: string;
  principlesText: string;
  principlesRating: string;
  principlesRecommend?: string;
  transparencyText: string;
  transparencyRating: string;
  transparencyRecommend?: string;
  createdAt?: any; // Firebase Timestamp
};

// Get posts from Firestore
export async function getPosts(): Promise<Post[]> {
  try {
    // query the "posts" collection, ordered by newest first
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    // map Firestore docs into JS objects
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}
