import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface TwitterProfile {
  _id?: string;
  walletAddress: string;
  twitterId: string;
  twitterHandle: string;
  twitterName: string;
  twitterAvatarUrl: string;
  updatedAt: Date;
}

export function useTwitterProfile() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<TwitterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile
  const fetchProfile = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/profile/${address}`);
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
      } else {
        setError(data.error || 'Failed to fetch profile');
      }
    } catch (err) {
      setError('Network error');
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect Twitter
  const connectTwitter = async () => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/twitter/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();

      if (response.ok && data.authUrl) {
        // Redirect to Twitter OAuth
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to generate auth URL');
      }
    } catch (err) {
      setError('Network error');
      console.error('Twitter connect error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect Twitter
  const disconnectTwitter = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profile/${address}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProfile(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      setError('Network error');
      console.error('Twitter disconnect error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile when address changes
  useEffect(() => {
    if (address) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [address]);

  // Check for success/error params on mount (from OAuth callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'twitter_connected') {
      // Remove params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh profile
      fetchProfile();
    } else if (error) {
      setError(`Connection failed: ${error}`);
      // Remove params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return {
    profile,
    isLoading,
    error,
    connectTwitter,
    disconnectTwitter,
    refetchProfile: fetchProfile
  };
} 
 