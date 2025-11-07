// perspective.ts

/**
 * Retrieves the Perspective API key from environment variables.
 * This is a SERVER-ONLY variable in Next.js (no NEXT_PUBLIC_ prefix).
 * Never import this file directly in client components.
 */
const PERSPECTIVE_API_KEY: string | undefined = process.env.PERSPECTIVE_API_KEY;

/**
 * Defines the structure for the Perspective API request body.
 * You can add more attributes as needed based on your analysis requirements.
 * See: https://developers.perspectiveapi.com/s/about-the-api-attributes
 */
interface PerspectiveRequest {
  comment: {
    text: string;
  };
  requestedAttributes: {
    TOXICITY?: {};
    SEVERE_TOXICITY?: {};
    IDENTITY_ATTACK?: {};
    INSULT?: {};
    PROFANITY?: {};
    THREAT?: {};
    SEXUALLY_EXPLICIT?: {};
    FLIRTATION?: {}; // Note: FLIRTATION is a non-default attribute and may require specific access.
    // Add any other attributes you need to analyze
  };
  // You can also add more fields like languages, doNotStore, etc.
  // See: https://developers.perspectiveapi.com/s/docs
}

/**
 * Defines the structure for the Perspective API response.
 * This is a simplified version; the actual response can be more complex.
 */
interface PerspectiveResponse {
  attributeScores: {
    [attribute: string]: {
      summaryScore: {
        value: number; // Score between 0 and 1
        type: string; // e.g., "PROBABILITY"
      };
    };
  };
  // Other potential fields like languages, detectedLanguages, etc.
}

/**
 * Calls the Perspective API to analyze the given text.
 * @param text The text to be analyzed for various attributes.
 * @returns A Promise that resolves to the Perspective API response or null if an error occurs.
 */
export async function analyzeTextWithPerspective(text: string): Promise<PerspectiveResponse | null> {
  if (!PERSPECTIVE_API_KEY) {
    console.error("Perspective API Key is not configured. Please set REACT_APP_PERSPECTIVE_API_KEY in your .env file.");
    // In a production environment, you might want to throw an error or handle this more gracefully.
    return null;
  }

  // Define the attributes you want to request.
  // You can customize this based on what you're interested in.
  const requestBody: PerspectiveRequest = {
    comment: {
      text: text,
    },
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {},
      // Include other attributes you specifically need
      // For example: FLIRTATION: {} if you have access and need it
    },
    // Set doNotStore: true if you want to prevent Google from storing the analyzed text
    // doNotStore: true,
  };

  const API_ENDPOINT = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorDetail = await response.json();
      console.error(`Perspective API request failed with status ${response.status}:`, errorDetail);
      // You might want to throw an error here to propagate it to the caller
      throw new Error(`Perspective API error: ${errorDetail.error?.message || response.statusText}`);
    }

    const data: PerspectiveResponse = await response.json();
    return data;

  } catch (error) {
    console.error("Error calling Perspective API:", error);
    return null;
  }
}

// Example of how you might use it (can be placed in a component file or another service)
/*
// In a React component:
import React, { useState } from 'react';
import { analyzeTextWithPerspective } from './perspective'; // Adjust path as needed

const CommentAnalyzer: React.FC = () => {
  const [comment, setComment] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null); // Use a more specific type if desired
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeTextWithPerspective(comment);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze comment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Enter comment to analyze..."
        rows={4}
        cols={50}
      />
      <button onClick={handleAnalyze} disabled={loading || !comment}>
        {loading ? 'Analyzing...' : 'Analyze Comment'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {analysisResult && (
        <div>
          <h3>Analysis Results:</h3>
          {Object.entries(analysisResult.attributeScores).map(([attr, scoreInfo]) => (
            <p key={attr}>
              <strong>{attr}:</strong> {(scoreInfo.summaryScore.value * 100).toFixed(2)}%
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentAnalyzer;
*/
