import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Twitter OAuth 2.0 authorization URL
    const state = btoa(JSON.stringify({ walletAddress, timestamp: Date.now() }));
    const scope = 'tweet.read users.read';
    const redirectUri = process.env.X_CALLBACK_URI || 'http://localhost:3000/api/auth/twitter/callback';
    
    // Use fixed challenge for simplicity (production should use proper PKCE)
    const codeChallenge = 'challenge';
    
    const authUrl = `https://x.com/i/oauth2/authorize?response_type=code&client_id=${process.env.X_API_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=plain`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Twitter connect error:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
} 