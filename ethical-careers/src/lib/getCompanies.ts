 import { db } from "./firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export type Company = {
  id: string;
  name: string;
  slug: string;
  description: string;
  industry: string;
  createdAt?: any;
};

export async function getCompanies(): Promise<Company[]> {
  const q = query(collection(db, "companies"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Company[];
}
