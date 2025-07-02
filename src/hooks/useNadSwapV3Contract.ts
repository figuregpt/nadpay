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
    console.log('🔐 Checking and handling approvals for offered assets...');
    const unapprovedAssets = [];
    
    for (const asset of offeredAssets) {
      console.log('🔍 Processing offered asset:', asset);
      
      if (asset.isNFT && asset.contractAddress && asset.contractAddress !== "0x0000000000000000000000000000000000000000") {
        console.log('🖼️ Checking NFT approval for:', asset.contractAddress);
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
            args: [address, NADSWAP_V3_CONTRACT.address]
          });

          console.log('🔐 NFT approval status:', isApproved);
          if (!isApproved) {
            console.log('🔄 NFT not approved, will request approval...');
            unapprovedAssets.push({ type: 'NFT', asset, approveFunction: () => approveNFT(asset.contractAddress) });
          }
        } catch (error) {
          console.warn('⚠️ Could not check NFT approval:', error);
          // Continue anyway, might work
        }
      } else if (asset.contractAddress && asset.contractAddress !== "0x0000000000000000000000000000000000000000") {
        console.log('🪙 Checking ERC20 allowance for:', asset.contractAddress);
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
            args: [address, NADSWAP_V3_CONTRACT.address]
          });

          const requiredAmount = parseEther(asset.amount);
          console.log('🔐 ERC20 allowance check:', { allowance: allowance.toString(), required: requiredAmount.toString() });
          
          if (allowance < requiredAmount) {
            console.log('🔄 Insufficient allowance, will request approval...');
            unapprovedAssets.push({ type: 'ERC20', asset, approveFunction: () => approveERC20(asset.contractAddress, asset.amount) });
          }
        } catch (error) {
          console.warn('⚠️ Could not check token allowance:', error);
          // Continue anyway, might work
        }
      } else {
        console.log('💎 Native MON asset, no approval needed');
      }
    }

    // If there are unapproved assets, approve them first and wait
    if (unapprovedAssets.length > 0) {
      console.log('🔄 Found unapproved assets, processing approvals...', unapprovedAssets);
      
      // Process approvals sequentially
      for (const { type, asset, approveFunction } of unapprovedAssets) {
        console.log(`🔄 Requesting ${type} approval for:`, asset.name || asset.contractAddress);
        try {
          const approvalTxHash = await approveFunction();
          console.log(`✅ ${type} approval transaction sent:`, approvalTxHash);
          
          // Wait for approval transaction to be mined
          if (approvalTxHash) {
            console.log('⏳ Waiting for approval transaction to be mined...');
            await waitForTransactionReceipt(config, {
              hash: approvalTxHash,
              timeout: 60000, // 60 second timeout
            });
            console.log(`✅ ${type} approval confirmed on blockchain`);
          }
        } catch (error) {
          console.error(`❌ Failed to approve ${type}:`, error);
          throw new Error(`Failed to approve ${type}. Please try again.`);
        }
      }
      
      console.log('✅ All approvals completed, proceeding with create proposal...');
    }

    const formattedOfferedAssets = offeredAssets.map(asset => ({
      contractAddress: asset.contractAddress as `0x${string}`,
      tokenId: BigInt(asset.tokenId),
      amount: asset.isNFT ? BigInt(asset.tokenId) : parseEther(asset.amount),
      isNFT: asset.isNFT
    }));

    const formattedRequestedAssets = requestedAssets.map(asset => ({
      contractAddress: asset.contractAddress as `0x${string}`,
      tokenId: BigInt(asset.tokenId),
      amount: asset.isNFT ? BigInt(asset.tokenId) : parseEther(asset.amount),
      isNFT: asset.isNFT
    }));

    console.log('🔄 Calling createProposal with writeContractAsync...');
    const txHash = await createProposalAsync({
      address: NADSWAP_V3_CONTRACT.address,
      abi: NADSWAP_V3_CONTRACT.abi,
      functionName: 'createProposal',
      args: [
        targetWallet as `0x${string}`,
        formattedOfferedAssets,
        formattedRequestedAssets
      ],
      value: totalNativeValue
    });
    console.log('✅ createProposal transaction sent:', txHash);
    
    // Wait for transaction confirmation
    console.log('⏳ Waiting for transaction confirmation...');
    await waitForTransactionReceipt(config, {
      hash: txHash,
      timeout: 60000, // 60 second timeout
    });
    console.log('✅ Create proposal transaction confirmed on blockchain');
    
    // Refresh proposals after successful creation
    console.log('🔄 Refreshing proposals after creation...');
    setTimeout(() => {
      refreshProposals();
    }, 2000); // Wait 2 seconds for blockchain to update
    
    return txHash;
  };

  const acceptSwapProposal = async (proposalId: number, requiredNativeValue: bigint = BigInt(0)) => {
    console.log('🚀 acceptSwapProposal called with:', { proposalId, requiredNativeValue, address, publicClient: !!publicClient });
    
    if (!publicClient || !address) {
      console.error('❌ Wallet not connected:', { publicClient: !!publicClient, address });
      throw new Error('Wallet not connected');
    }

    console.log('📋 Getting proposal details for ID:', proposalId);
    // Get the proposal details first
    const proposal = await getProposal(proposalId);
    if (!proposal) {
      console.error('❌ Proposal not found:', proposalId);
      throw new Error('Proposal not found');
    }
    
    console.log('✅ Proposal found:', proposal);

    // Calculate total native MON value needed (native assets that target needs to send)
    let totalNativeValue = requiredNativeValue;
    console.log('💰 Checking requested assets for native MON:', proposal.requestedAssets);
    
    for (const asset of proposal.requestedAssets) {
      console.log('🔍 Checking asset:', asset);
      if (!asset.isNFT && asset.contractAddress === "0x0000000000000000000000000000000000000000") {
        const assetValue = parseEther(asset.amount);
        totalNativeValue += assetValue;
        console.log('💎 Adding native MON value:', asset.amount, 'Total now:', totalNativeValue.toString());
      }
    }
    
    console.log('💰 Final native value to send:', totalNativeValue.toString());

    // Check and handle approvals for requested assets that the target (current user) needs to send
    console.log('🔐 Checking approvals for requested assets...');
    const unapprovedAssets = [];
    
    for (const asset of proposal.requestedAssets) {
      console.log('🔍 Processing asset:', asset);
      
      if (asset.isNFT && asset.contractAddress && asset.contractAddress !== "0x0000000000000000000000000000000000000000") {
        console.log('🖼️ Checking NFT approval for:', asset.contractAddress);
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
            args: [address, NADSWAP_V3_CONTRACT.address]
          });

          console.log('🔐 NFT approval status:', isApproved);
          if (!isApproved) {
            console.log('🔄 NFT not approved, will request approval...');
            unapprovedAssets.push({ type: 'NFT', asset, approveFunction: () => approveNFT(asset.contractAddress) });
          }
        } catch (error) {
          console.warn('⚠️ Could not check NFT approval:', error);
          // Continue anyway, might work
        }
      } else if (asset.contractAddress && asset.contractAddress !== "0x0000000000000000000000000000000000000000") {
        console.log('🪙 Checking ERC20 allowance for:', asset.contractAddress);
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
            args: [address, NADSWAP_V3_CONTRACT.address]
          });

          const requiredAmount = parseEther(asset.amount);
          console.log('🔐 ERC20 allowance check:', { allowance: allowance.toString(), required: requiredAmount.toString() });
          
          if (allowance < requiredAmount) {
            console.log('🔄 Insufficient allowance, will request approval...');
            unapprovedAssets.push({ type: 'ERC20', asset, approveFunction: () => approveERC20(asset.contractAddress, asset.amount) });
          }
        } catch (error) {
          console.warn('⚠️ Could not check token allowance:', error);
          // Continue anyway, might work
        }
      } else {
        console.log('💎 Native MON asset, no approval needed');
      }
    }

    // If there are unapproved assets, approve them first and wait
    if (unapprovedAssets.length > 0) {
      console.log('🔄 Found unapproved assets, processing approvals...', unapprovedAssets);
      
      // Process approvals sequentially
      for (const { type, asset, approveFunction } of unapprovedAssets) {
        console.log(`🔄 Requesting ${type} approval for:`, asset.name || asset.contractAddress);
        try {
          const approvalTxHash = await approveFunction();
          console.log(`✅ ${type} approval transaction sent:`, approvalTxHash);
          
          // Wait for approval transaction to be mined
          if (approvalTxHash) {
            console.log('⏳ Waiting for approval transaction to be mined...');
            await waitForTransactionReceipt(config, {
              hash: approvalTxHash,
              timeout: 60000, // 60 second timeout
            });
            console.log(`✅ ${type} approval confirmed on blockchain`);
          }
        } catch (error) {
          console.error(`❌ Failed to approve ${type}:`, error);
          throw new Error(`Failed to approve ${type}. Please try again.`);
        }
      }
      
      console.log('✅ All approvals completed, proceeding with accept proposal...');
    }

    console.log('✅ All approvals checked, calling acceptProposal...');
    console.log('📝 Transaction params:', {
      address: NADSWAP_V3_CONTRACT.address,
      functionName: 'acceptProposal',
      args: [BigInt(proposalId)],
      value: totalNativeValue.toString()
    });

    try {
      console.log('🔄 Calling acceptProposal with writeContractAsync...');
      const txHash = await acceptProposalAsync({
      address: NADSWAP_V3_CONTRACT.address,
      abi: NADSWAP_V3_CONTRACT.abi,
      functionName: 'acceptProposal',
      args: [BigInt(proposalId)],
        value: totalNativeValue
    });
      console.log('✅ acceptProposal transaction sent:', txHash);
      
      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      await waitForTransactionReceipt(config, {
        hash: txHash,
        timeout: 60000, // 60 second timeout
      });
      console.log('✅ Accept proposal transaction confirmed on blockchain');
      
      // Award points to both participants
      try {
        console.log('🎯 Awarding points for successful swap...');
        
        // Points for the proposer
        await fetch('/api/points/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: proposal.proposer,
            type: 'nadswap',
            amount: 1, // Not relevant for swaps
            txHash: txHash,
            metadata: {
              proposalId,
              targetAddress: address,
              role: 'proposer'
            }
          })
        });
        console.log('✅ Points awarded to proposer:', proposal.proposer);
        
        // Points for the acceptor (current user)
        await fetch('/api/points/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            type: 'nadswap',
            amount: 1, // Not relevant for swaps
            txHash: `${txHash}_acceptor`, // Make unique for acceptor
            metadata: {
              proposalId,
              proposerAddress: proposal.proposer,
              role: 'acceptor'
            }
          })
        });
        console.log('✅ Points awarded to acceptor:', address);
        
      } catch (pointsError) {
        console.error('❌ Error awarding points:', pointsError);
        // Don't fail the swap if points fail
      }
      
      // Refresh proposals after successful acceptance
      console.log('🔄 Refreshing proposals after acceptance...');
      setTimeout(() => {
        refreshProposals();
      }, 2000); // Wait 2 seconds for blockchain to update
      
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
    console.log('🔍 fetchAssetMetadata called with:', asset);
    
    const baseAsset = {
      contractAddress: asset.contractAddress,
      tokenId: Number(asset.tokenId),
      amount: asset.isNFT ? '0' : formatEther(asset.amount),
      isNFT: asset.isNFT
    };

    try {
      if (asset.isNFT) {
        console.log('🖼️ Processing NFT:', asset.contractAddress, 'tokenId:', asset.tokenId);
        
        // Check known NFT collections first
        const knownNFT = getKnownNFT(asset.contractAddress);
        if (knownNFT) {
          // For Nad Name Service, format special display
          if (asset.contractAddress.toLowerCase() === "0x3019bf1dfb84e5b46ca9d0eec37de08a59a41308") {
            return {
              ...baseAsset,
              name: `m${asset.tokenId}.nad`,
              symbol: 'NNS',
              image: knownNFT.image
            };
          }
          
          return {
            ...baseAsset,
            name: `${knownNFT.name} #${asset.tokenId}`,
            symbol: knownNFT.name.split(' ').map(w => w[0]).join('').toUpperCase(),
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

            console.log('📄 TokenURI:', tokenURI, 'Type:', typeof tokenURI);

            if (tokenURI && typeof tokenURI === 'string') {
              // Convert IPFS URLs to HTTP, but keep HTTP URLs as-is
              const convertToHttpUrl = (url: string): string => {
                if (url.startsWith('ipfs://')) {
                  return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
                }
                return url; // Keep HTTP URLs as-is
              };

              const httpUrl = convertToHttpUrl(tokenURI as string);
              console.log('🌐 Fetching metadata from:', httpUrl);
              const response = await fetch(httpUrl);
              
              if (response.ok) {
                const metadata = await response.json();
                const imageUrl = metadata.image ? convertToHttpUrl(metadata.image) : undefined;
                
                console.log('✅ NFT metadata loaded:', metadata.name, imageUrl ? '(with image)' : '(no image)');

                return {
                  ...baseAsset,
                  name: metadata.name || `NFT #${asset.tokenId}`,
                  image: imageUrl
                };
              } else {
                console.warn('❌ Failed to fetch metadata, response status:', response.status);
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