import { NextRequest, NextResponse } from 'next/server';
import { getUserPointsCollection } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const collection = await getUserPointsCollection();
    
    // Get all users without any filter
    const allUsers = await collection.find({}).toArray();
    
    // Get users with points > 0
    const usersWithPoints = await collection.find({ totalPoints: { $gt: 0 } }).toArray();
    
    // Get count of users with twitter
    const usersWithTwitter = await collection.find({ 
      twitterHandle: { $exists: true },
      $and: [{ twitterHandle: { $ne: '' } }]
    }).toArray();
    
    return NextResponse.json({
      totalUsersInDB: allUsers.length,
      usersWithPoints: usersWithPoints.length,
      usersWithTwitter: usersWithTwitter.length,
      allUsers: allUsers.map(user => ({
        wallet: user.walletAddress,
        twitter: user.twitterHandle || 'NO_TWITTER',
        totalPoints: user.totalPoints,
        breakdown: user.pointsBreakdown
      })),
      sampleUsersWithPoints: usersWithPoints.slice(0, 5).map(user => ({
        wallet: user.walletAddress,
        twitter: user.twitterHandle || 'NO_TWITTER',
        totalPoints: user.totalPoints,
        breakdown: user.pointsBreakdown
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
} 