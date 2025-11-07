import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface CompanySurveyStatus {
  preSubmitted: boolean;
  postSubmitted: boolean;
  firstVisitDate: string;
}

export interface UserSurveyData {
  submittedInitialSurvey: boolean;
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
      submittedInitialSurvey: data.submittedInitialSurvey || false,
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

  const firstVisit = new Date(surveyData.firstCompanyVisitDate);
  const now = new Date();
  const daysSince = (now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= 0.001; // ~1.44 minutes for rapid testing (adjust to 7 for prod)
}
 
