import { NextRequest, NextResponse } from 'next/server';
import { updateUserPoints, isTransactionProcessed, calculatePoints, PointTransaction } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      walletAddress, 
      type, 
      amount, 
      txHash, 
      twitterHandle,
      metadata 
    } = body;

    // Validate required fields
    if (!walletAddress || !type || !amount || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TWITTER REQUIREMENT: All users must have Twitter connected to earn points
    let actualTwitterHandle = twitterHandle;
    if (!actualTwitterHandle) {
      try {
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/profile/${walletAddress}`);
        const profileData = await profileResponse.json();
        if (profileData.profile?.twitter) {
          actualTwitterHandle = profileData.profile.twitter.username;
        } else {
          return NextResponse.json(
            { message: 'Twitter connection required to earn points. Connect your Twitter account in dashboard.', points: 0 },
            { status: 200 }
          );
        }
      } catch (error) {
        console.error('❌ Error fetching Twitter profile:', error);
        return NextResponse.json(
          { message: 'Twitter verification failed - Twitter required to earn points', points: 0 },
          { status: 200 }
        );
      }
    }

    // Validate transaction type
    const validTypes = ['nadswap', 'nadpay_buy', 'nadpay_sell', 'nadraffle_create', 'nadraffle_buy', 'nadraffle_sell'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // Check if transaction already processed
    const alreadyProcessed = await isTransactionProcessed(txHash);
    if (alreadyProcessed) {
      return NextResponse.json(
        { message: 'Transaction already processed', points: 0 },
        { status: 200 }
      );
    }

    // Calculate points based on type
    let points = 0;
    if (type === 'nadswap') {
      points = 4; // Fixed 4 points for swap
    } else if (type === 'nadraffle_create') {
      points = 4; // Fixed 4 points for creating raffle
    } else if (type === 'nadpay_sell') {
      // FORCED: NadPay sellers get exactly 1 point for any amount
      points = 1;
    } else {
      points = calculatePoints(type, amount);
    }

    // Create transaction record
    const transaction: PointTransaction = {
      type: type as PointTransaction['type'],
      points,
      amount,
      txHash,
      timestamp: new Date(),
      metadata: { ...metadata, buyerAddress: walletAddress }
    };

    // Update user points
    await updateUserPoints(walletAddress, transaction, actualTwitterHandle);
    
    // Award points to creator for sales
    if ((type === 'nadpay_sell' || type === 'nadraffle_sell') && metadata?.creatorAddress) {
      try {
        const creatorTransaction: PointTransaction = {
          ...transaction,
          metadata: { ...metadata, buyerAddress: walletAddress }
        };
        
        await updateUserPoints(metadata.creatorAddress, creatorTransaction, metadata.creatorTwitterHandle);
      } catch (creatorError) {
        console.error('❌ Error awarding points to creator:', creatorError);
        // Don't fail the buyer's transaction if creator points fail
      }
    }

    return NextResponse.json({ 
      success: true, 
      points: points,
      txHash: txHash 
    });

  } catch (error) {
    console.error('Error adding points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 