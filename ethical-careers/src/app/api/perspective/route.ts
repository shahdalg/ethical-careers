import { NextRequest, NextResponse } from 'next/server';
import { analyzeTextWithPerspective } from '@/lib/perspective';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Call Perspective API
    const result = await analyzeTextWithPerspective(text);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to analyze text with Perspective API' },
        { status: 500 }
      );
    }

    // Extract scores
    const scores = result.attributeScores;
    const toxicity = scores?.TOXICITY?.summaryScore?.value ?? 0;
    const severeToxicity = scores?.SEVERE_TOXICITY?.summaryScore?.value ?? 0;
    const identityAttack = scores?.IDENTITY_ATTACK?.summaryScore?.value ?? 0;
    const insult = scores?.INSULT?.summaryScore?.value ?? 0;
    const profanity = scores?.PROFANITY?.summaryScore?.value ?? 0;
    const threat = scores?.THREAT?.summaryScore?.value ?? 0;

    // Determine if content should be blocked (threshold: 0.7 = 70%)
    const threshold = 0.7;
    const isBlocked =
      toxicity > threshold ||
      severeToxicity > threshold ||
      identityAttack > threshold ||
      insult > threshold ||
      profanity > threshold ||
      threat > threshold;

    return NextResponse.json({
      allowed: !isBlocked,
      scores: {
        toxicity,
        severeToxicity,
        identityAttack,
        insult,
        profanity,
        threat,
      },
      message: isBlocked
        ? 'Content contains inappropriate language and cannot be posted.'
        : 'Content approved',
    });
  } catch (error) {
    console.error('Error in Perspective API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
