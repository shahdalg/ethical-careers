import { db } from "./firebase";
import { collection, doc, setDoc, serverTimestamp, getDocs, query } from "firebase/firestore";

export async function addCompany(name: string, description: string, industry: string) {
  const slug = name.trim().toLowerCase().replace(/\s+/g, "-"); // e.g. "Google Inc" → "google-inc"
  const normalizedName = name.trim().toLowerCase();

  // Check if a company with similar name already exists
  const companiesRef = collection(db, "companies");
  const snapshot = await getDocs(query(companiesRef));
  
  const existingCompany = snapshot.docs.find(doc => {
    const companyData = doc.data();
    const existingNormalized = companyData.name.trim().toLowerCase();
    
    // Check for exact match or very similar names
    if (existingNormalized === normalizedName) {
      return true;
    }
    
    // Check if one name contains the other (e.g., "Google" vs "Google Inc")
    if (existingNormalized.includes(normalizedName) || normalizedName.includes(existingNormalized)) {
      return true;
    }
    
    return false;
  });

  if (existingCompany) {
    const existingData = existingCompany.data();
    throw new Error(`A company page already exists for "${existingData.name}". Please search for it instead of creating a duplicate.`);
  }

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
