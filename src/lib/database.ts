import { MongoClient, Db, Collection } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

export interface UserPoints {
  _id?: string;
  walletAddress: string;
  twitterHandle?: string;
  totalPoints: number;
  pointsBreakdown: {
    nadswap: number;
    nadpay: number;
    nadraffle: number;
  };
  transactions: PointTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PointTransaction {
  type: 'nadswap' | 'nadpay_buy' | 'nadpay_sell' | 'nadraffle_create' | 'nadraffle_buy' | 'nadraffle_sell';
  points: number;
  amount: string; // MON amount as string
  txHash: string;
  timestamp: Date;
  metadata?: {
    linkId?: string;
    raffleId?: string;
    counterparty?: string; // For nadswap
  };
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('nadpay_points');
}

export async function getUserPointsCollection(): Promise<Collection<UserPoints>> {
  const db = await getDatabase();
  return db.collection<UserPoints>('user_points');
}

// Helper function to calculate points based on MON amount
export function calculatePoints(monAmount: string, basePoints: number = 4): number {
  const amount = parseFloat(monAmount);
  if (isNaN(amount) || amount <= 0) return 0;
  
  // Every 0.1 MON = base points (default 4)
  // Example: 0.01 MON = 0.4 points, 0.1 MON = 4 points, 1 MON = 40 points
  return Math.round((amount / 0.1) * basePoints * 10) / 10; // Round to 1 decimal
}

// Get user points by wallet address
export async function getUserPoints(walletAddress: string): Promise<UserPoints | null> {
  const collection = await getUserPointsCollection();
  return await collection.findOne({ walletAddress: walletAddress.toLowerCase() });
}

// Update or create user points
export async function updateUserPoints(
  walletAddress: string,
  transaction: PointTransaction,
  twitterHandle?: string
): Promise<void> {
  const collection = await getUserPointsCollection();
  const lowercaseAddress = walletAddress.toLowerCase();
  
  const existingUser = await collection.findOne({ walletAddress: lowercaseAddress });
  
  if (existingUser) {
    // Update existing user
    const updatedBreakdown = { ...existingUser.pointsBreakdown };
    
    // Update specific category
    if (transaction.type === 'nadswap') {
      updatedBreakdown.nadswap += transaction.points;
    } else if (transaction.type.startsWith('nadpay')) {
      updatedBreakdown.nadpay += transaction.points;
    } else if (transaction.type.startsWith('nadraffle')) {
      updatedBreakdown.nadraffle += transaction.points;
    }
    
    await collection.updateOne(
      { walletAddress: lowercaseAddress },
      {
        $set: {
          totalPoints: existingUser.totalPoints + transaction.points,
          pointsBreakdown: updatedBreakdown,
          updatedAt: new Date(),
          ...(twitterHandle && { twitterHandle })
        },
        $push: { transactions: transaction }
      }
    );
  } else {
    // Create new user
    const breakdown = {
      nadswap: 0,
      nadpay: 0,
      nadraffle: 0
    };
    
    if (transaction.type === 'nadswap') {
      breakdown.nadswap = transaction.points;
    } else if (transaction.type.startsWith('nadpay')) {
      breakdown.nadpay = transaction.points;
    } else if (transaction.type.startsWith('nadraffle')) {
      breakdown.nadraffle = transaction.points;
    }
    
    const newUser: UserPoints = {
      walletAddress: lowercaseAddress,
      twitterHandle,
      totalPoints: transaction.points,
      pointsBreakdown: breakdown,
      transactions: [transaction],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await collection.insertOne(newUser);
  }
}

// Get leaderboard
export async function getLeaderboard(limit: number = 100): Promise<UserPoints[]> {
  const collection = await getUserPointsCollection();
  
  // Get all users with points > 0
  const users = await collection
    .find({ totalPoints: { $gt: 0 } })
    .sort({ totalPoints: -1 })
    .limit(limit)
    .toArray();
    
    // Debug: Database getLeaderboard
    // console.log('🔍 Database getLeaderboard:', {
    //   totalUsers: users.length,
    //   firstUser: users[0],
    //   hasAnyUsers: users.length > 0
    // });
  
  return users;
}

// Check if transaction already processed (prevent double counting)
export async function isTransactionProcessed(txHash: string): Promise<boolean> {
  const collection = await getUserPointsCollection();
  const result = await collection.findOne({
    'transactions.txHash': txHash
  });
  return result !== null;
} 