# Survey System Documentation

## Overview
The platform implements a three-stage survey system to track how user perspectives change:

1. **Initial Survey** - Completed during signup
2. **Pre-Company Survey** - Required before viewing any company's reviews
3. **Post-Company Survey** - Prompted 7 days after viewing a company

## Database Structure

### User Profile Fields (`users` collection)
```typescript
{
  submittedInitialSurvey: boolean,
  companySurveys: {
    [companyName]: {
      preSubmitted: boolean,
      postSubmitted: boolean,
      firstVisitDate: string (ISO date)
    }
  },
  firstCompanyVisitDate: Timestamp
}
```

### Survey Response Collections

#### `signupSurvey/{userId}`
Initial survey completed during account creation.

#### `companySurveys/{userId}_{companyName}_pre`
Pre-company survey responses:
- expectedEthicalBehavior (1-5)
- trustworthiness (1-5)
- willingnessToWork (1-5)

#### `companySurveys/{userId}_{companyName}_post`
Post-company survey responses (7 days after):
- changedPerception (1-5)
- currentTrustworthiness (1-5)
- currentWillingnessToWork (1-5)
- impactedDecision (yes/no)

## Flow

### 1. User Signs Up
- Creates account
- Completes initial survey (existing 6 questions)
- `submittedInitialSurvey` set to `true`

### 2. User Visits Company Page
- **First time visiting ANY company:**
  - Pre-survey modal blocks content
  - After completion:
    - Survey saved to `companySurveys/{userId}_{companyName}_pre`
    - `companySurveys[companyName].preSubmitted = true`
    - `companySurveys[companyName].firstVisitDate` recorded
    - `firstCompanyVisitDate` set (if first company ever)
  - Content becomes visible

- **Subsequent visits to same company:**
  - No pre-survey required
  - Content visible immediately

### 3. Seven Days Later
- System checks if 7 days have passed since `firstVisitDate`
- If user hasn't completed post-survey (`postSubmitted = false`):
  - Post-survey modal appears
  - Can be dismissed ("Remind Me Later")
  - After completion: `companySurveys[companyName].postSubmitted = true`

## Components

### `PreCompanySurveyModal.tsx`
- Blocks company page access
- 3 questions about expectations before viewing reviews
- Cannot be dismissed (required)

### `PostCompanySurveyModal.tsx`
- Appears 7 days after first visit
- 4 questions about changed perspectives
- Can be dismissed and will reappear

### `PostSurveyChecker.tsx`
- Optional component to check for pending post-surveys
- Can be added to layout or profile page
- Shows queue of companies needing post-surveys

## Helper Functions (`surveyHelpers.ts`)

- `getUserSurveyData(userId)` - Fetch user's survey tracking data
- `needsPreSurvey(surveyData, companyName)` - Check if pre-survey required
- `needsPostSurvey(surveyData, companyName)` - Check if post-survey due (7 days)
- `getCompaniesNeedingPostSurvey(surveyData)` - Get list of companies with pending post-surveys

## Usage Example

```typescript
// In company page
const surveyData = await getUserSurveyData(userId);

if (needsPreSurvey(surveyData, companyName)) {
  // Show pre-survey modal
}

if (needsPostSurvey(surveyData, companyName)) {
  // Show post-survey modal
}
```

## Customization

### Adding Questions
Edit the modal components:
- `PreCompanySurveyModal.tsx` - Add more `q4`, `q5`, etc. states
- `PostCompanySurveyModal.tsx` - Same approach
- Update Firestore document structure in `handleSubmit`

### Changing 7-Day Period
In `surveyHelpers.ts`, modify:
```typescript
const daysSince = (now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24);
return daysSince >= 7; // Change this number
```

## Security Notes
- All survey submissions use Firebase Authentication
- User must be logged in to view company pages
- Survey responses tied to userId for analysis
- Pre-survey is REQUIRED (cannot be bypassed)
- Post-survey is optional but persistent (will keep prompting)
