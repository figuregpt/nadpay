import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePublicClient, useReadContract } from 'wagmi';
import { NADRAFFLE_V6_CONTRACT } from './useNadRaffleV6Contract';
import { RPC_CONFIG, delay } from '@/lib/rpc-config';

export interface UserTicket {
  raffleId: number;
  ticketCount: number;
  raffleName: string;
  status: number; // 0 = Active, 1 = Ended
  isWinner: boolean;
  rewardClaimed: boolean;
  expirationTime: number;
  // Reward information
  rewardType?: number;
  rewardToken?: string;
  rewardAmount?: bigint;
  rewardTokenId?: bigint;
}

export interface Notification {
  id: string;
  type: 'winner' | 'ended' | 'new_raffle';
  raffleId: number;
  raffleName: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export function useUserRaffles(userAddress?: string) {
  const publicClient = usePublicClient();
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cache to prevent excessive refetching
  const lastFetchTime = useRef<number>(0);

  // Get total raffles to iterate through
  const { data: totalRaffles } = useReadContract({
    address: NADRAFFLE_V6_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_V6_CONTRACT.abi,
    functionName: 'totalRaffles',
  });

  const fetchUserRaffles = useCallback(async () => {
    if (!userAddress || !publicClient || !totalRaffles) {
      return;
    }

    // Check cache
    const now = Date.now();
    if (now - lastFetchTime.current < RPC_CONFIG.CACHE_DURATION && userTickets.length > 0) {
      `);
      const userRaffleData: UserTicket[] = [];
      const newNotifications: Notification[] = [];

      // 🚀 OPTIMIZATION 1: Batch ticket count checks WITH RATE LIMITING
      {
        const chunkEnd = Math.min(chunkStart + RPC_CONFIG.BATCH_SIZE, raffleCount);
        const chunkPromises = [];
        
        // Create promises for this chunk
        for (let i = chunkStart; i < chunkEnd; i++) {
          chunkPromises.push(
            publicClient.readContract({
              address: NADRAFFLE_V6_CONTRACT.address as `0x${string}`,
              abi: NADRAFFLE_V6_CONTRACT.abi,
              functionName: 'ticketCounts',
              args: [BigInt(i), userAddress as `0x${string}`],
            }).catch(error => {
              console.error(`Error checking raffle ${i}:`, error);
              return BigInt(0);
            })
          );
        }
        
        // Execute chunk and store results
        const chunkResults = await Promise.all(chunkPromises) as bigint[];
        ticketCounts.push(...chunkResults);
        
        // Add delay between chunks to avoid rate limiting
        if (chunkEnd < raffleCount) {
          await delay(RPC_CONFIG.BATCH_DELAY);
        }
      }
      
      // 🚀 OPTIMIZATION 2: Only fetch details for raffles where user has tickets
      const relevantRaffleIds = [];
      for (let i = 0; i < ticketCounts.length; i++) {
        if (Number(ticketCounts[i]) > 0) {
          relevantRaffleIds.push(startIndex + i); // Add startIndex offset
        }
      }

      if (relevantRaffleIds.length === 0) {
        setUserTickets([]);
        return;
      }

      // 🚀 OPTIMIZATION 3: Batch fetch raffle details WITH RATE LIMITING
      // Smaller chunk size for details
      
      for (let i = 0; i < relevantRaffleIds.length; i += DETAILS_CHUNK_SIZE) {
        const chunk = relevantRaffleIds.slice(i, i + DETAILS_CHUNK_SIZE);
        const chunkPromises = chunk.map(raffleId => 
          publicClient.readContract({
            address: NADRAFFLE_V6_CONTRACT.address as `0x${string}`,
            abi: NADRAFFLE_V6_CONTRACT.abi,
            functionName: 'getRaffleDetails',
            args: [BigInt(raffleId)],
          }).catch(error => {
            console.error(`Error fetching raffle ${raffleId} details:`, error);
            return null;
          })
        );
        
        const chunkResults = await Promise.all(chunkPromises);
        raffleDetails.push(...chunkResults);
        
        // Add delay between chunks
        if (i + DETAILS_CHUNK_SIZE < relevantRaffleIds.length) {
          await delay(RPC_CONFIG.BATCH_DELAY * 1.5); // Slightly longer delay for details
        }
      }

      // Process results
      for (let j = 0; j < relevantRaffleIds.length; j++) {
        const raffleId = relevantRaffleIds[j];
        const ticketCountIndex = raffleId - startIndex; // Adjust index for ticket count
        const ticketCount = Number(ticketCounts[ticketCountIndex]);
        const raffleData = raffleDetails[j] as any; // Type assertion for contract response

        if (!raffleData) continue;

        ,
          winner: raffleData.winner,
          rewardType: raffleData.rewardType?.toString(),
          rewardTokenAddress: raffleData.rewardTokenAddress,
          rewardAmount: raffleData.rewardAmount?.toString(),
          rewardTokenId: raffleData.rewardTokenId?.toString()
        });

        const isWinner = raffleData.winner?.toLowerCase() === userAddress.toLowerCase();
        const raffleName = `V6 Raffle #${raffleId}`;

        const ticketData = {
          raffleId,
          ticketCount,
          raffleName,
          status: Number(raffleData.state), // V6 uses 'state' instead of 'status'
          isWinner,
          rewardClaimed: false, // V6 doesn't have this field yet
          expirationTime: Number(raffleData.endTime),
          // Include reward information - FIX: use rewardTokenAddress not rewardToken
          rewardType: Number(raffleData.rewardType),
          rewardToken: raffleData.rewardTokenAddress, // FIXED: was raffleData.rewardToken
          rewardAmount: raffleData.rewardAmount,
          rewardTokenId: raffleData.rewardTokenId,
        };

        }`,
            type: 'winner',
            raffleId,
            raffleName,
            message: `🎉 Congratulations! You won "${raffleName}"! Check your winnings.`,
            timestamp: Date.now(),
            read: false,
          });
        }

        // Create notifications for ended raffles
        if (Number(raffleData.state) === 1 && !isWinner) {
          const now = Date.now() / 1000;
          const endTime = Number(raffleData.endTime);
          
          // Only notify if raffle ended recently (within 24 hours)
          if (now - endTime < 86400) {
            newNotifications.push({
              id: `ended_${raffleId}_${Date.now()}`,
              type: 'ended',
              raffleId,
              raffleName,
              message: `Raffle "${raffleName}" has ended. You didn't win this time, but keep trying!`,
              timestamp: Date.now(),
              read: false,
            });
          }
        }
      }

      } catch (error) {
      console.error('❌ Error fetching user raffles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, publicClient, totalRaffles, userTickets.length]);

  useEffect(() => {
    fetchUserRaffles();
  }, [userAddress, totalRaffles, publicClient]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  return {
    userTickets,
    notifications,
    isLoading,
    refetch: fetchUserRaffles,
    markAsRead,
    markAllAsRead,
    clearNotification,
    getUnreadCount,
  };
} 