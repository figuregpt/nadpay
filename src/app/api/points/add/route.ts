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

    console.log('🔍 Points API - Received request:', {
      walletAddress,
      type,
      amount,
      txHash,
      twitterHandle,
      metadata,
      isNadPaySell: type === 'nadpay_sell'
    });

    // Validate required fields
    if (!walletAddress || !type || !amount || !txHash) {
      console.log('❌ Points API - Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, type, amount, txHash' },
        { status: 400 }
      );
    }

    // TWITTER REQUIREMENT: All users must have Twitter connected to earn points
    let actualTwitterHandle = twitterHandle;
    if (!actualTwitterHandle) {
      try {
        console.log('🔍 Checking Twitter connection for wallet:', walletAddress);
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/profile/${walletAddress}`);
        const profileData = await profileResponse.json();
        if (profileData.profile?.twitter) {
          actualTwitterHandle = profileData.profile.twitter.username;
          console.log('✅ Twitter connection found:', actualTwitterHandle);
        } else {
          console.log('❌ No Twitter connection found - Twitter required for all points');
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
      console.log('ℹ️ Points API - Transaction already processed:', txHash);
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
      console.log('🔥🔥🔥 CRITICAL: NADPAY_SELL DETECTED - FORCING 1 POINT 🔥🔥🔥');
      console.log('Original amount:', amount);
      console.log('Wallet address:', walletAddress);
      console.log('Transaction hash:', txHash);
      console.log('FORCED POINTS:', points);
    } else {
      // For nadpay_buy and nadraffle transactions, calculate based on amount
      points = calculatePoints(amount, 4);
    }

    console.log('💰 Points API - Calculated points:', {
      type,
      amount,
      calculatedPoints: points,
      isNadPaySell: type === 'nadpay_sell'
    });

    // Create transaction record
    const transaction: PointTransaction = {
      type: type as PointTransaction['type'],
      points,
      amount,
      txHash,
      timestamp: new Date(),
      metadata
    };

    // Update user points
    console.log('📝 Points API - Updating user points');
    await updateUserPoints(walletAddress, transaction, actualTwitterHandle);
    console.log('✅ Points API - Successfully updated user points');

    // For raffle ticket purchases, also award points to the creator
    if (type === 'nadraffle_buy' && metadata?.creatorAddress && metadata.creatorAddress !== walletAddress) {
      try {
        console.log('🎯 Points API - Awarding points to creator:', metadata.creatorAddress);
        const creatorTransaction: PointTransaction = {
          type: 'nadraffle_sell',
          points,
          amount,
          txHash: `${txHash}_creator`, // Unique hash for creator
          timestamp: new Date(),
          metadata: { ...metadata, buyerAddress: walletAddress }
        };
        
        await updateUserPoints(metadata.creatorAddress, creatorTransaction, metadata.creatorTwitterHandle);
        console.log(`🎉 Awarded ${points} points to raffle creator: ${metadata.creatorAddress}`);
      } catch (creatorError) {
        console.error('❌ Error awarding points to creator:', creatorError);
        // Don't fail the buyer's transaction if creator points fail
      }
    }

    console.log('🎊 Points API - Transaction completed successfully');
    console.log('🎯 FINAL RESULT - Points awarded:', points, 'for type:', type);
    return NextResponse.json({
      success: true,
      points,
      message: `Added ${points} points for ${type} transaction`
    });

  } catch (error) {
    console.error('Error adding points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 