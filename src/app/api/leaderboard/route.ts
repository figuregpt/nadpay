import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const leaderboard = await getLeaderboard(limit);
    
    console.log('🎯 Leaderboard API - Raw data:', {
      count: leaderboard.length,
      firstUser: leaderboard[0],
      hasData: leaderboard.length > 0
    });
    
    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    console.log('📊 Leaderboard API - Sending response:', {
      count: rankedLeaderboard.length,
      firstUserRanked: rankedLeaderboard[0]
    });

    return NextResponse.json({ leaderboard: rankedLeaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 