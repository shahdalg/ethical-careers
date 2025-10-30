import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";

export async function getCompanyPosts(company: string) {
  try {
    const q = query(
      collection(db, "posts"),
      where("company", "==", company),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching company posts:", error);
    return [];
  }
}
