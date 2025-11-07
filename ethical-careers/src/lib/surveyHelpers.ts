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
 * Check if user should be prompted for post-survey
 * (7 days after first visit and hasn't submitted post-survey yet)
 */
export function needsPostSurvey(
  surveyData: UserSurveyData | null,
  companyName: string
): boolean {
  if (!surveyData) return false;

  const companySurvey = surveyData.companySurveys[companyName];
  if (!companySurvey) return false;

  // Must have submitted pre-survey
  if (!companySurvey.preSubmitted) return false;

  // Must not have already submitted post-survey
  if (companySurvey.postSubmitted) return false;

  // Check if 0.5 days (12 hours) have passed
  const firstVisit = new Date(companySurvey.firstVisitDate);
  const now = new Date();
  const daysSince = (now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24);

  return daysSince >= 0.5;
}

/**
 * Get list of companies that need post-survey
 */
export function getCompaniesNeedingPostSurvey(
  surveyData: UserSurveyData | null
): string[] {
  if (!surveyData || !surveyData.companySurveys) return [];

  const companiesNeedingPostSurvey: string[] = [];

  for (const [companyName, surveyStatus] of Object.entries(surveyData.companySurveys)) {
    if (needsPostSurvey(surveyData, companyName)) {
      companiesNeedingPostSurvey.push(companyName);
    }
  }

  return companiesNeedingPostSurvey;
}
