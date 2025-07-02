import { useState, useEffect, useCallback } from 'react';
import { usePublicClient, useWalletClient, useAccount, useWriteContract, useReadContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { parseEther, formatEther } from 'viem';
import { config } from '@/lib/wagmi';
import { getKnownToken, getKnownNFT } from '@/lib/knownAssets';
import nadswapAbi from '../../NadSwapV3-UltraSecure.abi.json';

// Contract configuration - Ultra-Secure Version
export const NADSWAP_V3_CONTRACT = {
  address: '0x982403dcb43b6aaD6E5425CC360fDBbc81FB6a3f' as `0x${string}`,
  abi: nadswapAbi as any, // Use imported ABI instead of inline
};

export interface SwapAssetV3 {
  contractAddress: string;
  tokenId: number;
  amount: string;
  isNFT: boolean;
  name?: string;
  symbol?: string;
  image?: string;
}

export interface SwapProposalV3 {
  id: number;
  proposer: string;
  targetWallet: string;
  deadline: number;
  isActive: boolean;
  isAccepted: boolean;
  isExpired: boolean;
  createdAt: number;
  offeredAssets: SwapAssetV3[];
  requestedAssets: SwapAssetV3[];
}

export function useNadSwapV3Contract() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Write contract hooks
  const { 
    writeContract: createProposal, 
    writeContractAsync: createProposalAsync,
    isPending: isCreatingProposal,
    error: createProposalError,
    data: createProposalHash
  } = useWriteContract();
  
  const { 
    writeContract: acceptProposal, 
    writeContractAsync: acceptProposalAsync,
    isPending: isAcceptingProposal,
    error: acceptProposalError 
  } = useWriteContract();
  
  const { 
    writeContract: cancelProposal, 
    isPending: isCancellingProposal,
    error: cancelProposalError 
  } = useWriteContract();
  
  const { 
    writeContract: expireProposal, 
    isPending: isExpiringProposal,
    error: expireProposalError 
  } = useWriteContract();

  const { 
    writeContract: approveToken, 
    writeContractAsync: approveTokenAsync,
    isPending: isApprovingToken,
    error: approveTokenError 
  } = useWriteContract();

  const { 
    writeContract: approveNFTContract, 
    writeContractAsync: approveNFTAsync,
    isPending: isApprovingNFT,
    error: approveNFTError 
  } = useWriteContract();

  // Read contract hooks with pagination for ultra-secure contract
  const { data: proposalFee } = useReadContract({
    address: NADSWAP_V3_CONTRACT.address,
    abi: NADSWAP_V3_CONTRACT.abi,
    functionName: 'proposalFee',
  });

  const { data: proposalDuration } = useReadContract({
    address: NADSWAP_V3_CONTRACT.address,
    abi: NADSWAP_V3_CONTRACT.abi,
    functionName: 'proposalDuration',
  });

  const { data: totalProposals } = useReadContract({
    address: NADSWAP_V3_CONTRACT.address,
    abi: NADSWAP_V3_CONTRACT.abi,
    functionName: 'proposalCounter', // Changed from getTotalProposals to proposalCounter for ultra-secure
  });

  // Updated for pagination in ultra-secure contract - manual contract calls since ABI types are incorrect
  const [userProposalIds, setUserProposalIds] = useState<number[]>([]);
  const [userReceivedProposalIds, setUserReceivedProposalIds] = useState<number[]>([]);

  // Fetch user proposals manually using viem with correct imported ABI
  useEffect(() => {
    const fetchUserProposals = async () => {
      if (!address || !publicClient) return;
      
      try {
        const result = await publicClient.readContract({
          address: NADSWAP_V3_CONTRACT.address,
          abi: NADSWAP_V3_CONTRACT.abi,
          functionName: 'getUserProposals',
          args: [address, BigInt(0), BigInt(50)]
        });
        
        const proposalIds = (result as any).proposalIds || (result as any)[0] || [];
        setUserProposalIds(proposalIds.map((id: any) => Number(id)));
      } catch (error) {
        console.error('Error fetching user proposals:', error);
        setUserProposalIds([]);
      }
    };

    fetchUserProposals();
  }, [address, publicClient]);

  // For received proposals, check all proposals to see which ones target this user
  useEffect(() => {
    const fetchReceivedProposals = async () => {
      if (!address || !publicClient || !totalProposals) return;
      
      try {
        const receivedIds: number[] = [];
        const totalCount = Number(totalProposals);
        
        // Check last 50 proposals for ones targeting this user
        const startId = Math.max(1, totalCount - 49);
        
        for (let i = startId; i <= totalCount; i++) {
          try {
            // Use getProposal function instead of proposals mapping
            const proposal = await publicClient.readContract({
              address: NADSWAP_V3_CONTRACT.address,
              abi: NADSWAP_V3_CONTRACT.abi,
              functionName: 'getProposal',
              args: [BigInt(i)]
            });
            
            const proposalData = proposal as any;
            
            if (proposalData[2]?.toLowerCase() === address.toLowerCase()) {
              receivedIds.push(i);
            }
          } catch (error) {
            // Skip failed proposals
            continue;
          }
        }
        
        setUserReceivedProposalIds(receivedIds);
      } catch (error) {
        console.error('Error fetching received proposals:', error);
        setUserReceivedProposalIds([]);
      }
    };

    fetchReceivedProposals();
  }, [address, publicClient, totalProposals]);

  // Helper functions
  const createSwapProposal = async (
    targetWallet: string,
    offeredAssets: SwapAssetV3[],
    requestedAssets: SwapAssetV3[]
  ) => {
    if (!proposalFee) throw new Error('Proposal fee not loaded');
    if (!publicClient || !address) throw new Error('Wallet not connected');

    // Calculate total native MON value needed (proposal fee + native assets)
    let totalNativeValue = proposalFee as bigint;
    for (const asset of offeredAssets) {
      if (!asset.isNFT && asset.contractAddress === "0x0000000000000000000000000000000000000000") {
        totalNativeValue += parseEther(asset.amount);
      }
    }

    // Check and handle approvals for offered assets before creating proposal
    {
      }
        } catch (error) {
          console.warn('⚠️ Could not check NFT approval:', error);
          // Continue anyway, might work
        }
      } else if (asset.contractAddress && asset.contractAddress !== "0x0000000000000000000000000000000000000000") {
        const requiredAmount = parseEther(asset.amount);
          if (allowance < requiredAmount) {
            }
        } catch (error) {
          console.warn('⚠️ Could not check token allowance:', error);
          // Continue anyway, might work
        }
      } else {
        {
      {
        try {
          const approvalTxHash = await approveFunction();
          // Wait for approval transaction to be mined
          if (approvalTxHash) {
            }
        } catch (error) {
          console.error(`❌ Failed to approve ${type}:`, error);
          throw new Error(`Failed to approve ${type}. Please try again.`);
        }
      }
      
      ,
      amount: asset.isNFT ? BigInt(asset.tokenId) : parseEther(asset.amount),
      isNFT: asset.isNFT
    }));

    const formattedRequestedAssets = requestedAssets.map(asset => ({
      contractAddress: asset.contractAddress as `0x${string}`,
      tokenId: BigInt(asset.tokenId),
      amount: asset.isNFT ? BigInt(asset.tokenId) : parseEther(asset.amount),
      isNFT: asset.isNFT
    }));

    // Wait 2 seconds for blockchain to update
    
    return txHash;
  };

  const acceptSwapProposal = async (proposalId: number, requiredNativeValue: bigint = BigInt(0)) => {
    if (!publicClient || !address) {
      console.error('❌ Wallet not connected:', { publicClient: !!publicClient, address });
      throw new Error('Wallet not connected');
    }

    // Calculate total native MON value needed (native assets that target needs to send)
    let totalNativeValue = requiredNativeValue;
    );

    // Check and handle approvals for requested assets that the target (current user) needs to send
    {
      }
        } catch (error) {
          console.warn('⚠️ Could not check NFT approval:', error);
          // Continue anyway, might work
        }
      } else if (asset.contractAddress && asset.contractAddress !== "0x0000000000000000000000000000000000000000") {
        const requiredAmount = parseEther(asset.amount);
          if (allowance < requiredAmount) {
            }
        } catch (error) {
          console.warn('⚠️ Could not check token allowance:', error);
          // Continue anyway, might work
        }
      } else {
        {
      {
        try {
          const approvalTxHash = await approveFunction();
          // Wait for approval transaction to be mined
          if (approvalTxHash) {
            }
        } catch (error) {
          console.error(`❌ Failed to approve ${type}:`, error);
          throw new Error(`Failed to approve ${type}. Please try again.`);
        }
      }
      
      try {
      });
        });
        {
        console.error('❌ Error awarding points:', pointsError);
        // Don't fail the swap if points fail
      }
      
      // Refresh proposals after successful acceptance
      // Wait 2 seconds for blockchain to update
      
      return txHash;
    } catch (error) {
      console.error('❌ acceptProposal failed:', error);
      throw error;
    }
  };

  const cancelSwapProposal = async (proposalId: number) => {
    return cancelProposal({
      address: NADSWAP_V3_CONTRACT.address,
      abi: NADSWAP_V3_CONTRACT.abi,
      functionName: 'cancelProposal',
      args: [BigInt(proposalId)]
    });
  };

  const expireSwapProposal = async (proposalId: number) => {
    return expireProposal({
      address: NADSWAP_V3_CONTRACT.address,
      abi: NADSWAP_V3_CONTRACT.abi,
      functionName: 'expireProposal',
      args: [BigInt(proposalId)]
    });
  };

  // Approval functions
  const approveERC20 = async (tokenAddress: string, amount: string) => {
    if (!publicClient) throw new Error('Wallet not connected');
    
    return approveTokenAsync({
      address: tokenAddress as `0x${string}`,
      abi: [
        {
          inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      functionName: 'approve',
      args: [NADSWAP_V3_CONTRACT.address, parseEther(amount)]
    });
  };

  const approveNFT = async (nftAddress: string) => {
    if (!publicClient) throw new Error('Wallet not connected');
    
    return approveNFTAsync({
      address: nftAddress as `0x${string}`,
      abi: [
        {
          inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
          name: 'setApprovalForAll',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      functionName: 'setApprovalForAll',
      args: [NADSWAP_V3_CONTRACT.address, true]
    });
  };

  // Helper function to fetch asset metadata
  const fetchAssetMetadata = useCallback(async (asset: any): Promise<SwapAssetV3> => {
    {
        .map(w => w[0]).join('').toUpperCase(),
            image: knownNFT.image
          };
        }

        // Fetch NFT metadata from contract using the same method as raffle
        if (publicClient) {
          try {
            // Get token URI
            const tokenURI = await publicClient.readContract({
              address: asset.contractAddress as `0x${string}`,
              abi: [
                {
                  inputs: [{ name: 'tokenId', type: 'uint256' }],
                  name: 'tokenURI',
                  outputs: [{ name: '', type: 'string' }],
                  stateMutability: 'view',
                  type: 'function',
                },
              ],
              functionName: 'tokenURI',
              args: [BigInt(asset.tokenId)]
            });

            }
            } else {
              console.warn('❌ No tokenURI returned from contract');
            }
          } catch (error) {
            console.warn('❌ Failed to fetch NFT metadata:', error);
          }
        }

        // Fallback for NFTs
        return {
          ...baseAsset,
          name: `NFT #${asset.tokenId}`
        };
      } else {
        // Check known tokens first
        const knownToken = getKnownToken(asset.contractAddress);
        if (knownToken) {
          return {
            ...baseAsset,
            name: knownToken.name,
            symbol: knownToken.symbol,
            image: knownToken.logo
          };
        }

        // Fetch ERC20 token metadata from contract
        if (publicClient) {
          try {
            const [name, symbol] = await Promise.all([
              publicClient.readContract({
                address: asset.contractAddress as `0x${string}`,
                abi: [
                  {
                    inputs: [],
                    name: 'name',
                    outputs: [{ name: '', type: 'string' }],
                    stateMutability: 'view',
                    type: 'function',
                  },
                ],
                functionName: 'name'
              }).catch(() => 'Unknown Token'),
              publicClient.readContract({
                address: asset.contractAddress as `0x${string}`,
                abi: [
                  {
                    inputs: [],
                    name: 'symbol',
                    outputs: [{ name: '', type: 'string' }],
                    stateMutability: 'view',
                    type: 'function',
                  },
                ],
                functionName: 'symbol'
              }).catch(() => 'UNK')
            ]);

            return {
              ...baseAsset,
              name: name as string,
              symbol: symbol as string
            };
          } catch (error) {
            console.warn('Failed to fetch token metadata:', error);
          }
        }

        // Fallback for tokens
        return {
          ...baseAsset,
          name: 'Unknown Token',
          symbol: 'UNK'
        };
      }
    } catch (error) {
      console.error('Error fetching asset metadata:', error);
      return baseAsset;
    }
  }, [publicClient]);

  const getProposal = useCallback(async (proposalId: number): Promise<SwapProposalV3 | null> => {
    if (!publicClient) return null;

    try {
      const [proposalData, assetsData] = await Promise.all([
        publicClient.readContract({
          address: NADSWAP_V3_CONTRACT.address,
          abi: NADSWAP_V3_CONTRACT.abi,
          functionName: 'getProposal',
          args: [BigInt(proposalId)]
        }),
        publicClient.readContract({
          address: NADSWAP_V3_CONTRACT.address,
          abi: NADSWAP_V3_CONTRACT.abi,
          functionName: 'getProposalAssets',
          args: [BigInt(proposalId)]
        })
      ]);

      const [id, proposer, targetWallet, deadline, isActive, isAccepted, isExpired, createdAt] = proposalData as unknown as any[];
      const [offeredAssets, requestedAssets] = assetsData as unknown as any[];

      // Fetch metadata for all assets
      const [enrichedOfferedAssets, enrichedRequestedAssets] = await Promise.all([
        Promise.all(offeredAssets.map((asset: any) => fetchAssetMetadata(asset))),
        Promise.all(requestedAssets.map((asset: any) => fetchAssetMetadata(asset)))
      ]);

      return {
        id: Number(id),
        proposer,
        targetWallet,
        deadline: Number(deadline),
        isActive,
        isAccepted,
        isExpired,
        createdAt: Number(createdAt),
        offeredAssets: enrichedOfferedAssets,
        requestedAssets: enrichedRequestedAssets
      };
    } catch (error) {
      console.error('Error fetching proposal:', error);
      return null;
    }
  }, [publicClient, fetchAssetMetadata]);

  // Refresh function to manually update proposals
  const refreshProposals = useCallback(async () => {
    if (!address || !publicClient) return;
    
    try {
      // Refresh user proposals (sent)
      const result = await publicClient.readContract({
        address: NADSWAP_V3_CONTRACT.address,
        abi: NADSWAP_V3_CONTRACT.abi,
        functionName: 'getUserProposals',
        args: [address, BigInt(0), BigInt(50)]
      });
      
      const proposalIds = (result as any).proposalIds || (result as any)[0] || [];
      setUserProposalIds(proposalIds.map((id: any) => Number(id)));
      
      // Also refresh received proposals
      const totalCount = await publicClient.readContract({
        address: NADSWAP_V3_CONTRACT.address,
        abi: NADSWAP_V3_CONTRACT.abi,
        functionName: 'proposalCounter',
        args: []
      });
      
      const receivedIds: number[] = [];
      const total = Number(totalCount);
      
      // Check last 50 proposals for ones targeting this user
      const startId = Math.max(1, total - 49);
      
      for (let i = startId; i <= total; i++) {
        try {
          const proposal = await publicClient.readContract({
            address: NADSWAP_V3_CONTRACT.address,
            abi: NADSWAP_V3_CONTRACT.abi,
            functionName: 'getProposal',
            args: [BigInt(i)]
          });
          
          const proposalData = proposal as any;
          
          if (proposalData[2]?.toLowerCase() === address.toLowerCase()) {
            receivedIds.push(i);
          }
        } catch (error) {
          // Skip failed proposals
          continue;
        }
      }
      
      setUserReceivedProposalIds(receivedIds);
    } catch (error) {
      console.error('Error refreshing proposals:', error);
    }
  }, [address, publicClient]);

  const getMultipleProposals = useCallback(async (proposalIds: number[]): Promise<SwapProposalV3[]> => {
    if (!proposalIds.length) return [];
    
    const proposals = await Promise.all(
      proposalIds.map(id => getProposal(id))
    );
    
    return proposals.filter((p): p is SwapProposalV3 => p !== null);
  }, [getProposal]);

  return {
    // Contract data
    proposalFee: proposalFee ? formatEther(proposalFee as bigint) : '0',
    proposalDuration: proposalDuration ? Number(proposalDuration) : 0,
    totalProposals: totalProposals ? Number(totalProposals) : 0,
    userProposalIds: userProposalIds,
    userReceivedProposalIds: userReceivedProposalIds,
    
    // Write functions
    createSwapProposal,
    acceptSwapProposal,
    cancelSwapProposal,
    expireSwapProposal,
    
    // Approval functions
    approveERC20,
    approveNFT,
    
    // Read functions
    getProposal,
    getMultipleProposals,
    refreshProposals,
    
    // Loading states
    isCreatingProposal,
    isAcceptingProposal,
    isCancellingProposal,
    isExpiringProposal,
    isApprovingToken,
    isApprovingNFT,
    
    // Errors
    createProposalError,
    acceptProposalError,
    cancelProposalError,
    expireProposalError,
    approveTokenError,
    approveNFTError,
    
    // Transaction hashes
    createProposalHash,
  };
}