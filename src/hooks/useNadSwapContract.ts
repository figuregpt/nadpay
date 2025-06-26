import { useState, useEffect } from 'react';
import { usePublicClient, useWalletClient, useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// Contract configuration - update after deployment
export const NADSWAP_CONTRACT = {
  address: '0x1B4287f4f0baB446895Aa5e48E49f6C8b303C930' as `0x${string}`, // Updated NadSwap v2 deployed on Monad Testnet without native token support
  abi: [
    // View functions
    {
      name: 'getProposal',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: '_proposalId', type: 'uint256' }],
      outputs: [
        { name: 'id', type: 'uint256' },
        { name: 'proposer', type: 'address' },
        { name: 'targetWallet', type: 'address' },
        { name: 'deadline', type: 'uint256' },
        { name: 'isActive', type: 'bool' },
        { name: 'isAccepted', type: 'bool' },
        { name: 'isExpired', type: 'bool' }
      ]
    },
    {
      name: 'getProposalAssets',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: '_proposalId', type: 'uint256' }],
      outputs: [
        { 
          name: 'offeredAssets', 
          type: 'tuple[]',
          components: [
            { name: 'contractAddress', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
            { name: 'isNFT', type: 'bool' }
          ]
        },
        { 
          name: 'requestedAssets', 
          type: 'tuple[]',
          components: [
            { name: 'contractAddress', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
            { name: 'isNFT', type: 'bool' }
          ]
        }
      ]
    },
    {
      name: 'getUserProposals',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: '_user', type: 'address' }],
      outputs: [{ name: '', type: 'uint256[]' }]
    },
    {
      name: 'getUserReceivedProposals',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: '_user', type: 'address' }],
      outputs: [{ name: '', type: 'uint256[]' }]
    },
    {
      name: 'getActiveProposals',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint256[]' }]
    },
    {
      name: 'getTotalProposals',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }]
    },
    {
      name: 'proposalFee',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }]
    },
    // Write functions
    {
      name: 'createProposal',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        { name: '_targetWallet', type: 'address' },
        { 
          name: '_offeredAssets', 
          type: 'tuple[]',
          components: [
            { name: 'contractAddress', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
            { name: 'isNFT', type: 'bool' }
          ]
        },
        { 
          name: '_requestedAssets', 
          type: 'tuple[]',
          components: [
            { name: 'contractAddress', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
            { name: 'isNFT', type: 'bool' }
          ]
        }
      ],
      outputs: []
    },
    {
      name: 'acceptProposal',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [{ name: '_proposalId', type: 'uint256' }],
      outputs: []
    },
    {
      name: 'cancelProposal',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [{ name: '_proposalId', type: 'uint256' }],
      outputs: []
    },
    {
      name: 'expireProposal',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [{ name: '_proposalId', type: 'uint256' }],
      outputs: []
    },
    // Events
    {
      name: 'ProposalCreated',
      type: 'event',
      inputs: [
        { name: 'proposalId', type: 'uint256', indexed: true },
        { name: 'proposer', type: 'address', indexed: true },
        { name: 'targetWallet', type: 'address', indexed: true },
        { name: 'deadline', type: 'uint256' }
      ]
    },
    {
      name: 'ProposalAccepted',
      type: 'event',
      inputs: [
        { name: 'proposalId', type: 'uint256', indexed: true },
        { name: 'proposer', type: 'address', indexed: true },
        { name: 'accepter', type: 'address', indexed: true }
      ]
    },
    {
      name: 'ProposalCancelled',
      type: 'event',
      inputs: [
        { name: 'proposalId', type: 'uint256', indexed: true },
        { name: 'proposer', type: 'address', indexed: true }
      ]
    },
    {
      name: 'ProposalExpired',
      type: 'event',
      inputs: [
        { name: 'proposalId', type: 'uint256', indexed: true },
        { name: 'proposer', type: 'address', indexed: true }
      ]
    }
  ]
} as const;

export interface SwapAsset {
  contractAddress: string;
  tokenId: number;
  amount: string;
  isNFT: boolean;
  name?: string;
  symbol?: string;
  image?: string;
}

export interface SwapProposal {
  id: number;
  proposer: string;
  targetWallet: string;
  deadline: number;
  isActive: boolean;
  isAccepted: boolean;
  isExpired: boolean;
  offeredAssets: SwapAsset[];
  requestedAssets: SwapAsset[];
}

