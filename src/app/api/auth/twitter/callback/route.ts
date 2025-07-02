import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

let client: MongoClient | null = null;

async function getMongoClient() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
  }
  return client;
}

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

export async function GET(request: NextRequest) {
  try {
    const baseUrl = getBaseUrl(request);
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=auth_failed`);
    }

    // Decode state to get wallet address
    const { walletAddress } = JSON.parse(atob(state));

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${process.env.X_API_KEY}:${process.env.X_API_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.X_CALLBACK_URI || `${baseUrl}/api/auth/twitter/callback`,
        code_verifier: 'challenge'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
              return NextResponse.redirect(`${baseUrl}/dashboard?error=token_failed`);
    }

    // Get user info from Twitter
    const userResponse = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url,public_metrics,verified', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const userData = await userResponse.json();

    if (!userData.data) {
              return NextResponse.redirect(`${baseUrl}/dashboard?error=user_failed`);
    }

    // Save to MongoDB
    const mongoClient = await getMongoClient();
    const db = mongoClient.db('nadpay');
    const collection = db.collection('user_profiles');

    // Check if this Twitter account is already connected to another wallet
    const existingTwitterProfile = await collection.findOne({
      twitterId: userData.data.id
    });

    if (existingTwitterProfile && existingTwitterProfile.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      // Twitter account is already connected to a different wallet
              return NextResponse.redirect(`${baseUrl}/dashboard?error=twitter_already_connected&handle=${userData.data.username}`);
    }

    const userProfile = {
      walletAddress: walletAddress.toLowerCase(),
      twitterId: userData.data.id,
      twitterHandle: userData.data.username,
      twitterName: userData.data.name,
      twitterAvatarUrl: userData.data.profile_image_url?.replace('_normal', '_400x400') || '',
      isVerified: userData.data.verified || false,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      updatedAt: new Date()
    };

    await collection.updateOne(
      { walletAddress: walletAddress.toLowerCase() },
      { $set: userProfile },
      { upsert: true }
    );

          return NextResponse.redirect(`${baseUrl}/dashboard?success=twitter_connected`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    const baseUrl = getBaseUrl(request);
          return NextResponse.redirect(`${baseUrl}/dashboard?error=callback_failed`);
  }
} 