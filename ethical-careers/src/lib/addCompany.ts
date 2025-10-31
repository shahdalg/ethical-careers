import { db } from "./firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function addCompany(name: string, description: string, industry: string) {
  const slug = name.trim().toLowerCase().replace(/\s+/g, "-"); // e.g. "Google Inc" → "google-inc"

  const companyRef = doc(collection(db, "companies"), slug);
  await setDoc(companyRef, {
    name,
    slug,
    description,
    industry,
    createdAt: serverTimestamp(),
  });

  return slug;
}
