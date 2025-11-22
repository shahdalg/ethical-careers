import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface CompanySurveyStatus {
  preSubmitted: boolean;
  postSubmitted: boolean;
  firstVisitDate: string;
}

export interface UserSurveyData {
  companySurveys: Record<string, CompanySurveyStatus>;
  signupDate: any;
  submittedGlobalPostSurvey?: boolean;
  submittedInitialSurvey?: boolean;
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
      signupDate: data.signupDate || null,
      submittedGlobalPostSurvey: data.submittedGlobalPostSurvey || false,
      submittedInitialSurvey: data.submittedInitialSurvey || false,
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
 * Global post-survey logic: trigger once after signupDate passes threshold
 * and user hasn't submitted the global post-survey.
 */
export function needsGlobalPostSurvey(
  surveyData: UserSurveyData | null
): boolean {
  if (!surveyData) return false;
  if (surveyData.submittedGlobalPostSurvey) return false;
  if (!surveyData.signupDate) return false;

  // Handle Firestore Timestamp conversion
  let signupTime: Date;
  if (surveyData.signupDate.toDate) {
    // It's a Firestore Timestamp
    signupTime = surveyData.signupDate.toDate();
  } else if (surveyData.signupDate.seconds) {
    // It's a Timestamp-like object with seconds
    signupTime = new Date(surveyData.signupDate.seconds * 1000);
  } else {
    // Try converting directly
    signupTime = new Date(surveyData.signupDate);
  }

  const now = new Date();
  const daysSince = (now.getTime() - signupTime.getTime()) / (1000 * 60 * 60 * 24);
  
  console.log('Global post-survey check:', {
    signupTime: signupTime.toISOString(),
    daysSince,
    threshold: 7,
    shouldShow: daysSince >= 7
  });
  
  return daysSince >= 7;
}

 
