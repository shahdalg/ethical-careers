import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";

export type Post = {
  id: string;
  company?: string;
  selfIdentify?: string;
  peopleText: string;
  peopleRating: string;
  planetText: string;
  planetRating: string;
  transparencyText: string;
  transparencyRating: string;
  recommend?: string;
  references?: string;
  createdAt?: any;
};

export async function getPosts(): Promise<Post[]> {
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

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
