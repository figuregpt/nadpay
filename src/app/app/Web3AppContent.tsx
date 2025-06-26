"use client";

import { useState, useEffect } from "react";
import { Wallet, Link2, Upload, X, Calendar, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { useAccount, useSwitchChain, useBalance } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { usePersistentWallet } from "@/hooks/usePersistentWallet";
import { useCreatePaymentLinkV2 } from "@/hooks/useNadPayV2Contract";
import { AssetSelector, SelectedAsset } from "@/components/AssetSelector";
import { KnownToken } from "@/lib/knownAssets";

export default function Web3AppContent() {
  const { address, isConnected, chain, status } = useAccount();
  const { hasAttemptedReconnect } = usePersistentWallet();
  const { switchChain } = useSwitchChain();
  
  // Payment link form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    totalSales: '',
    maxPerWallet: '',
    price: '',
    paymentToken: '',
    expireDate: ''
  });

  const [selectedPaymentAsset, setSelectedPaymentAsset] = useState<SelectedAsset | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
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

  const createSecureLinkId = (internalId: number, txHash: string): string => {
    const hashSeed = parseInt(txHash.slice(-8), 16);
    const combined = `${internalId}_${hashSeed}_nadpay`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${hashSeed}_${Math.abs(hash).toString(16).slice(0, 8)}`;
  };

  const handleSwitchToMonad = () => {
    if (switchChain) {
      switchChain({ chainId: 10143 });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const compressedFile = await compressImage(file);
      const base64 = await convertToBase64(compressedFile);
      setFormData(prev => ({ ...prev, coverImage: base64 }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
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
        const maxSize = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
          },
          'image/jpeg',
          0.8
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
      reader.onerror = error => reject(error);
    });
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, coverImage: '' }));
  };

  const generateQRCode = async (url: string) => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      setQrCodeUrl(qrCodeDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleCreatePaymentLink = async () => {
    if (!formData.title || !formData.description || !formData.price || !selectedPaymentAsset) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createPaymentLink({
        title: formData.title,
        description: formData.description,
        coverImage: formData.coverImage,
        totalSales: parseInt(formData.totalSales) || 0,
        maxPerWallet: parseInt(formData.maxPerWallet) || 0,
        price: formData.price,
        paymentToken: selectedPaymentAsset.data.address,
        expiresAt: formData.expireDate ? Math.floor(new Date(formData.expireDate).getTime() / 1000) : 0
      });
    } catch (error) {
      console.error('Error creating payment link:', error);
    }
  };

  useEffect(() => {
    const handleConfirmation = async () => {
      if (isConfirmed && hash && !generatedLink) {
        try {
          const linkId = await getLinkIdFromTransaction(hash);
          if (linkId !== null) {
            const secureLinkId = createSecureLinkId(linkId, hash);
            const link = `${window.location.origin}/pay/${secureLinkId}`;
            setGeneratedLink(link);
            await generateQRCode(link);
          }
        } catch (error) {
          console.error('Error getting link ID:', error);
        }
      }
    };

    handleConfirmation();
  }, [isConfirmed, hash, generatedLink, getLinkIdFromTransaction]);

  if (status === 'reconnecting' || !hasAttemptedReconnect) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-16"
      >
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Loading...
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
            Connecting to your wallet...
          </p>
        </div>
      </motion.div>
    );
  }

  if (!isConnected) {
    return (
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
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">
            Connect your wallet to create payment links on Monad blockchain.
          </p>
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
        </div>
      </motion.div>
    );
  }

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
      {!generatedLink ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto"
      >
          <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl p-8">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex justify-center">
              <button
                onClick={handleCreatePaymentLink}
                disabled={isCreating || isConfirming}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
      ) : (
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
                        setTimeout(() => setCopySuccess(false), 2000);
                    } catch (error) {
                      console.error('Failed to copy:', error);
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
                setCopySuccess(false);
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
                setSelectedPaymentAsset(null);
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