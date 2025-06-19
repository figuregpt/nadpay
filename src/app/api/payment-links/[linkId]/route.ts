import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PaymentLink from '@/models/PaymentLink';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    await connectToDatabase();
    
    const { linkId } = params;
    const body = await request.json();
    const { isActive, creatorAddress } = body;

    if (typeof isActive !== 'boolean' || !creatorAddress) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const paymentLink = await PaymentLink.findOne({ linkId });

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    // Check if the requester is the creator
    if (paymentLink.creatorAddress.toLowerCase() !== creatorAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Only allow deactivation, not reactivation
    if (isActive && !paymentLink.isActive) {
      return NextResponse.json(
        { error: 'Cannot reactivate an inactive payment link' },
        { status: 400 }
      );
    }

    paymentLink.isActive = isActive;
    await paymentLink.save();

    return NextResponse.json({
      success: true,
      message: `Payment link ${isActive ? 'activated' : 'deactivated'} successfully`,
      paymentLink: {
        ...paymentLink.toObject(),
        _id: paymentLink._id.toString()
      }
    });

  } catch (error) {
    console.error('Error updating payment link:', error);
    return NextResponse.json(
      { error: 'Failed to update payment link' },
      { status: 500 }
    );
  }
} 