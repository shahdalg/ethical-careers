"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserSurveyData, getCompaniesNeedingPostSurvey } from "@/lib/surveyHelpers";
import PostCompanySurveyModal from "./PostCompanySurveyModal";

/**
 * This component checks if user has any pending post-surveys
 * and shows them a prompt. Can be placed in layout or profile page.
 */
export default function PostSurveyChecker() {
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingCompanies, setPendingCompanies] = useState<string[]>([]);
  const [currentCompany, setCurrentCompany] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        
        // Check for pending post-surveys
        const surveyData = await getUserSurveyData(user.uid);
        const pending = getCompaniesNeedingPostSurvey(surveyData);
        
        if (pending.length > 0) {
          setPendingCompanies(pending);
          // Show the first one
          setCurrentCompany(pending[0]);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleComplete = () => {
    // Remove current company from pending list
    const remaining = pendingCompanies.filter(c => c !== currentCompany);
    setPendingCompanies(remaining);
    
    // Show next company if available
    if (remaining.length > 0) {
      setCurrentCompany(remaining[0]);
    } else {
      setCurrentCompany(null);
    }
  };

  const handleDismiss = () => {
    // Just hide for now, will show again next time
    setCurrentCompany(null);
  };

  if (!currentCompany || !userId) return null;

  return (
    <PostCompanySurveyModal
      userId={userId}
      companyName={currentCompany}
      onComplete={handleComplete}
      onDismiss={handleDismiss}
    />
  );
}
