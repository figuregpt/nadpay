import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    X_API_KEY: process.env.X_API_KEY ? '✅ Set' : '❌ Missing',
    X_API_SECRET: process.env.X_API_SECRET ? '✅ Set' : '❌ Missing',
    X_CALLBACK_URI: process.env.X_CALLBACK_URI || 'http://localhost:3000/api/auth/twitter/callback',
    MONGODB_URI: process.env.MONGODB_URI ? '✅ Set' : '❌ Missing',
    timestamp: new Date().toISOString()
  });
} 