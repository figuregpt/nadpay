"use client";

import { useState, useEffect } from "react";
import { Wallet, Link2, Upload, X, Calendar, QrCode, Clock, Trophy, Gift } from "lucide-react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { useAccount, useSwitchChain, useBalance, useReadContracts, useReadContract } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { usePersistentWallet } from "@/hooks/usePersistentWallet";
import { useCreatePaymentLink } from "@/hooks/useNadPayContract";
import { useNadRaffleContract } from "@/hooks/useNadRaffleContract";
import { LogOut } from "lucide-react";
import { createPublicClient, http } from "viem";

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
  
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Payment link form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    totalSales: '',
    maxPerWallet: '',
    price: '',
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
    ticketPrice: '0.001',
    maxTickets: 100,
    maxTicketsPerWallet: 10,
    expirationDateTime: '',
    autoDistributeOnSoldOut: true,
  });
  
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  
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
  } = useCreatePaymentLink();

  const {
    createRaffle,
    isPending: isRaffleCreating,
    isConfirming: isRaffleConfirming,
    isConfirmed: isRaffleConfirmed,
    error: raffleError,
    hash: raffleHash
  } = useNadRaffleContract();

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
      console.log('Discovering user assets for address:', address);

      try {
        if (raffleFormData.rewardType === 'TOKEN') {
          const tokens = await discoverUserTokens(address);
          setUserTokens(tokens);
          console.log(`Discovered ${tokens.length} tokens`);
        } else {
          const nfts = await discoverUserNFTs(address);
          setUserNFTs(nfts);
          console.log(`Discovered ${nfts.length} NFTs`);
        }
      } catch (error) {
        console.error('Error loading user assets:', error);
      } finally {
        setIsLoadingAssets(false);
      }
    };

    loadUserAssets();
  }, [address, isConnected, raffleFormData.rewardType]);

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

  const handleCreateRaffle = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }
    
    // Validate form
    if (!raffleFormData.title || !raffleFormData.description) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const now = new Date();
      const expirationTimestamp = raffleFormData.expirationDateTime ? 
        Math.floor(new Date(raffleFormData.expirationDateTime).getTime() / 1000) :
        Math.floor((now.getTime() + 7 * 24 * 60 * 60 * 1000) / 1000); // Default 7 days

      await createRaffle({
        title: raffleFormData.title,
        description: raffleFormData.description,
        imageHash: raffleFormData.imageHash,
        rewardType: raffleFormData.rewardType,
        rewardTokenAddress: raffleFormData.rewardTokenAddress,
        rewardAmount: raffleFormData.rewardAmount,
        ticketPrice: raffleFormData.ticketPrice,
        maxTickets: raffleFormData.maxTickets,
        maxTicketsPerWallet: raffleFormData.maxTicketsPerWallet,
        expirationTime: expirationTimestamp,
        autoDistributeOnSoldOut: raffleFormData.autoDistributeOnSoldOut
      });
    } catch (error) {
      console.error('Error creating raffle:', error);
    }
  };

  // Reconnection loading state - sadece kısa süre göster
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
            <ConnectKitButton.Custom>
              {({ show }) => (
                <button
                  onClick={show}
                  className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg flex items-center space-x-3"
                >
                  <Wallet className="w-5 h-5" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </ConnectKitButton.Custom>
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
            <ConnectKitButton.Custom>
              {({ show }) => (
                <button
                  onClick={show}
                  className="px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors font-semibold"
                >
                  Switch Wallet
                </button>
              )}
            </ConnectKitButton.Custom>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Wallet Status Bar */}
      <div className="mb-8 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-primary-800 dark:text-primary-200 font-inter">
                {chain?.name || 'Monad Testnet'}
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-300 font-inter">
                Chain ID: {chain?.id || '10143'}
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-300 font-semibold font-inter mb-2">
                Balance: {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000 MON'}
              </p>
              <div className="flex items-center space-x-2">
                <a 
                  href="/app/dashboard" 
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all transform hover:scale-105 text-sm font-bold font-inter shadow-lg hover:shadow-xl"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Dashboard
                </a>
              </div>
            </div>
            <button
              onClick={persistentDisconnect}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-100 dark:bg-primary-800 hover:bg-primary-200 dark:hover:bg-primary-700 rounded-lg transition-colors"
              title="Disconnect Wallet"
            >
              <LogOut className="w-4 h-4 text-primary-600 dark:text-primary-300" />
              <span className="text-xs font-medium text-primary-600 dark:text-primary-300 font-inter">
                Disconnect
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Template Selection or Selected Template Form */}
      {!selectedTemplate ? (
        /* Template Selection */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Choose a Service Type
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Select what you want to create
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <motion.button
              onClick={() => setSelectedTemplate('payment')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-8 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl hover:border-primary-500 transition-all group"
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                💳
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Payment Link
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Create a simple payment collection link
              </p>
            </motion.button>

            <motion.button
              onClick={() => setSelectedTemplate('raffle')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-8 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl hover:border-purple-500 transition-all group"
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                🎫
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Raffle
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Create raffle with NFT/Token rewards
              </p>
            </motion.button>
          </div>
        </motion.div>
      ) : selectedTemplate === 'payment' && !generatedLink ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="text-center flex-1">
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
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (MON) *
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
              </div>

              {/* Create Button */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors font-semibold"
                >
                  Back to Templates
                </button>
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
      ) : selectedTemplate === 'raffle' ? (
        /* Raffle Form */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="text-center flex-1">
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
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
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

              {/* Reward Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reward Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleRaffleInputChange('rewardType', 'TOKEN')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      raffleFormData.rewardType === 'TOKEN'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🪙</div>
                    <div className="font-medium text-gray-900 dark:text-white">Token</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">MON or custom token</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRaffleInputChange('rewardType', 'NFT')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      raffleFormData.rewardType === 'NFT'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🎨</div>
                    <div className="font-medium text-gray-900 dark:text-white">NFT</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Digital collectible</div>
                  </button>
                </div>
              </div>

              {/* Reward Configuration */}
              {raffleFormData.rewardType === 'TOKEN' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Token & Amount *
                  </label>
                  {isLoadingAssets ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Scanning your wallet...
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Looking for tokens and NFTs you own
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userTokens.map((token, index) => (
                        <div
                          key={index}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            raffleFormData.rewardTokenAddress === token.address
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                          }`}
                          onClick={() => handleRaffleInputChange('rewardTokenAddress', token.address)}
                        >
                                                      <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                                {token.logo && token.logo.startsWith('http') ? (
                                  <img 
                                    src={token.logo} 
                                    alt={token.name}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <span className="text-2xl">
                                    {token.logo || '🪙'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white text-lg">
                                  {token.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                  {token.symbol} • Balance: {parseFloat(token.balance).toFixed(4)}
                                </div>
                              </div>
                            </div>
                            {raffleFormData.rewardTokenAddress === token.address && (
                              <div className="text-purple-500">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {userTokens.length === 0 && (
                        <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                          <div className="text-gray-500 dark:text-gray-400 mb-4">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No tokens found in your wallet
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              You need tokens to create a token-based raffle. Try switching to NFT rewards or add some tokens to your wallet.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Amount Input */}
                  {raffleFormData.rewardTokenAddress && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount to give as reward *
                      </label>
                      <input
                        type="number"
                        value={raffleFormData.rewardAmount}
                        onChange={(e) => handleRaffleInputChange('rewardAmount', e.target.value)}
                        placeholder="100"
                        min="0"
                        step="0.001"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select NFT *
                  </label>
                  {isLoadingAssets ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Discovering your NFTs...
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Checking known collections for your digital assets
                      </div>
                    </div>
                  ) : userNFTs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userNFTs.map((nft, index) => (
                        <div
                          key={index}
                          className={`relative group cursor-pointer transition-all duration-300 ${
                            raffleFormData.rewardTokenAddress === nft.address && raffleFormData.rewardAmount === nft.tokenId
                              ? 'transform scale-105'
                              : 'hover:transform hover:scale-102'
                          }`}
                          onClick={() => {
                            handleRaffleInputChange('rewardTokenAddress', nft.address);
                            handleRaffleInputChange('rewardAmount', nft.tokenId);
                          }}
                        >
                          <div className={`border-2 rounded-2xl overflow-hidden transition-all ${
                            raffleFormData.rewardTokenAddress === nft.address && raffleFormData.rewardAmount === nft.tokenId
                              ? 'border-purple-500 shadow-lg shadow-purple-500/25'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:shadow-lg'
                          }`}>
                            <div className="aspect-square relative overflow-hidden">
                              {nft.image ? (
                                <img 
                                  src={nft.image} 
                                  alt={nft.name} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                                  <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              
                              {raffleFormData.rewardTokenAddress === nft.address && raffleFormData.rewardAmount === nft.tokenId && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-4">
                              <div className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                {nft.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
                                {nft.collectionName}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                  #{nft.tokenId}
                                </span>
                                <span className="text-xs text-gray-400 truncate max-w-20">
                                  {nft.address.slice(0, 6)}...
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                      <div className="text-gray-500 dark:text-gray-400 mb-6">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center">
                          <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          No NFTs found in your wallet
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                          You don't have any NFTs yet. Get some NFTs from a marketplace or mint your own collection to create NFT-based raffles.
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => handleRaffleInputChange('rewardType', 'TOKEN')}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
                        >
                          Switch to Token Rewards
                        </button>
                        <button
                          onClick={() => window.open('https://opensea.io', '_blank')}
                          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                          Browse NFTs
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ticket Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ticket Price (MON) *
                  </label>
                  <input
                    type="number"
                    value={raffleFormData.ticketPrice}
                    onChange={(e) => handleRaffleInputChange('ticketPrice', e.target.value)}
                    placeholder="0.001"
                    min="0"
                    step="0.001"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Expiration Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={raffleFormData.expirationDateTime}
                  onChange={(e) => handleRaffleInputChange('expirationDateTime', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Raffle will automatically end at this date and time
                </p>
              </div>

              {/* Auto Distribution Option */}
              <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <input
                  type="checkbox"
                  id="autoDistribute"
                  checked={raffleFormData.autoDistributeOnSoldOut}
                  onChange={(e) => handleRaffleInputChange('autoDistributeOnSoldOut', e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="autoDistribute" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Gift className="w-4 h-4 inline mr-1" />
                  Auto-distribute reward when all tickets are sold
                </label>
              </div>

              {/* Create Button */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors font-semibold"
                >
                  Back to Templates
                </button>
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
              Payment Link Created!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Share this link with your customers
            </p>
            
            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Payment Link:</p>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={generatedLink || ''}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(generatedLink!)}
                  className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors text-sm"
                >
                  Copy
                </button>
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm flex items-center space-x-1"
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR</span>
                </button>
              </div>
              
              {/* QR Code Display */}
              {showQRCode && qrCodeUrl && (
                <div className="text-center p-4 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Scan with any QR reader:</p>
                  <img 
                    src={qrCodeUrl} 
                    alt="Payment Link QR Code" 
                    className="mx-auto mb-3 rounded-lg"
                  />
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeUrl;
                      link.download = `nadpay-qr-${Date.now()}.png`;
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
                  setSelectedTemplate(null);
                  setFormData({
                    title: '',
                    description: '',
                    coverImage: '',
                    totalSales: '',
                    maxPerWallet: '',
                    price: '',
                    expireDate: ''
                  });
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                Create Another Link
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