export function useNadSwapContract() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Write contract hooks
  const { 
    writeContract: createProposal, 
    isPending: isCreatingProposal,
    error: createProposalError 
  } = useWriteContract();
  
  const { 
    writeContract: acceptProposal, 
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
    isPending: isApprovingToken,
    error: approveTokenError 
  } = useWriteContract();

  const { 
    writeContract: approveNFTContract, 
    isPending: isApprovingNFT,
    error: approveNFTError 
  } = useWriteContract();

  // Read contract hooks
  const { data: proposalFee } = useReadContract({
    address: NADSWAP_CONTRACT.address,
    abi: NADSWAP_CONTRACT.abi,
    functionName: 'proposalFee',
  });

  const { data: totalProposals } = useReadContract({
    address: NADSWAP_CONTRACT.address,
    abi: NADSWAP_CONTRACT.abi,
    functionName: 'getTotalProposals',
  });

  const { data: activeProposalIds } = useReadContract({
    address: NADSWAP_CONTRACT.address,
    abi: NADSWAP_CONTRACT.abi,
    functionName: 'getActiveProposals',
  });

  const { data: userProposalIds } = useReadContract({
    address: NADSWAP_CONTRACT.address,
    abi: NADSWAP_CONTRACT.abi,
    functionName: 'getUserProposals',
    args: address ? [address] : undefined,
  });

  const { data: userReceivedProposalIds } = useReadContract({
    address: NADSWAP_CONTRACT.address,
    abi: NADSWAP_CONTRACT.abi,
    functionName: 'getUserReceivedProposals',
    args: address ? [address] : undefined,
  });

  // Helper functions
  const createSwapProposal = async (
    targetWallet: string,
    offeredAssets: SwapAsset[],
    requestedAssets: SwapAsset[]
  ) => {
    if (!proposalFee) throw new Error('Proposal fee not loaded');
    if (!publicClient || !address) throw new Error('Wallet not connected');

    // Validate that no native tokens are being used
    const allAssets = [...offeredAssets, ...requestedAssets];
    for (const asset of allAssets) {
      if (!asset.isNFT && asset.contractAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error('Native MON tokens are not supported in swaps. Please use ERC20 tokens only.');
      }
    }

    // Check and approve offered assets before creating proposal
    for (const asset of offeredAssets) {
      if (asset.isNFT) {
        // Check NFT approval
        try {
          const isApproved = await publicClient.readContract({
            address: asset.contractAddress as `0x${string}`,
            abi: [
              {
                inputs: [{ name: 'owner', type: 'address' }, { name: 'operator', type: 'address' }],
                name: 'isApprovedForAll',
                outputs: [{ name: '', type: 'bool' }],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            functionName: 'isApprovedForAll',
            args: [address, NADSWAP_CONTRACT.address]
          });

          if (!isApproved) {
            throw new Error(`Please approve the NadSwap contract to transfer your ${asset.name || 'NFT'} first. Go to the NFT collection and set approval for all.`);
          }
        } catch (error) {
          console.warn('Could not check NFT approval:', error);
          // Continue anyway, let the transaction fail with a clearer error
        }
      } else {
        // Check ERC20 allowance for all ERC20 tokens
        try {
          const allowance = await publicClient.readContract({
            address: asset.contractAddress as `0x${string}`,
            abi: [
              {
                inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
                name: 'allowance',
                outputs: [{ name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            functionName: 'allowance',
            args: [address, NADSWAP_CONTRACT.address]
          });

          const requiredAmount = parseEther(asset.amount);
          if (allowance < requiredAmount) {
            throw new Error(`Insufficient allowance for ${asset.symbol || 'token'}. Please approve the NadSwap contract to spend your tokens first.`);
          }
        } catch (error) {
          console.warn('Could not check token allowance:', error);
          // Continue anyway, let the transaction fail with a clearer error
        }
      }
    }

    const formattedOfferedAssets = offeredAssets.map(asset => ({
      contractAddress: asset.contractAddress as `0x${string}`,
      tokenId: BigInt(asset.tokenId),
      amount: asset.isNFT ? BigInt(0) : parseEther(asset.amount),
      isNFT: asset.isNFT
    }));

    const formattedRequestedAssets = requestedAssets.map(asset => ({
      contractAddress: asset.contractAddress as `0x${string}`,
      tokenId: BigInt(asset.tokenId),
      amount: asset.isNFT ? BigInt(0) : parseEther(asset.amount),
      isNFT: asset.isNFT
    }));

    // Only send proposal fee (no native tokens in assets anymore)
    return createProposal({
      address: NADSWAP_CONTRACT.address,
      abi: NADSWAP_CONTRACT.abi,
      functionName: 'createProposal',
      args: [
        targetWallet as `0x${string}`,
        formattedOfferedAssets,
        formattedRequestedAssets
      ],
      value: proposalFee as bigint
    });
  };

  const acceptSwapProposal = async (proposalId: number) => {
    return acceptProposal({
      address: NADSWAP_CONTRACT.address,
      abi: NADSWAP_CONTRACT.abi,
      functionName: 'acceptProposal',
      args: [BigInt(proposalId)]
    });
  };

  const cancelSwapProposal = async (proposalId: number) => {
    return cancelProposal({
      address: NADSWAP_CONTRACT.address,
      abi: NADSWAP_CONTRACT.abi,
      functionName: 'cancelProposal',
      args: [BigInt(proposalId)]
    });
  };

  const expireSwapProposal = async (proposalId: number) => {
    return expireProposal({
      address: NADSWAP_CONTRACT.address,
      abi: NADSWAP_CONTRACT.abi,
      functionName: 'expireProposal',
      args: [BigInt(proposalId)]
    });
  };

  // Approval functions
  const approveERC20 = async (tokenAddress: string, amount: string) => {
    if (!publicClient) throw new Error('Wallet not connected');
    
    return approveToken({
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
      args: [NADSWAP_CONTRACT.address, parseEther(amount)]
    });
  };

  const approveNFT = async (nftAddress: string) => {
    if (!publicClient) throw new Error('Wallet not connected');
    
    return approveNFTContract({
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
      args: [NADSWAP_CONTRACT.address, true]
    });
  };

  const getProposal = async (proposalId: number): Promise<SwapProposal | null> => {
    if (!publicClient) return null;

    try {
      const [proposalData, assetsData] = await Promise.all([
        publicClient.readContract({
          address: NADSWAP_CONTRACT.address,
          abi: NADSWAP_CONTRACT.abi,
          functionName: 'getProposal',
          args: [BigInt(proposalId)]
        }),
        publicClient.readContract({
          address: NADSWAP_CONTRACT.address,
          abi: NADSWAP_CONTRACT.abi,
          functionName: 'getProposalAssets',
          args: [BigInt(proposalId)]
        })
      ]);

      const [id, proposer, targetWallet, deadline, isActive, isAccepted, isExpired] = proposalData as unknown as any[];
      const [offeredAssets, requestedAssets] = assetsData as unknown as any[];

      return {
        id: Number(id),
        proposer,
        targetWallet,
        deadline: Number(deadline),
        isActive,
        isAccepted,
        isExpired,
        offeredAssets: offeredAssets.map((asset: any) => ({
          contractAddress: asset.contractAddress,
          tokenId: Number(asset.tokenId),
          amount: asset.isNFT ? '0' : formatEther(asset.amount),
          isNFT: asset.isNFT
        })),
        requestedAssets: requestedAssets.map((asset: any) => ({
          contractAddress: asset.contractAddress,
          tokenId: Number(asset.tokenId),
          amount: asset.isNFT ? '0' : formatEther(asset.amount),
          isNFT: asset.isNFT
        }))
      };
    } catch (error) {
      console.error('Error fetching proposal:', error);
      return null;
    }
  };

  const getMultipleProposals = async (proposalIds: number[]): Promise<SwapProposal[]> => {
    if (!proposalIds.length) return [];
    
    const proposals = await Promise.all(
      proposalIds.map(id => getProposal(id))
    );
    
    return proposals.filter((p): p is SwapProposal => p !== null);
  };

  return {
    // Contract data
    proposalFee: proposalFee ? formatEther(proposalFee as bigint) : '0',
    totalProposals: totalProposals ? Number(totalProposals) : 0,
    activeProposalIds: activeProposalIds ? (activeProposalIds as bigint[]).map(id => Number(id)) : [],
    userProposalIds: userProposalIds ? (userProposalIds as bigint[]).map(id => Number(id)) : [],
    userReceivedProposalIds: userReceivedProposalIds ? (userReceivedProposalIds as bigint[]).map(id => Number(id)) : [],
    
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
  };
} 