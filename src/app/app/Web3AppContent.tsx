"use client";

import { useState, useEffect } from "react";
import { Wallet, Link2, Upload, X, Calendar, QrCode, Clock, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { useAccount, useSwitchChain, useBalance, useReadContracts, useReadContract, usePublicClient, useWalletClient } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { usePersistentWallet } from "@/hooks/usePersistentWallet";
import { useCreatePaymentLinkV2 } from "@/hooks/useNadPayV2Contract";
import { useNadRaffleV3Contract } from "@/hooks/useNadRaffleV3Contract";
import { useAssetBalances } from "@/hooks/useAssetBalances";
import { LogOut } from "lucide-react";
import { createPublicClient, http, parseEther } from "viem";
import { createPredictableSecureRaffleId } from "@/lib/linkUtils";
import { AssetSelector, SelectedAsset } from "@/components/AssetSelector";
import { KnownToken, KnownNFT } from "@/lib/knownAssets";
import { NFTWithMetadata } from "@/hooks/useNFTMetadata";
import { usePathname } from "next/navigation";

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  logo?: string;
}

interface NFTInfo {
  address: string;
  tokenId: string;
  name?: string;
  image?: string;
  collectionName?: string;
}

export default function Web3AppContent() {
  const pathname = usePathname();
  const { address, isConnected, chain, status } = useAccount();
  const { 
    hasAttemptedReconnect,
    disconnect: persistentDisconnect
  } = usePersistentWallet();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({
    address: address,
    chainId: 10143, // Monad Testnet
  });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Determine page type based on pathname
  const pageType = pathname.includes('/create') ? 'raffle' : 
                   pathname.includes('/payments') ? 'payment' : 
                   'raffle'; // Default to raffle for main /app page
  
  // Template selection state - auto-select based on page
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(pageType);
  
  // Payment link form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    totalSales: '',
    maxPerWallet: '',
    price: '',
    paymentToken: '', // Multi-token support
    expireDate: ''
  });

  // Raffle form state
  const [raffleFormData, setRaffleFormData] = useState({
    title: '',
    description: '',
    imageHash: '',
    rewardType: 'TOKEN' as 'TOKEN' | 'NFT',
    rewardTokenAddress: '',
    rewardAmount: '',
    ticketPrice: '0.01',
    ticketPaymentToken: '', // For V2 contract multi-token support
    maxTickets: 100,
    maxTicketsPerWallet: 10,
    expirationDateTime: '',
    autoDistributeOnSoldOut: true, // Always true - auto-distribute enabled by default
  });

  // Selected asset state for new asset selector
  const [selectedRewardAsset, setSelectedRewardAsset] = useState<SelectedAsset | null>(null);
  const [selectedTicketPaymentAsset, setSelectedTicketPaymentAsset] = useState<SelectedAsset | null>(null);
  const [selectedPaymentAsset, setSelectedPaymentAsset] = useState<SelectedAsset | null>(null);

  
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Wallet assets state
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [userTokens, setUserTokens] = useState<TokenInfo[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFTInfo[]>([]);

  // Template options
  const templates = [
    { id: 'payment', name: 'Payment Link', icon: '💳', description: 'Simple payment collection' },
    { id: 'raffle', name: 'Raffle', icon: '🎫', description: 'Create raffle with NFT/Token rewards' },
    { id: 'subscription', name: 'Subscription', icon: '⚡', description: 'Recurring payments' },
    { id: 'nft-presale', name: 'Pre-sell NFT collection', icon: 'NFT', description: 'NFT pre-sale campaign' },
    { id: 'physical', name: 'Physical product', icon: '🔗', description: 'Sell physical items' },
    { id: 'dynamic', name: 'Dynamic pricing', icon: '⚙️', description: 'Variable pricing system' },
    { id: 'discord', name: 'Discord membership', icon: '🥞', description: 'Discord access tokens' },
    { id: 'telegram', name: 'Telegram membership', icon: '✈️', description: 'Telegram group access' },
    { id: 'event', name: 'Event', icon: '📅', description: 'Event ticket sales' },
    { id: 'nft-private', name: 'NFT - Private listing', icon: 'OTC', description: 'Private NFT sales' },
    { id: 'video', name: 'Video', icon: '▶️', description: 'Video content access' },
    { id: 'woocommerce', name: 'WooCommerce', icon: 'W🛒', description: 'E-commerce integration' },
    { id: 'blinks', name: 'Blinks', icon: '✨', description: 'Social payment links' },
  ];
  
  // Contract hooks
  const { 
    createPaymentLink, 
    getLinkIdFromTransaction,
    isPending: isCreating, 
    isConfirming, 
    isConfirmed, 
    error: contractError,
    hash 
  } = useCreatePaymentLinkV2();

  const {
    createRaffle,
    getRaffleIdFromTransaction,
    isPending: isRaffleCreating,
    isConfirming: isRaffleConfirming,
    isConfirmed: isRaffleConfirmed,
    error: raffleError,
    hash: raffleHash
  } = useNadRaffleV3Contract();

  // Use hardcoded asset balances hook
  const { tokenBalances, nftBalances, isLoading: isLoadingKnownAssets, refresh: refreshKnownAssets } = useAssetBalances();

  // Create secure link ID using transaction hash as seed
  const createSecureLinkId = (internalId: number, txHash: string): string => {
    // Use transaction hash as timestamp to ensure consistency
    const hashSeed = parseInt(txHash.slice(-8), 16); // Last 8 chars of tx hash as number
    const combined = `${internalId}_${hashSeed}_nadpay`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${hashSeed}_${Math.abs(hash).toString(16).slice(0, 8)}`;
  };

  const handleSwitchToMonad = () => {
    if (switchChain) {
      switchChain({ chainId: 10143 });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRaffleInputChange = (field: string, value: string | number | boolean) => {
    setRaffleFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Special handler for ticket price to ensure English decimal format
  const handleTicketPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Replace comma with dot for English decimal format
    value = value.replace(',', '.');
    // Ensure only valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleRaffleInputChange('ticketPrice', value);
    }
  };

  // ENVIO: GraphQL-based token discovery
  // This replaces the complex onchain scanning with simple API calls
  const discoverUserTokens = async (address: string): Promise<TokenInfo[]> => {
    try {
      console.log(`🔍 Starting ENVIO token discovery for address: ${address}`);
      console.log(`⚡ Using GraphQL indexer for blazing fast results`);
      
      const publicClient = createPublicClient({
        chain: {
          id: 41004,
          name: 'Monad Testnet',
          nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://testnet-rpc.monad.xyz'] }
          }
        },
        transport: http()
      });

      const tokens: TokenInfo[] = [];
      
      // Step 1: Add native MON token
      try {
        console.log(`💰 Checking native MON balance...`);
        const monBalance = await publicClient.getBalance({
          address: address as `0x${string}`
        });
        
        if (monBalance > BigInt(0)) {
          const monBalanceFormatted = (Number(monBalance) / Math.pow(10, 18)).toFixed(6);
          tokens.push({
            address: '0x0000000000000000000000000000000000000000',
            name: 'Monad',
            symbol: 'MON',
            decimals: 18,
            balance: monBalanceFormatted,
            logo: '⚡'
          });
          console.log(`✅ Native MON: ${monBalanceFormatted}`);
        }
      } catch (error) {
        console.error('Error getting MON balance:', error);
      }

      // Step 2: ENVIO GraphQL Query for ERC20 tokens
      const ENVIO_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_ENDPOINT || 'http://localhost:8080/v1/graphql';
      
      try {
        console.log(`📡 Querying Envio indexer for token transfers...`);
        
        const response = await fetch(ENVIO_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query GetUserTokens($userAddress: String!) {
                # Get tokens from purchases (payments received)
                purchases(where: {buyer: $userAddress}) {
                  paymentLink {
                    creator
                    title
                    price
                  }
                  amount
                  totalPrice
                }
                
                # Get tokens from raffle tickets (MON spent on tickets)
                tickets(where: {buyer: $userAddress}) {
                  raffle {
                    creator
                    title
                    ticketPrice
                    rewardTokenAddress
                    rewardType
                  }
                  amount
                }
                
                # Get ERC20 transfers (both incoming and outgoing)
                erc20Transfers(where: {
                  or: [
                    {to: $userAddress},
                    {from: $userAddress}
                  ]
                }) {
                  tokenAddress
                  tokenName
                  tokenSymbol
                  tokenDecimals
                  amount
                  to
                  from
                }
              }
            `,
            variables: { userAddress: address.toLowerCase() }
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Envio response:', data);
          
          if (data.data) {
            // Process ERC20 transfers to find unique tokens
            const tokenBalances = new Map<string, {
              address: string;
              name: string;
              symbol: string;
              decimals: number;
              balance: bigint;
            }>();

            // Process ERC20 transfers
            if (data.data.erc20Transfers) {
              data.data.erc20Transfers.forEach((transfer: any) => {
                const tokenAddress = transfer.tokenAddress.toLowerCase();
                const amount = BigInt(transfer.amount);
                const isIncoming = transfer.to.toLowerCase() === address.toLowerCase();
                
                if (!tokenBalances.has(tokenAddress)) {
                  tokenBalances.set(tokenAddress, {
                    address: transfer.tokenAddress,
                    name: transfer.tokenName || 'Unknown Token',
                    symbol: transfer.tokenSymbol || 'UNKNOWN',
                    decimals: transfer.tokenDecimals || 18,
                    balance: BigInt(0)
                  });
                }
                
                const tokenData = tokenBalances.get(tokenAddress)!;
                if (isIncoming) {
                  tokenData.balance += amount;
                } else {
                  tokenData.balance -= amount;
                }
              });
            }

            // Convert to TokenInfo format (only positive balances)
            for (const [_, tokenData] of tokenBalances) {
              if (tokenData.balance > BigInt(0)) {
                const balanceFormatted = (Number(tokenData.balance) / Math.pow(10, tokenData.decimals)).toFixed(8);
                
                // Generate token logo
                const generateTokenLogo = (symbol: string): string => {
                  const logoMap: { [key: string]: string } = {
                    'USDC': '💵', 'USDT': '💰', 'DAI': '💲', 
                    'WETH': '💎', 'WBTC': '₿', 'WSOL': '☀️',
                    'USDC.A': '💵', 'DAK': '🌟', 'MAI': '🤖', 'WMON': '🔥'
                  };
                  return logoMap[symbol.toUpperCase()] || '🪙';
                };
                
                tokens.push({
                  address: tokenData.address,
                  name: tokenData.name,
                  symbol: tokenData.symbol,
                  decimals: tokenData.decimals,
                  balance: balanceFormatted,
                  logo: generateTokenLogo(tokenData.symbol)
                });
                
                console.log(`✅ Found ${tokenData.symbol}: ${balanceFormatted}`);
              }
            }
          }
        } else {
          console.warn('⚠️ Envio endpoint not available, using fallback method');
        }
      } catch (error) {
        console.warn('⚠️ Envio query failed, using fallback:', error);
      }

      // Step 3: Fallback - check known token contracts if envio fails
      if (tokens.length <= 1) { // Only MON found
        console.log(`📋 Checking known token contracts as fallback...`);
        
        const knownTokens: Array<{
          address: string;
          name: string;
          symbol: string;
          decimals: number;
          logo: string;
        }> = [
          // Add real Monad testnet tokens here when you discover them
          // {
          //   address: '0xa0b86a33e6b8...',
          //   name: 'USD Coin',
          //   symbol: 'USDC',
          //   decimals: 6,
          //   logo: '💵'
          // },
        ];
        
        // Check balances for known tokens
        for (const knownToken of knownTokens) {
          try {
            console.log(`🔍 Checking ${knownToken.symbol} balance...`);
            
            const balance = await publicClient.readContract({
              address: knownToken.address as `0x${string}`,
              abi: [{
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ type: 'address' }],
                outputs: [{ type: 'uint256' }]
              }],
              functionName: 'balanceOf',
              args: [address as `0x${string}`]
            });
            
            if (balance && balance > BigInt(0)) {
              const balanceFormatted = (Number(balance) / Math.pow(10, knownToken.decimals)).toFixed(8);
              tokens.push({
                address: knownToken.address,
                name: knownToken.name,
                symbol: knownToken.symbol,
                decimals: knownToken.decimals,
                balance: balanceFormatted,
                logo: knownToken.logo
              });
              console.log(`✅ ${knownToken.symbol}: ${balanceFormatted}`);
            }
          } catch (error) {
            console.warn(`⚠️ Error checking ${knownToken.symbol}:`, error);
          }
        }
      }

      console.log(`🎉 ENVIO token discovery complete! Found ${tokens.length} tokens`);
      
      // Sort tokens: MON first, then by balance (highest first), then alphabetically
      return tokens.sort((a: TokenInfo, b: TokenInfo) => {
        if (a.symbol === 'MON') return -1;
        if (b.symbol === 'MON') return 1;
        
        const balanceA = parseFloat(a.balance);
        const balanceB = parseFloat(b.balance);
        
        if (balanceA !== balanceB) {
          return balanceB - balanceA; // Higher balance first
        }
        
        return a.symbol.localeCompare(b.symbol); // Alphabetical
      });
      
    } catch (error) {
      console.error('❌ Error in ENVIO token discovery:', error);
      return [];
    }
  };

  // Function to discover NFTs by scanning Transfer events  
  const discoverUserNFTs = async (address: string): Promise<NFTInfo[]> => {
    try {
      console.log(`🔍 Starting NFT discovery for address: ${address}`);
      // For now, return empty array since we're focusing on tokens
      // NFT discovery can be implemented later
      return [];
    } catch (error) {
      console.error('❌ Error discovering NFTs:', error);
      return [];
    }
  };

  // Load user's assets when wallet connects or reward type changes
  useEffect(() => {
    const loadUserAssets = async () => {
      if (!address || !isConnected) {
        setUserTokens([]);
        setUserNFTs([]);
        return;
      }

      setIsLoadingAssets(true);
      console.log('Loading hardcoded assets with balances for address:', address);

      // Wait for known assets to load if they're still loading
      if (isLoadingKnownAssets) {
        setIsLoadingAssets(false);
        return;
      }

      try {
        if (raffleFormData.rewardType === 'TOKEN') {
          // Convert tokenBalances to userTokens format
          const tokens = tokenBalances.map(token => {
            // For MON (native token), convert from Wei to readable format
            let readableBalance = token.formattedBalance;
            if (token.symbol === 'MON' && token.balance !== '0') {
              const balanceInEther = parseFloat(token.balance) / Math.pow(10, token.decimals);
              readableBalance = balanceInEther.toFixed(4);
            }
            
            return {
              address: token.address,
              name: token.name,
              symbol: token.symbol,
              decimals: token.decimals,
              balance: readableBalance,
              logo: token.logo
            };
          });
          setUserTokens(tokens);
          console.log(`Loaded ${tokens.length} known tokens with balances:`, tokens);
          
          // Debug MON balance specifically
          const monToken = tokens.find(t => t.symbol === 'MON');
          if (monToken) {
            console.log('MON Token Details:', {
              address: monToken.address,
              balance: monToken.balance,
              symbol: monToken.symbol
            });
          }
        } else {
          // Convert nftBalances to userNFTs format for collections that user owns
          const nfts: NFTInfo[] = [];
          nftBalances.forEach(nftCollection => {
            if (nftCollection.totalOwned > 0) {
              // Add each owned token as a separate NFT entry
              nftCollection.ownedTokens.forEach(tokenId => {
                nfts.push({
                  address: nftCollection.address,
                  tokenId: tokenId,
                  name: `${nftCollection.name} #${tokenId}`,
                  collectionName: nftCollection.name,
                  image: nftCollection.image
                });
              });
            }
          });
          setUserNFTs(nfts);
          console.log(`Loaded ${nfts.length} known NFTs with ownership`);
        }
      } catch (error) {
        console.error('Error loading known assets:', error);
      } finally {
        setIsLoadingAssets(false);
      }
    };

    loadUserAssets();
  }, [address, isConnected, raffleFormData.rewardType, tokenBalances, nftBalances]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);

    try {
      // Compress image to reduce gas costs
      const compressedFile = await compressImage(file);
      const base64 = await convertToBase64(compressedFile);
      handleInputChange('coverImage', base64);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 800x600 to keep gas costs reasonable)
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const removeImage = () => {
    handleInputChange('coverImage', '');
  };

  const generateQRCode = async (url: string) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleCreatePaymentLink = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }
    
    // Validate form
    if (!formData.title || !formData.description || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }

    // V2 now supports multi-token payments - no validation needed!
    
    try {
      // Convert expire date to Unix timestamp
      let expiresAt = 0;
      if (formData.expireDate) {
        expiresAt = Math.floor(new Date(formData.expireDate).getTime() / 1000);
      }

      await createPaymentLink({
        title: formData.title,
        description: formData.description,
        coverImage: formData.coverImage || '',
        price: formData.price,
        paymentToken: selectedPaymentAsset?.type === 'token' ? selectedPaymentAsset.data.address : '0x0000000000000000000000000000000000000000', // V2 feature
        totalSales: parseInt(formData.totalSales) || 0,
        maxPerWallet: parseInt(formData.maxPerWallet) || 0,
        expiresAt: expiresAt,
      });
    } catch (error) {
      console.error('Error creating payment link:', error);
      alert('Failed to create payment link. Please try again.');
    }
  };

  // Handle successful contract interaction
  useEffect(() => {
    const handleTransactionSuccess = async () => {
      if (isConfirmed && hash) {
        try {
          // Try to get the real link ID from transaction events
          const linkId = await getLinkIdFromTransaction(hash);
          
          if (linkId !== null) {
            // Create secure public ID instead of using raw link ID
            const secureId = createSecureLinkId(linkId, hash);
            const paymentLink = `${window.location.origin}/pay/${secureId}`;
            setGeneratedLink(paymentLink);
            // Generate QR code for the link
            await generateQRCode(paymentLink);
          } else {
            // Fallback: use timestamp (this should not happen in normal cases)
            console.warn('Could not extract link ID from transaction, using fallback');
            const fallbackId = Date.now();
            const paymentLink = `${window.location.origin}/pay/${fallbackId}`;
            setGeneratedLink(paymentLink);
            // Generate QR code for the fallback link
            await generateQRCode(paymentLink);
          }
        } catch (error) {
          console.error('Error processing transaction:', error);
          // Fallback
          const fallbackId = Date.now();
          const paymentLink = `${window.location.origin}/pay/${fallbackId}`;
          setGeneratedLink(paymentLink);
          // Generate QR code for the fallback link
          await generateQRCode(paymentLink);
        }
      }
    };

    handleTransactionSuccess();
  }, [isConfirmed, hash, getLinkIdFromTransaction]);

  // Handle successful raffle creation
  useEffect(() => {
    console.log('🔍 Raffle success useEffect triggered:', { 
      isRaffleConfirmed, 
      raffleHash: raffleHash ? raffleHash.slice(0, 10) + '...' : null, 
      generatedLink: generatedLink ? 'exists' : null 
    });
    
    // If we have a hash but no confirmation yet, log the full hash for debugging
    if (raffleHash && !isRaffleConfirmed) {
      console.log('⏳ Waiting for transaction confirmation. Full hash:', raffleHash);
      console.log('🔗 Check transaction status at:', `https://testnet-explorer.monad.xyz/tx/${raffleHash}`);
    }
    
    const handleRaffleSuccess = async () => {
      if (isRaffleConfirmed && raffleHash && !generatedLink) {
        try {
          console.log('🎉 Raffle created successfully!', raffleHash);
          
          // Get real raffle ID from transaction events
          const raffleId = await getRaffleIdFromTransaction(raffleHash);
          
          let raffleLink: string;
          if (raffleId !== null) {
            // Create secure raffle link with hashed ID
            const secureRaffleId = createPredictableSecureRaffleId(raffleId);
            raffleLink = `${window.location.origin}/raffle/${secureRaffleId}`;
            console.log(`🔐 Secure raffle link created: Internal ID ${raffleId} -> Secure ID ${secureRaffleId}`);
          } else {
            // Fallback: use timestamp with secure hash
            console.warn('Could not extract raffle ID from transaction, using fallback');
            const fallbackId = Date.now() % 10000; // Keep it reasonable for brute force decode
            const secureRaffleId = createPredictableSecureRaffleId(fallbackId);
            raffleLink = `${window.location.origin}/raffle/${secureRaffleId}`;
          }
          
          setGeneratedLink(raffleLink);
          
          // Generate QR code for the raffle link
          await generateQRCode(raffleLink);
          
          // Reset form
          setRaffleFormData({
            title: '',
            description: '',
            imageHash: '',
            rewardType: 'TOKEN',
            rewardTokenAddress: '',
            rewardAmount: '',
            ticketPrice: '',
            ticketPaymentToken: '',
            maxTickets: 10,
            maxTicketsPerWallet: 5,
            expirationDateTime: '',
            autoDistributeOnSoldOut: true
          });
          
          // Refresh balances to show updated amounts
          refreshKnownAssets();
          
        } catch (error) {
          console.error('Error processing raffle success:', error);
        }
      }
    };

    handleRaffleSuccess();
  }, [isRaffleConfirmed, raffleHash, generatedLink, refreshKnownAssets, getRaffleIdFromTransaction]);

  const handleCreateRaffle = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }
    
    // Enhanced validation
    if (!raffleFormData.title || !raffleFormData.description) {
      alert("Please fill in title and description");
      return;
    }

    if (!raffleFormData.ticketPrice || parseFloat(raffleFormData.ticketPrice) <= 0) {
      alert("Please enter a valid ticket price");
      return;
    }

    if (raffleFormData.maxTickets <= 0) {
      alert("Please enter a valid number of max tickets");
      return;
    }

    if (raffleFormData.maxTicketsPerWallet <= 0) {
      alert("Please enter a valid max tickets per wallet");
      return;
    }

    // Validate expiration date is required (backend will handle time validation)
    if (!raffleFormData.expirationDateTime) {
      alert("Please select an expiration date and time for the raffle");
      return;
    }

    // V2 supports multi-token payments - no restriction needed

    // Validate reward configuration
    if (raffleFormData.rewardType === 'TOKEN') {
      if (!raffleFormData.rewardTokenAddress) {
        alert("Please select a token for the reward");
        return;
      }
      if (!raffleFormData.rewardAmount || parseFloat(raffleFormData.rewardAmount) <= 0) {
        alert("Please enter a valid reward amount");
        return;
      }
      
      // Check if user has enough balance
      console.log('Looking for token:', raffleFormData.rewardTokenAddress);
      console.log('Available userTokens:', userTokens);
      console.log('raffleFormData.rewardType:', raffleFormData.rewardType);
      console.log('selectedRewardAsset:', selectedRewardAsset);
      
            let selectedToken = userTokens.find(token => 
        token.address.toLowerCase() === raffleFormData.rewardTokenAddress.toLowerCase()
      );
      
      if (!selectedToken) {
        // If token not found in userTokens but selectedRewardAsset exists, use KnownAssets data
        if (selectedRewardAsset && selectedRewardAsset.type === 'token') {
          console.log('Token not in userTokens, but found in KnownAssets, creating token info...');
          const knownTokenData = selectedRewardAsset.data as KnownToken;
          selectedToken = {
            address: knownTokenData.address,
            name: knownTokenData.name,
            symbol: knownTokenData.symbol,
            decimals: knownTokenData.decimals,
            balance: '0', // We don't know the exact balance but proceed anyway
            logo: knownTokenData.logo
          };
          console.log('Created selectedToken from KnownAssets:', selectedToken);
        } else {
          alert("Selected token not found in your wallet. Please make sure you have selected a valid reward token.");
          console.error('Token not found:', {
            searchAddress: raffleFormData.rewardTokenAddress,
            availableTokens: userTokens.map(t => ({ address: t.address, symbol: t.symbol }))
          });
        return;
        }
      }
      
      const userBalance = parseFloat(selectedToken.balance);
      const rewardAmount = parseFloat(raffleFormData.rewardAmount);
      const creationFee = 0.001; // Base creation fee
      
      if (raffleFormData.rewardTokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native MON token - check if user has enough for reward + creation fee
        const totalRequired = rewardAmount + creationFee;
        if (totalRequired > userBalance) {
          alert(`Insufficient MON balance. You need ${totalRequired} MON total (${rewardAmount} for reward + ${creationFee} creation fee), but have ${userBalance} MON`);
          return;
        }
        console.log(`✅ MON reward: ${rewardAmount} MON + ${creationFee} MON creation fee = ${totalRequired} MON total`);
      } else {
        // ERC-20 token - check token balance only (creation fee is separate)
        if (rewardAmount > userBalance) {
          alert(`Insufficient balance. You have ${userBalance} ${selectedToken.symbol}, but trying to reward ${rewardAmount}`);
          return;
        }
        
        // Check and request token approval for ERC-20 rewards
        if (!publicClient || !walletClient) {
          alert('Wallet client not available. Please try again.');
          return;
        }
        
        try {
          const contractAddress = "0xdDa3289655cB31d3dcA10F8E8554537c26d43161"; // V2 contract
          const rewardAmountBigInt = parseEther(raffleFormData.rewardAmount);
          
          console.log('Debug approval info:', {
            selectedToken,
            tokenAddress: selectedToken.address,
            rewardAmount: raffleFormData.rewardAmount,
            rewardAmountBigInt: rewardAmountBigInt.toString(),
            contractAddress
          });
          
          // Check current allowance
          const currentAllowance = await publicClient.readContract({
            address: selectedToken.address as `0x${string}`,
            abi: [
              {
                name: 'allowance',
                type: 'function',
                stateMutability: 'view',
                inputs: [
                  { name: 'owner', type: 'address' },
                  { name: 'spender', type: 'address' }
                ],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ],
            functionName: 'allowance',
            args: [address as `0x${string}`, contractAddress as `0x${string}`]
          });
          
          if (currentAllowance < rewardAmountBigInt) {
            console.log(`Approval needed for ${selectedToken.symbol} tokens. Current allowance: ${currentAllowance.toString()}, Required: ${rewardAmountBigInt.toString()}`);
            
            // Request approval
            const { request } = await publicClient.simulateContract({
              account: address as `0x${string}`,
              address: selectedToken.address as `0x${string}`,
              abi: [
                {
                  name: 'approve',
                  type: 'function',
                  stateMutability: 'nonpayable',
                  inputs: [
                    { name: 'spender', type: 'address' },
                    { name: 'amount', type: 'uint256' }
                  ],
                  outputs: [{ name: '', type: 'bool' }]
                }
              ],
              functionName: 'approve',
              args: [contractAddress as `0x${string}`, rewardAmountBigInt]
            });
            
            const approvalHash = await walletClient.writeContract(request);
            console.log('Approval transaction sent:', approvalHash);
            
            // Wait for approval to be confirmed
            const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
            console.log('Token approval confirmed:', approvalReceipt);
            
            // Verify the allowance was actually set
            const newAllowance = await publicClient.readContract({
              address: selectedToken.address as `0x${string}`,
              abi: [
                {
                  name: 'allowance',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [
                    { name: 'owner', type: 'address' },
                    { name: 'spender', type: 'address' }
                  ],
                  outputs: [{ name: '', type: 'uint256' }]
                }
              ],
              functionName: 'allowance',
              args: [address as `0x${string}`, contractAddress as `0x${string}`]
            });
            
            console.log('New allowance after approval:', newAllowance.toString());
            
            if (newAllowance < rewardAmountBigInt) {
              throw new Error('Approval failed - allowance is still insufficient');
            }
            
            // Check if expiration time is still valid after approval delay
            const currentTime = Math.floor(Date.now() / 1000);
            const selectedExpirationTime = Math.floor(new Date(raffleFormData.expirationDateTime).getTime() / 1000);
            const minimumTime = currentTime + (15 * 60); // 15 minutes from now
            
            if (selectedExpirationTime < minimumTime) {
              // Update expiration time to be 15 minutes from now
              const newExpirationTime = new Date((currentTime + 15 * 60) * 1000);
              const newExpirationString = newExpirationTime.toISOString().slice(0, 16);
              setRaffleFormData(prev => ({
                ...prev,
                expirationDateTime: newExpirationString
              }));
              console.log('Updated expiration time after approval delay:', newExpirationString);
              alert(`Approval completed! Due to the time taken for approval, we've automatically extended your raffle end time to ensure it meets the 15-minute minimum requirement.`);
            }
          }
        } catch (error) {
          console.error('Error with token approval:', error);
          alert('Failed to approve token spending. Please try again.');
          return;
        }
      }
    } else if (raffleFormData.rewardType === 'NFT') {
      if (!raffleFormData.rewardTokenAddress) {
        alert("Please select an NFT for the reward");
        return;
      }
      // For NFT, rewardAmount should be token ID (default to "1" if not specified)
      if (!raffleFormData.rewardAmount) {
        raffleFormData.rewardAmount = "1";
      }
      
      // Check and request NFT approval
      if (!publicClient || !walletClient) {
        alert('Wallet client not available. Please try again.');
        return;
    }

    try {
        const contractAddress = "0x3F0F22132a0A3864B5CD0F79D211Bf28511A76f0"; // V3 contract
        const tokenId = BigInt(raffleFormData.rewardAmount);
        
        console.log('Debug NFT approval info:', {
          nftAddress: raffleFormData.rewardTokenAddress,
          tokenId: raffleFormData.rewardAmount,
          tokenIdBigInt: tokenId.toString(),
          contractAddress
        });
        
        // Check if the NFT is approved for the contract
        const isApproved = await publicClient.readContract({
          address: raffleFormData.rewardTokenAddress as `0x${string}`,
          abi: [
            {
              name: 'getApproved',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'tokenId', type: 'uint256' }],
              outputs: [{ name: '', type: 'address' }]
            }
          ],
          functionName: 'getApproved',
          args: [tokenId]
        });
        
        const isApprovedForAll = await publicClient.readContract({
          address: raffleFormData.rewardTokenAddress as `0x${string}`,
          abi: [
            {
              name: 'isApprovedForAll',
              type: 'function',
              stateMutability: 'view',
              inputs: [
                { name: 'owner', type: 'address' },
                { name: 'operator', type: 'address' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'isApprovedForAll',
          args: [address as `0x${string}`, contractAddress as `0x${string}`]
        });
        
        const needsApproval = (isApproved as string).toLowerCase() !== contractAddress.toLowerCase() && !isApprovedForAll;
        
        if (needsApproval) {
          console.log(`NFT approval needed for token ID ${tokenId.toString()}`);
          
          // Request approval for the specific token
          const { request } = await publicClient.simulateContract({
            account: address as `0x${string}`,
            address: raffleFormData.rewardTokenAddress as `0x${string}`,
            abi: [
              {
                name: 'approve',
                type: 'function',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'to', type: 'address' },
                  { name: 'tokenId', type: 'uint256' }
                ],
                outputs: []
              }
            ],
            functionName: 'approve',
            args: [contractAddress as `0x${string}`, tokenId]
          });
          
          const approvalHash = await walletClient.writeContract(request);
          console.log('NFT approval transaction sent:', approvalHash);
          
          // Wait for approval to be confirmed
          const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
          console.log('NFT approval confirmed:', approvalReceipt);
          
          // Verify the approval was actually set
          const newApproval = await publicClient.readContract({
            address: raffleFormData.rewardTokenAddress as `0x${string}`,
            abi: [
              {
                name: 'getApproved',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'tokenId', type: 'uint256' }],
                outputs: [{ name: '', type: 'address' }]
              }
            ],
            functionName: 'getApproved',
            args: [tokenId]
          });
          
          console.log('New approval after NFT approval:', newApproval);
          
          if ((newApproval as string).toLowerCase() !== contractAddress.toLowerCase()) {
            throw new Error('NFT approval failed - contract is not approved for this token');
          }
          
          // Check if expiration time is still valid after approval delay
          const currentTime = Math.floor(Date.now() / 1000);
          const selectedExpirationTime = Math.floor(new Date(raffleFormData.expirationDateTime).getTime() / 1000);
          const minimumTime = currentTime + (15 * 60); // 15 minutes from now
          
          if (selectedExpirationTime < minimumTime) {
            // Update expiration time to be 15 minutes from now
            const newExpirationTime = new Date((currentTime + 15 * 60) * 1000);
            const newExpirationString = newExpirationTime.toISOString().slice(0, 16);
            setRaffleFormData(prev => ({
              ...prev,
              expirationDateTime: newExpirationString
            }));
            console.log('Updated expiration time after NFT approval delay:', newExpirationString);
            alert(`NFT approval completed! Due to the time taken for approval, we've automatically extended your raffle end time to ensure it meets the 15-minute minimum requirement.`);
          }
        }
      } catch (error) {
        console.error('Error with NFT approval:', error);
        alert('Failed to approve NFT transfer. Please try again.');
        return;
      }
    }

    try {
      // IMPORTANT: Always use blockchain time (UTC) for validation
      // Get current blockchain time (UTC timestamp)
      const currentTime = Math.floor(Date.now() / 1000);
      const minimumRequiredTime = currentTime + (15 * 60); // 15 minutes minimum (blockchain requirement)
      const safetyBufferTime = currentTime + (17 * 60); // 17 minutes with small safety buffer
      
      // Parse the selected datetime as UTC to match blockchain time
      const selectedDate = new Date(raffleFormData.expirationDateTime);
      let expirationTimestamp = Math.floor(selectedDate.getTime() / 1000);
      
      // Only add buffer if the selected time is too close to minimum
      if (expirationTimestamp < safetyBufferTime) {
        // If user selected less than 17 minutes, add small buffer to ensure blockchain validation passes
        expirationTimestamp = Math.max(expirationTimestamp, safetyBufferTime);
        console.log('⚠️ Added small safety buffer to meet blockchain validation');
        console.log('Adjusted expiration time:', new Date(expirationTimestamp * 1000).toISOString());
      }

      console.log('🕐 DETAILED TIME DEBUG:', {
        selectedDateTime: raffleFormData.expirationDateTime,
        parsedDate: new Date(raffleFormData.expirationDateTime),
        parsedTimestamp: Math.floor(new Date(raffleFormData.expirationDateTime).getTime() / 1000),
        currentTime: currentTime,
        currentDate: new Date(currentTime * 1000),
        minimumRequiredTime: minimumRequiredTime,
        minimumRequiredDate: new Date(minimumRequiredTime * 1000),
        safetyBufferTime: safetyBufferTime,
        safetyBufferDate: new Date(safetyBufferTime * 1000),
        finalTimestamp: expirationTimestamp,
        finalDate: new Date(expirationTimestamp * 1000),
        difference: expirationTimestamp - currentTime,
        differenceMinutes: (expirationTimestamp - currentTime) / 60
      });

      console.log('Creating raffle with parameters:', {
        title: raffleFormData.title,
        description: raffleFormData.description,
        rewardType: raffleFormData.rewardType,
        rewardTokenAddress: raffleFormData.rewardTokenAddress,
        rewardAmount: raffleFormData.rewardAmount,
        ticketPaymentToken: raffleFormData.ticketPaymentToken,
        ticketPrice: raffleFormData.ticketPrice,
        maxTickets: raffleFormData.maxTickets,
        maxTicketsPerWallet: raffleFormData.maxTicketsPerWallet,
        expirationTime: expirationTimestamp,
        expirationDate: new Date(expirationTimestamp * 1000),
        autoDistributeOnSoldOut: raffleFormData.autoDistributeOnSoldOut
      });

      await createRaffle({
        title: raffleFormData.title,
        description: raffleFormData.description,
        imageHash: raffleFormData.imageHash || "", // Default to empty string
        rewardType: raffleFormData.rewardType, // Hook handles the conversion
        rewardTokenAddress: raffleFormData.rewardTokenAddress, // Should be validated above
        rewardAmount: raffleFormData.rewardAmount,
        ticketPaymentToken: raffleFormData.ticketPaymentToken,
        ticketPrice: raffleFormData.ticketPrice,
        maxTickets: raffleFormData.maxTickets,
        maxTicketsPerWallet: raffleFormData.maxTicketsPerWallet,
        expirationTime: expirationTimestamp,
        autoDistributeOnSoldOut: raffleFormData.autoDistributeOnSoldOut
      });
      
      console.log('Raffle creation transaction sent successfully!');
    } catch (error) {
      console.error('Error creating raffle:', error);
      
      // More detailed error handling
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // Check for specific contract errors
        if (error.message.includes('execution reverted')) {
          console.error('Contract execution reverted - checking revert reason...');
          
          // Try to extract the revert reason
          const revertMatch = error.message.match(/execution reverted: (.+)/);
          if (revertMatch) {
            alert(`Contract error: ${revertMatch[1]}`);
          } else {
            alert(`Contract execution reverted. Please check console for details.`);
          }
        } else {
          alert(`Error creating raffle: ${error.message}`);
        }
      } else {
        console.error('Unknown error type:', typeof error, error);
        alert('Unknown error occurred while creating raffle');
      }
    }
  };

  // Reconnection loading state - only show briefly
  if (status === 'connecting' && !hasAttemptedReconnect) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-16"
      >
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Connecting Wallet...
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
            Restoring your wallet connection on <span className="text-primary-500 font-semibold">Monad Testnet</span>
          </p>
          <div className="text-xs text-gray-400 mt-4">
            If this takes too long, the page will show connect options automatically.
          </div>
        </div>
      </motion.div>
    );
  }

  if (!isConnected) {
    return (
      // Wallet Connection Required Screen
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-16"
      >
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Connect to Monad Testnet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
            Connect your wallet to <span className="text-primary-500 font-semibold">Monad Testnet</span> to create payment links. 
            NadPay operates on Monad&apos;s high-performance EVM-compatible blockchain.
          </p>
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-1">
                  Monad Testnet Required
                </p>
                <p className="text-xs text-primary-600 dark:text-primary-300">
                  Make sure your wallet is configured for Monad Testnet (Chain ID: 10143).
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <ConnectKitButton />
          </div>
          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">✅ HaHa Wallet • MetaMask • Phantom • OKX Wallet</p>
            <p className="text-xs">All EVM-compatible wallets work with Monad Testnet</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Wrong network check
  const isWrongNetwork = isConnected && chain?.id !== 10143;

  if (isWrongNetwork) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-16"
      >
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Wrong Network
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
            You&apos;re connected to <span className="font-semibold">{chain?.name || 'Unknown Network'}</span> but NadPay requires <span className="text-primary-500 font-semibold">Monad Testnet</span>.
          </p>
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleSwitchToMonad}
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg"
            >
              Switch to Monad Testnet
            </button>
            <ConnectKitButton />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Wallet Status Bar */}
      <div className="mb-8 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl max-w-2xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-primary-800 dark:text-primary-200 font-inter">
                Wallet Connected
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-300 font-inter">
                {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                         <div className="text-left sm:text-right">
              <p className="text-sm font-medium text-primary-800 dark:text-primary-200 font-inter">
              {chain?.name || 'Monad Testnet'}
            </p>
               <p className="text-xs text-primary-600 dark:text-primary-300 font-semibold font-inter">
                Balance: {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000 MON'}
            </p>
             </div>
              <div className="flex items-center space-x-2">
                <a 
                  href="/app/dashboard" 
                className="inline-flex items-center px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all transform hover:scale-105 text-sm font-bold font-inter shadow-lg hover:shadow-xl"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Dashboard
                </a>
            <button
              onClick={persistentDisconnect}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-100 dark:bg-primary-800 hover:bg-primary-200 dark:hover:bg-primary-700 rounded-lg transition-colors"
              title="Disconnect Wallet"
            >
              <LogOut className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                <span className="text-xs font-medium text-primary-600 dark:text-primary-300 font-inter hidden sm:inline">
                Disconnect
              </span>
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Form Based on Page */}
      {selectedTemplate === 'payment' && !generatedLink ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto"
      >
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl p-8">
            
            {/* Header - now perfectly centered */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create Payment Link
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Fill in the details to create your NadPay link on Monad
              </p>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., My NFT Collection"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what you're selling..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover Image
                </label>
                
                {!formData.coverImage ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors ${
                        uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingImage ? (
                        <>
                          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                            Click to upload cover image
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF up to 5MB (auto-compressed to reduce gas costs)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={formData.coverImage}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
          </button>
        </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Total Sales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Sales Limit
                  </label>
                  <input
                    type="number"
                    value={formData.totalSales}
                    onChange={(e) => handleInputChange('totalSales', e.target.value)}
                    placeholder="100 (0 = unlimited)"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Max Per Wallet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Per Wallet
                  </label>
                  <input
                    type="number"
                    value={formData.maxPerWallet}
                    onChange={(e) => handleInputChange('maxPerWallet', e.target.value)}
                    placeholder="5 (0 = unlimited)"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Payment Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Asset *
                  </label>
                  <AssetSelector
                    selectedAsset={selectedPaymentAsset}
                    onAssetSelect={(asset) => {
                      setSelectedPaymentAsset(asset);
                      setFormData(prev => ({
                        ...prev,
                        paymentToken: asset?.data.address || ''
                      }));
                    }}
                    assetType="token"
                    showOnlyOwned={false}
                    placeholder="Select payment token"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price ({selectedPaymentAsset?.type === 'token' ? (selectedPaymentAsset.data as KnownToken).symbol : 'MON'}) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.1"
                    min="0"
                    step="0.001"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
                </div>

                {/* Expire Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Expire Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expireDate}
                    onChange={(e) => handleInputChange('expireDate', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty for no expiration
                  </p>
        </div>

              {/* Create Button */}
              <div className="flex space-x-4">
              <button
                onClick={handleCreatePaymentLink}
                disabled={isCreating || isConfirming}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : isConfirming ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Confirming...</span>
                  </div>
                ) : (
                  'Create Payment Link'
                )}
              </button>
              </div>
              
              {contractError && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    Error: {contractError.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : selectedTemplate === 'raffle' && !generatedLink ? (
        /* Raffle Form */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl p-8">
            
            {/* Header - now perfectly centered */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create Raffle
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Set up your raffle with NFT or token rewards
              </p>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Raffle Title *
                </label>
                <input
                  type="text"
                  value={raffleFormData.title}
                  onChange={(e) => handleRaffleInputChange('title', e.target.value)}
                  placeholder="e.g., Win a Rare NFT!"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={raffleFormData.description}
                  onChange={(e) => handleRaffleInputChange('description', e.target.value)}
                  placeholder="Describe your raffle and the reward..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Reward Configuration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Reward Asset *
                  </label>
                <AssetSelector
                  selectedAsset={selectedRewardAsset}
                  onAssetSelect={(asset) => {
                    setSelectedRewardAsset(asset);
                    if (asset) {
                      if (asset.type === 'individual_nft') {
                        const nftData = asset.data as NFTWithMetadata;
                        handleRaffleInputChange('rewardTokenAddress', nftData.address);
                        handleRaffleInputChange('rewardType', 'NFT');
                        handleRaffleInputChange('rewardAmount', nftData.tokenId);
                      } else {
                        handleRaffleInputChange('rewardTokenAddress', asset.data.address);
                        handleRaffleInputChange('rewardType', asset.type === 'token' ? 'TOKEN' : 'NFT');
                        handleRaffleInputChange('rewardAmount', '');
                      }
                    } else {
                      handleRaffleInputChange('rewardTokenAddress', '');
                      handleRaffleInputChange('rewardAmount', '');
                    }
                  }}
                  assetType="both"
                  showOnlyOwned={false}
                  placeholder="Select token or NFT to give as reward..."
                />
                  
                  {/* Amount Input */}
                {selectedRewardAsset && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {selectedRewardAsset.type === 'token' 
                        ? 'Amount to give as reward *' 
                        : selectedRewardAsset.type === 'individual_nft'
                        ? 'NFT Token ID (auto-filled) *'
                        : 'Token ID to give as reward *'
                      }
                      </label>
                      <input
                      type={selectedRewardAsset.type === 'token' ? 'number' : 'text'}
                        value={raffleFormData.rewardAmount}
                        onChange={(e) => handleRaffleInputChange('rewardAmount', e.target.value)}
                      placeholder={selectedRewardAsset.type === 'token' ? '100' : '1'}
                      min={selectedRewardAsset.type === 'token' ? '0' : undefined}
                      step={selectedRewardAsset.type === 'token' ? '0.001' : undefined}
                        disabled={selectedRewardAsset.type === 'individual_nft'}
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white ${
                          selectedRewardAsset.type === 'individual_nft' ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                      />
                    {selectedRewardAsset.type === 'token' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Selected: {(selectedRewardAsset.data as KnownToken).symbol} - {(selectedRewardAsset.data as KnownToken).name}
                      </p>
                              )}
                    {selectedRewardAsset.type === 'nft' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Selected NFT Collection: {(selectedRewardAsset.data as KnownNFT).name}
                      </p>
                    )}
                    {selectedRewardAsset.type === 'individual_nft' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Selected NFT: {(selectedRewardAsset.data as NFTWithMetadata).metadata?.name || `NFT #${(selectedRewardAsset.data as NFTWithMetadata).tokenId}`}
                      </p>
                  )}
                </div>
              )}
                </div>

              {/* Ticket Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ticket Payment Asset *
                  </label>
                  <AssetSelector
                    selectedAsset={selectedTicketPaymentAsset}
                    onAssetSelect={(asset) => {
                      setSelectedTicketPaymentAsset(asset);
                      // V1 contract only supports MON, so we store for future V2 compatibility
                      setRaffleFormData(prev => ({
                        ...prev,
                        ticketPaymentToken: asset?.data.address || ''
                      }));
                    }}
                    assetType="token"
                    showOnlyOwned={false}
                    placeholder="Select payment token for tickets"
                  />

                                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ticket Price {selectedTicketPaymentAsset && selectedTicketPaymentAsset.type === 'token' && (
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        ({(selectedTicketPaymentAsset.data as any).symbol})
                      </span>
                    )} *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={raffleFormData.ticketPrice}
                    onChange={handleTicketPriceChange}
                    placeholder="0.01"
                    min="0"
                    step="0.01"
                    lang="en"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Tickets *
                  </label>
                  <input
                    type="number"
                    value={raffleFormData.maxTickets}
                    onChange={(e) => handleRaffleInputChange('maxTickets', parseInt(e.target.value))}
                    placeholder="100"
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Per Wallet *
                  </label>
                  <input
                    type="number"
                    value={raffleFormData.maxTicketsPerWallet}
                    onChange={(e) => handleRaffleInputChange('maxTicketsPerWallet', parseInt(e.target.value))}
                    placeholder="10"
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Expiration Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Expiration Date & Time *
                </label>
                
                {/* Quick Duration Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                  {[
                    { label: '15M', minutes: 15 },
                    { label: '30M', minutes: 30 },
                    { label: '1H', minutes: 60 },
                    { label: '4H', minutes: 240 },
                    { label: '24H', minutes: 1440 },
                    { label: 'Custom', minutes: 0 }
                  ].map((duration) => (
                    <button
                      key={duration.label}
                      type="button"
                      onClick={() => {
                        if (duration.minutes > 0) {
                          // Use UTC time to match blockchain time
                          // Set exactly the duration shown, backend will add buffer if needed
                          const now = new Date();
                          const endTime = new Date(now.getTime() + duration.minutes * 60 * 1000);
                          const formattedTime = endTime.toISOString().slice(0, 16);
                          handleRaffleInputChange('expirationDateTime', formattedTime);
                          console.log(`⏰ Set expiration to ${duration.label}:`, endTime.toISOString());
                        }
                      }}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        duration.label === 'Custom'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                      }`}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>

                {/* DateTime Input */}
                <input
                  type="datetime-local"
                  value={raffleFormData.expirationDateTime}
                  onChange={(e) => {
                    // Just update the value, let the backend handle the validation
                    // Frontend validation is only for UX, not security
                    handleRaffleInputChange('expirationDateTime', e.target.value);
                  }}
                  min={(() => {
                    // Set minimum time to 15 minutes from now (UTC) to match blockchain validation
                    const now = new Date();
                    const minimumTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
                    return minimumTime.toISOString().slice(0, 16);
                  })()}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Raffle will automatically end at this date and time (minimum 15 minutes from now)
                </p>
              </div>



              {/* Create Button */}
              <div className="flex space-x-4">
                <button
                  onClick={handleCreateRaffle}
                  disabled={isRaffleCreating || isRaffleConfirming}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRaffleCreating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : isRaffleConfirming ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Confirming...</span>
                    </div>
                  ) : (
                    'Create Raffle'
                  )}
                </button>
              </div>
              
              {raffleError && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    Error: {raffleError.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        /* Generated Link Display */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Link2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedTemplate === 'raffle' ? 'Raffle Created!' : 'Payment Link Created!'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {selectedTemplate === 'raffle' ? 'Share this raffle link to let people participate' : 'Share this link with your customers'}
            </p>
            
            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{selectedTemplate === 'raffle' ? 'Your Raffle Link:' : 'Your Payment Link:'}</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                <input
                  type="text"
                  value={generatedLink || ''}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-white"
                />
                <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(generatedLink!);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000); // Hide after 2 seconds
                    } catch (error) {
                      console.error('Failed to copy:', error);
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = generatedLink!;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }
                  }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded transition-colors text-sm flex items-center justify-center space-x-1 ${
                      copySuccess 
                        ? 'bg-green-500 text-white' 
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                >
                  {copySuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR</span>
                </button>
                </div>
              </div>
              
              {/* QR Code Display */}
              {showQRCode && qrCodeUrl && (
                <div className="text-center p-4 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Scan with any QR reader:</p>
                  <img 
                    src={qrCodeUrl} 
                    alt={selectedTemplate === 'raffle' ? 'Raffle Link QR Code' : 'Payment Link QR Code'} 
                    className="mx-auto mb-3 rounded-lg"
                  />
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeUrl;
                      link.download = `${selectedTemplate === 'raffle' ? 'nadpay-raffle' : 'nadpay'}-qr-${Date.now()}.png`;
                      link.click();
                    }}
                    className="text-xs text-primary-500 hover:text-primary-600 underline"
                  >
                    Download QR Code
                  </button>
                </div>
              )}
            </div>

            <div className="flex space-x-4 justify-center">
            <button
              onClick={() => {
                setGeneratedLink(null);
                setQrCodeUrl(null);
                setShowQRCode(false);
                setCopySuccess(false);
                  setSelectedTemplate(null);
                setFormData({
                  title: '',
                  description: '',
                  coverImage: '',
                  totalSales: '',
                  maxPerWallet: '',
                  price: '',
                  paymentToken: '',
                  expireDate: ''
                });
                  setRaffleFormData({
                    title: '',
                    description: '',
                    imageHash: '',
                    rewardType: 'TOKEN',
                    rewardTokenAddress: '',
                    rewardAmount: '',
                    ticketPrice: '',
                  ticketPaymentToken: '',
                    maxTickets: 100,
                    maxTicketsPerWallet: 10,
                    expirationDateTime: '',
                  autoDistributeOnSoldOut: true, // Always true
                });
                // Reset selected assets
                setSelectedPaymentAsset(null);
                setSelectedRewardAsset(null);
                setSelectedTicketPaymentAsset(null);
              }}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
                {selectedTemplate === 'raffle' ? 'Create Another Raffle' : 'Create Another Link'}
            </button>
              <a
                href="/app/dashboard"
                className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
    </div>
        </motion.div>
      )}
    </div>
  );
} 