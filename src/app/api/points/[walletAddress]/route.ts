import { NextRequest, NextResponse } from 'next/server';
import { getUserPoints } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const userPoints = await getUserPoints(walletAddress);
    
    if (!userPoints) {
      return NextResponse.json({
        walletAddress: walletAddress.toLowerCase(),
        totalPoints: 0,
        pointsBreakdown: {
          nadswap: 0,
          nadpay: 0,
          nadraffle: 0
        },
        transactions: []
      });
    }

    return NextResponse.json(userPoints);
  } catch (error) {
    console.error('Error fetching user points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 