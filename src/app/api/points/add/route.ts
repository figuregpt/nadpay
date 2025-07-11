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

    console.log('🎯 Points API called:', { walletAddress, type, amount, txHash, twitterHandle, metadata });

    // Validate required fields
    if (!walletAddress || !type || !amount || !txHash) {
      console.error('❌ Missing required fields:', { walletAddress, type, amount, txHash });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TWITTER REQUIREMENT: All users must have Twitter connected to earn points
    let actualTwitterHandle = twitterHandle;
    if (!actualTwitterHandle) {
      console.log('🐦 No Twitter handle provided, checking profile...');
      try {
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/profile/${walletAddress}`);
        const profileData = await profileResponse.json();
        console.log('🐦 Profile data:', profileData);
        if (profileData.profile?.twitter) {
          actualTwitterHandle = profileData.profile.twitter.username;
          console.log('✅ Twitter verified:', actualTwitterHandle);
        } else {
          console.log('❌ No Twitter connection found');
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
    } else {
      console.log('✅ Twitter handle provided:', actualTwitterHandle);
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
      points = calculatePoints(amount); // Pass amount as first parameter
    }

    console.log('💰 Points calculated:', { type, amount, points });

    // Create transaction record
    const transaction: PointTransaction = {
      type: type as PointTransaction['type'],
      points,
      amount,
      txHash,
      timestamp: new Date(),
      metadata: { ...metadata, buyerAddress: walletAddress }
    };

    console.log('📝 Creating transaction for buyer:', transaction);

    // Update user points
    console.log('🎯 Updating buyer points...');
    await updateUserPoints(walletAddress, transaction, actualTwitterHandle);
    console.log('✅ Buyer points updated successfully');
    
    // Award points to creator for sales AND purchases
    if ((type === 'nadpay_sell' || type === 'nadraffle_sell' || type === 'nadraffle_buy') && metadata?.creatorAddress) {
      console.log('🏆 Awarding creator points...', { type, creatorAddress: metadata.creatorAddress });
      try {
        // Create a separate creator transaction for sales/earning points
        const creatorTransaction: PointTransaction = {
          type: type === 'nadraffle_buy' ? 'nadraffle_sell' : type as PointTransaction['type'], // Convert buy to sell for creator
          points: type === 'nadraffle_buy' ? calculatePoints(amount) : transaction.points, // Fix calculatePoints call
          amount,
          txHash: `${txHash}_creator`, // Make unique hash for creator transaction
          timestamp: new Date(),
          metadata: { ...metadata, buyerAddress: walletAddress }
        };
        
        console.log('📝 Creating transaction for creator:', creatorTransaction);
        await updateUserPoints(metadata.creatorAddress, creatorTransaction, metadata.creatorTwitterHandle);
        console.log('✅ Creator points updated successfully');
      } catch (creatorError) {
        console.error('❌ Error awarding points to creator:', creatorError);
        // Don't fail the buyer's transaction if creator points fail
      }
    } else {
      console.log('⚠️ No creator points awarded:', { 
        shouldAward: (type === 'nadpay_sell' || type === 'nadraffle_sell' || type === 'nadraffle_buy'),
        hasCreator: !!metadata?.creatorAddress,
        type,
        metadata
      });
    }

    console.log('🎉 Points API completed successfully:', { walletAddress, points, txHash });
    
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