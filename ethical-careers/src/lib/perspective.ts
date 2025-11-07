/**
 * perspective.ts — with built-in moderation thresholds
 * -----------------------------------------------
 * This version adds a toxicity threshold check and returns both
 * the raw API scores and a boolean `isAcceptable` flag.
 */

const PERSPECTIVE_API_KEY: string | undefined = process.env.PERSPECTIVE_API_KEY;

interface PerspectiveRequest {
  comment: { text: string };
  requestedAttributes: {
    TOXICITY?: {};
    SEVERE_TOXICITY?: {};
    IDENTITY_ATTACK?: {};
    INSULT?: {};
    PROFANITY?: {};
    THREAT?: {};
  };
}

interface AttributeScore {
  summaryScore: {
    value: number;
    type: string;
  };
}

interface PerspectiveResponse {
  attributeScores: {
    [attribute: string]: AttributeScore;
  };
}

/**
 * Calls the Perspective API and returns both the response and
 * a boolean indicating if the text passes moderation.
 */
export async function analyzeTextWithPerspective(
  text: string
): Promise<{
  result: PerspectiveResponse | null;
  isAcceptable: boolean;
}> {
  if (!PERSPECTIVE_API_KEY) {
    console.error("❌ Missing Perspective API Key in environment variables.");
    return { result: null, isAcceptable: true }; // fail open — don't block everything
  }

  const API_ENDPOINT = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`;

  const requestBody: PerspectiveRequest = {
    comment: { text },
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {},
    },
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("❌ Perspective API failed:", err);
      return { result: null, isAcceptable: true }; // don't block due to API failure
    }

    const data: PerspectiveResponse = await response.json();

    // Extract attribute values safely
    const getScore = (attr: string) =>
      data.attributeScores?.[attr]?.summaryScore?.value ?? 0;

    const scores = {
      TOXICITY: getScore("TOXICITY"),
      SEVERE_TOXICITY: getScore("SEVERE_TOXICITY"),
      IDENTITY_ATTACK: getScore("IDENTITY_ATTACK"),
      INSULT: getScore("INSULT"),
      PROFANITY: getScore("PROFANITY"),
      THREAT: getScore("THREAT"),
    };

    // ✅ Define thresholds
    const THRESHOLDS = {
      TOXICITY: 0.8,
      SEVERE_TOXICITY: 0.7,
      IDENTITY_ATTACK: 0.7,
      INSULT: 0.8,
      PROFANITY: 0.8,
      THREAT: 0.7,
    };

    // 🚦 Determine if text is acceptable
    const isAcceptable = Object.entries(scores).every(
      ([attr, score]) => score < (THRESHOLDS as any)[attr]
    );

    console.log("Perspective Scores:", scores, "✅ Acceptable:", isAcceptable);

    return { result: data, isAcceptable };
  } catch (error) {
    console.error("❌ Error calling Perspective API:", error);
    return { result: null, isAcceptable: true }; // fail open
  }
}
