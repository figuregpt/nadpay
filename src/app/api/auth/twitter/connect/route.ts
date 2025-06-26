import { NextRequest, NextResponse } from 'next/server';

// Get base URL from environment or request
function getBaseUrl(request: NextRequest): string {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Fallback to request headers
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const baseUrl = getBaseUrl(request);
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Twitter OAuth 2.0 authorization URL
    const state = btoa(JSON.stringify({ walletAddress, timestamp: Date.now() }));
    const scope = 'tweet.read users.read';
    const redirectUri = process.env.X_CALLBACK_URI || `${baseUrl}/api/auth/twitter/callback`;
    
    // Use fixed challenge for simplicity (production should use proper PKCE)
    const codeChallenge = 'challenge';
    
    const authUrl = `https://x.com/i/oauth2/authorize?response_type=code&client_id=${process.env.X_API_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=plain`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Twitter connect error:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
} 