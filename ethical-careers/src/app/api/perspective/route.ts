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

    // TEMPORARY: Bypass moderation for debugging
    // Remove this block once you've confirmed the API is working
    const BYPASS_MODERATION = false; // Set to true to disable moderation temporarily
    if (BYPASS_MODERATION) {
      return NextResponse.json({
        allowed: true,
        scores: {},
        message: 'Content approved (moderation bypassed)',
      });
    }

    // Call Perspective API
    const { result, isAcceptable } = await analyzeTextWithPerspective(text);

    if (!result) {
      console.error('Perspective API returned null result');
      // Fail open - allow content if API fails
      return NextResponse.json({
        allowed: true,
        scores: {},
        message: 'Content approved (moderation service unavailable)',
      });
    }

    console.log('Perspective API result:', JSON.stringify(result, null, 2));

    // Extract scores
    const scores = result.attributeScores;
    
    if (!scores) {
      console.error('No attributeScores in result');
      // If we can't get scores, allow the content (fail open)
      return NextResponse.json({
        allowed: true,
        scores: {},
        message: 'Content approved (moderation unavailable)',
      });
    }

    const toxicity = scores?.TOXICITY?.summaryScore?.value ?? 0;
    const severeToxicity = scores?.SEVERE_TOXICITY?.summaryScore?.value ?? 0;
    const identityAttack = scores?.IDENTITY_ATTACK?.summaryScore?.value ?? 0;
    const insult = scores?.INSULT?.summaryScore?.value ?? 0;
    const profanity = scores?.PROFANITY?.summaryScore?.value ?? 0;
    const threat = scores?.THREAT?.summaryScore?.value ?? 0;

    console.log('Extracted scores:', {
      toxicity,
      severeToxicity,
      identityAttack,
      insult,
      profanity,
      threat,
    });

    // Use the isAcceptable flag from the Perspective helper
    // (which already checks thresholds defined in perspective.ts)
    const isBlocked = !isAcceptable;

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
