import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface CompanySurveyStatus {
  preSubmitted: boolean;
  postSubmitted: boolean;
  firstVisitDate: string;
}

export interface UserSurveyData {
  companySurveys: Record<string, CompanySurveyStatus>;
  firstCompanyVisitDate: any;
  submittedGlobalPostSurvey?: boolean;
}

/**
 * Get user's survey data from Firestore
 */
export async function getUserSurveyData(userId: string): Promise<UserSurveyData | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    return {
      companySurveys: data.companySurveys || {},
      firstCompanyVisitDate: data.firstCompanyVisitDate || null,
      submittedGlobalPostSurvey: data.submittedGlobalPostSurvey || false,
    };
  } catch (error) {
    console.error("Error fetching user survey data:", error);
    return null;
  }
}

/**
 * Check if user needs to take pre-survey for a company
 */
export function needsPreSurvey(
  surveyData: UserSurveyData | null,
  companyName: string
): boolean {
  if (!surveyData) return true;
  
  const companySurvey = surveyData.companySurveys[companyName];
  return !companySurvey || !companySurvey.preSubmitted;
}

/**
 * Global post-survey logic: trigger once after firstCompanyVisitDate passes threshold
 * and user hasn't submitted the global post-survey.
 */
export function needsGlobalPostSurvey(
  surveyData: UserSurveyData | null
): boolean {
  if (!surveyData) return false;
  if (surveyData.submittedGlobalPostSurvey) return false;
  if (!surveyData.firstCompanyVisitDate) return false;

  // Handle Firestore Timestamp conversion
  let firstVisit: Date;
  if (surveyData.firstCompanyVisitDate.toDate) {
    // It's a Firestore Timestamp
    firstVisit = surveyData.firstCompanyVisitDate.toDate();
  } else if (surveyData.firstCompanyVisitDate.seconds) {
    // It's a Timestamp-like object with seconds
    firstVisit = new Date(surveyData.firstCompanyVisitDate.seconds * 1000);
  } else {
    // Try converting directly
    firstVisit = new Date(surveyData.firstCompanyVisitDate);
  }

  const now = new Date();
  const daysSince = (now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24);
  
  console.log('Global post-survey check:', {
    firstVisit: firstVisit.toISOString(),
    daysSince,
    threshold: 0.001,
    shouldShow: daysSince >= 0.001
  });
  
  return daysSince >= 0.001; // ~1.44 minutes for rapid testing (adjust to 7 for prod)
}

 
