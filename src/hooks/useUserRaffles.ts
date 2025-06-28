import { useState, useEffect } from 'react';
import { usePublicClient, useReadContract } from 'wagmi';
import { NADRAFFLE_V4_FAST_CONTRACT } from './useNadRaffleV4FastContract';

export interface UserTicket {
  raffleId: number;
  ticketCount: number;
  raffleName: string;
  status: number; // 0 = Active, 1 = Ended
  isWinner: boolean;
  rewardClaimed: boolean;
  expirationTime: number;
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

  // Get total raffles to iterate through
  const { data: totalRaffles } = useReadContract({
    address: NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`,
    abi: NADRAFFLE_V4_FAST_CONTRACT.abi,
    functionName: 'getTotalRaffles',
  });

  const fetchUserRaffles = async () => {
    if (!userAddress || !publicClient || !totalRaffles) return;

    setIsLoading(true);
    try {
      const raffleCount = Number(totalRaffles);
      const userRaffleData: UserTicket[] = [];
      const newNotifications: Notification[] = [];

      // Check each raffle for user participation
      for (let i = 1; i <= raffleCount; i++) {
        try {
          // Get user's tickets for this raffle
          const userTicketCount = await publicClient.readContract({
            address: NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`,
            abi: NADRAFFLE_V4_FAST_CONTRACT.abi,
            functionName: 'ticketsPurchasedByWallet',
            args: [BigInt(i), userAddress as `0x${string}`],
          }) as bigint;

          if (Number(userTicketCount) > 0) {
            // User has tickets for this raffle, get raffle details
            const raffleData = await publicClient.readContract({
              address: NADRAFFLE_V4_FAST_CONTRACT.address as `0x${string}`,
              abi: NADRAFFLE_V4_FAST_CONTRACT.abi,
              functionName: 'getRaffle',
              args: [BigInt(i)],
            }) as any;

            const isWinner = raffleData.winner?.toLowerCase() === userAddress.toLowerCase();
            const raffleName = raffleData.title || `Raffle #${i}`;

            userRaffleData.push({
              raffleId: i,
              ticketCount: Number(userTicketCount),
              raffleName,
              status: raffleData.status,
              isWinner,
              rewardClaimed: raffleData.rewardClaimed,
              expirationTime: Number(raffleData.expirationTime),
            });

            // Create notifications for winners
            if (isWinner && !raffleData.rewardClaimed) {
              newNotifications.push({
                id: `winner_${i}_${Date.now()}`,
                type: 'winner',
                raffleId: i,
                raffleName,
                message: `🎉 Congratulations! You won "${raffleName}"! Claim your reward now.`,
                timestamp: Date.now(),
                read: false,
              });
            }

            // Create notifications for ended raffles
            if (raffleData.status === 1 && !isWinner) {
              const now = Date.now() / 1000;
              const endTime = Number(raffleData.expirationTime);
              
              // Only notify if raffle ended recently (within 24 hours)
              if (now - endTime < 86400) {
                newNotifications.push({
                  id: `ended_${i}_${Date.now()}`,
                  type: 'ended',
                  raffleId: i,
                  raffleName,
                  message: `Raffle "${raffleName}" has ended. You didn't win this time, but keep trying!`,
                  timestamp: Date.now(),
                  read: false,
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching raffle ${i}:`, error);
        }
      }

      setUserTickets(userRaffleData);
      
      // Merge with existing notifications, avoiding duplicates
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
        return [...prev, ...uniqueNew].sort((a, b) => b.timestamp - a.timestamp);
      });

    } catch (error) {
      console.error('Error fetching user raffles:', error);
    } finally {
      setIsLoading(false);
    }
  };

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