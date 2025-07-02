const fs = require('fs');
const path = require('path');

async function main() {
  //process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  //process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  //}
} as const;

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
    isPending: isCreatingProposal,
    error: createProposalError,
    data: createProposalHash
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
    functionName: 'getTotalProposals',
  });

  const { data: userProposalIds } = useReadContract({
    address: NADSWAP_V3_CONTRACT.address,
    abi: NADSWAP_V3_CONTRACT.abi,
    functionName: 'getUserProposals',
    args: address ? [address] : undefined,
  });

  const { data: userReceivedProposalIds } = useReadContract({
    address: NADSWAP_V3_CONTRACT.address,
    abi: NADSWAP_V3_CONTRACT.abi,
    functionName: 'getUserReceivedProposals',
    args: address ? [address] : undefined,
  });

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

    // Check and approve offered assets before creating proposal
    for (const asset of offeredAssets) {
      if (asset.isNFT) {
        // Check NFT approval
        try {
          const isApproved = await publicClient.readContract({
            address: asset.contractAddress as \`0x\${string}\`,
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

          if (!isApproved) {
            throw new Error(\`Please approve the NadSwap contract to transfer your \${asset.name || 'NFT'} first. Go to the NFT collection and set approval for all.\`);
          }
        } catch (error) {
          //console.warn('Could not check NFT approval:', error);
        }
      } else if (asset.contractAddress !== "0x0000000000000000000000000000000000000000") {
        // Check ERC20 allowance for all ERC20 tokens
        try {
          const allowance = await publicClient.readContract({
            address: asset.contractAddress as \`0x\${string}\`,
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
          if (allowance < requiredAmount) {
            throw new Error(\`Insufficient allowance for \${asset.symbol || 'token'}. Please approve the NadSwap contract to spend your tokens first.\`);
          }
        } catch (error) {
          //console.warn('Could not check token allowance:', error);
        }
      }
    }

    const formattedOfferedAssets = offeredAssets.map(asset => ({
      contractAddress: asset.contractAddress as \`0x\${string}\`,
      tokenId: BigInt(asset.tokenId),
      amount: asset.isNFT ? BigInt(0) : parseEther(asset.amount),
      isNFT: asset.isNFT
    }));

    const formattedRequestedAssets = requestedAssets.map(asset => ({
      contractAddress: asset.contractAddress as \`0x\${string}\`,
      tokenId: BigInt(asset.tokenId),
      amount: asset.isNFT ? BigInt(0) : parseEther(asset.amount),
      isNFT: asset.isNFT
    }));

    return createProposal({
      address: NADSWAP_V3_CONTRACT.address,
      abi: NADSWAP_V3_CONTRACT.abi,
      functionName: 'createProposal',
      args: [
        targetWallet as \`0x\${string}\`,
        formattedOfferedAssets,
        formattedRequestedAssets
      ],
      value: totalNativeValue
    });
  };

  const acceptSwapProposal = async (proposalId: number, requiredNativeValue: bigint = BigInt(0)) => {
    return acceptProposal({
      address: NADSWAP_V3_CONTRACT.address,
      abi: NADSWAP_V3_CONTRACT.abi,
      functionName: 'acceptProposal',
      args: [BigInt(proposalId)],
      value: requiredNativeValue
    });
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
    
    return approveToken({
      address: tokenAddress as \`0x\${string}\`,
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
    
    return approveNFTContract({
      address: nftAddress as \`0x\${string}\`,
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

  const getProposal = async (proposalId: number): Promise<SwapProposalV3 | null> => {
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

      return {
        id: Number(id),
        proposer,
        targetWallet,
        deadline: Number(deadline),
        isActive,
        isAccepted,
        isExpired,
        createdAt: Number(createdAt),
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
      //console.error('Error fetching proposal:', error);
      return null;
    }
  };

  const getMultipleProposals = async (proposalIds: number[]): Promise<SwapProposalV3[]> => {
    if (!proposalIds.length) return [];
    
    const proposals = await Promise.all(
      proposalIds.map(id => getProposal(id))
    );
    
    return proposals.filter((p): p is SwapProposalV3 => p !== null);
  };

  return {
    // Contract data
    proposalFee: proposalFee ? formatEther(proposalFee as bigint) : '0',
    proposalDuration: proposalDuration ? Number(proposalDuration) : 0,
    totalProposals: totalProposals ? Number(totalProposals) : 0,
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
    
    // Transaction hashes
    createProposalHash,
  };
}`;

  // Write the hook file
  const hookPath = path.join(__dirname, '../src/hooks/useNadSwapV3Contract.ts');
  fs.writeFileSync(hookPath, hookContent);
  //fs.writeFileSync(abiPath, abiContent);
  ////}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    //console.error("❌ ABI generation failed:", error);
    process.exit(1);
  }); 