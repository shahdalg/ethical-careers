import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = process.env.PERSPECTIVE_API_KEY;
  
  return NextResponse.json({
    apiKeyConfigured: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPrefix: apiKey?.substring(0, 10) || 'not set',
    nodeEnv: process.env.NODE_ENV,
  });
}
