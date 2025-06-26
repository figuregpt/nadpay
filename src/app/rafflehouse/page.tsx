import RaffleHouseContent from './RaffleHouseContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RaffleHouse - Win NFTs & Tokens on Monad',
  description: 'Join exciting raffles from creators around the world. Win tokens, NFTs, and exclusive rewards on Monad blockchain.',
};

export default function RaffleHousePage() {
  return <RaffleHouseContent />;
} 