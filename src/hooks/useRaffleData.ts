'use client';

import { useReadContract } from 'wagmi';
import { NADRAFFLE_CONTRACT } from '@/lib/raffle-contract';

export function useGetRaffle(raffleId: number) {
  return useReadContract({
    address: NADRAFFLE_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_CONTRACT.abi,
    functionName: 'getRaffle',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId > 0,
    }
  });
}

export function useGetUserRaffles(userAddress: string) {
  return useReadContract({
    address: NADRAFFLE_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_CONTRACT.abi,
    functionName: 'getUserRaffles',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    }
  });
}

export function useGetUserTickets(raffleId: number, userAddress: string) {
  return useReadContract({
    address: NADRAFFLE_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_CONTRACT.abi,
    functionName: 'getUserTickets',
    args: [BigInt(raffleId), userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress && raffleId > 0,
    }
  });
}

export function useGetRaffleTickets(raffleId: number) {
  return useReadContract({
    address: NADRAFFLE_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_CONTRACT.abi,
    functionName: 'getRaffleTickets',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId > 0,
    }
  });
}

export function useIsRaffleExpired(raffleId: number) {
  return useReadContract({
    address: NADRAFFLE_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_CONTRACT.abi,
    functionName: 'isRaffleExpired',
    args: [BigInt(raffleId)],
    query: {
      enabled: raffleId > 0,
    }
  });
} 