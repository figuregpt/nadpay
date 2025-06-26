import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

let client: MongoClient | null = null;

async function getMongoClient() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
  }
  return client;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress: rawWalletAddress } = await params;
    const walletAddress = rawWalletAddress.toLowerCase();

    const mongoClient = await getMongoClient();
    const db = mongoClient.db('nadpay');
    const collection = db.collection('user_profiles');

    const profile = await collection.findOne(
      { walletAddress },
      { 
        projection: { 
          accessToken: 0, 
          refreshToken: 0 
        } 
      }
    );

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress: rawWalletAddress } = await params;
    const walletAddress = rawWalletAddress.toLowerCase();

    const mongoClient = await getMongoClient();
    const db = mongoClient.db('nadpay');
    const collection = db.collection('user_profiles');

    await collection.deleteOne({ walletAddress });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile delete error:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
} 