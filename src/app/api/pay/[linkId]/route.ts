import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PaymentLink from '@/models/PaymentLink';

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    await connectToDatabase();
    
    const { linkId } = params;

    const paymentLink = await PaymentLink.findOne({ linkId, isActive: true });

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found or inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentLink: {
        ...paymentLink.toObject(),
        _id: paymentLink._id.toString()
      }
    });

  } catch (error) {
    console.error('Error fetching payment link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment link' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    await connectToDatabase();
    
    const { linkId } = params;
    const body = await request.json();
    const { buyerAddress, amount, txHash } = body;

    if (!buyerAddress || !amount || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const paymentLink = await PaymentLink.findOne({ linkId, isActive: true });

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found or inactive' },
        { status: 404 }
      );
    }

    // Check if total sales limit is reached
    if (paymentLink.totalSales > 0 && paymentLink.salesCount >= paymentLink.totalSales) {
      return NextResponse.json(
        { error: 'Sales limit reached' },
        { status: 400 }
      );
    }

    // Check wallet limit
    if (paymentLink.maxPerWallet > 0) {
      const userPurchases = paymentLink.purchases.filter(
        (purchase: any) => purchase.buyerAddress.toLowerCase() === buyerAddress.toLowerCase()
      );
      const userTotal = userPurchases.reduce((sum: number, purchase: any) => sum + purchase.amount, 0);
      
      if (userTotal + amount > paymentLink.maxPerWallet) {
        return NextResponse.json(
          { error: 'Wallet purchase limit exceeded' },
          { status: 400 }
        );
      }
    }

    // Add purchase
    paymentLink.purchases.push({
      buyerAddress,
      amount,
      txHash,
      timestamp: new Date()
    });

    // Update counters
    paymentLink.salesCount += amount;
    paymentLink.totalEarned = (
      parseFloat(paymentLink.totalEarned) + (parseFloat(paymentLink.price) * amount)
    ).toString();

    await paymentLink.save();

    return NextResponse.json({
      success: true,
      message: 'Purchase recorded successfully'
    });

  } catch (error) {
    console.error('Error recording purchase:', error);
    return NextResponse.json(
      { error: 'Failed to record purchase' },
      { status: 500 }
    );
  }
} 