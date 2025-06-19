import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PaymentLink from '@/models/PaymentLink';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { creatorAddress, title, description, coverImage, price, totalSales, maxPerWallet } = body;

    if (!creatorAddress || !title || !description || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique link ID
    const linkId = Math.random().toString(36).substring(2, 15);

    const paymentLink = new PaymentLink({
      linkId,
      creatorAddress,
      title,
      description,
      coverImage: coverImage || '',
      price,
      totalSales: parseInt(totalSales) || 0,
      maxPerWallet: parseInt(maxPerWallet) || 0,
    });

    await paymentLink.save();

    return NextResponse.json({
      success: true,
      linkId,
      paymentLink: {
        ...paymentLink.toObject(),
        _id: paymentLink._id.toString()
      }
    });

  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const creatorAddress = searchParams.get('creator');

    if (!creatorAddress) {
      return NextResponse.json(
        { error: 'Creator address is required' },
        { status: 400 }
      );
    }

    const paymentLinks = await PaymentLink.find({ creatorAddress })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      paymentLinks: paymentLinks.map(link => ({
        ...link.toObject(),
        _id: link._id.toString()
      }))
    });

  } catch (error) {
    console.error('Error fetching payment links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment links' },
      { status: 500 }
    );
  }
} 