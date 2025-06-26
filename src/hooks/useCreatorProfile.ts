import { useState, useEffect, useRef } from 'react';

interface TwitterProfile {
  _id?: string;
  walletAddress: string;
  twitterId: string;
  twitterHandle: string;
  twitterName: string;
  twitterAvatarUrl: string;
  updatedAt: Date;
}

// Global cache and pending requests to avoid duplicate API calls
const profileCache = new Map<string, { profile: TwitterProfile | null; timestamp: number }>();
const pendingRequests = new Map<string, Promise<TwitterProfile | null>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useCreatorProfile(creatorAddress: string) {
  const [profile, setProfile] = useState<TwitterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!creatorAddress) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = profileCache.get(creatorAddress);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setProfile(cached.profile);
      setIsLoading(false);
      return;
    }

    // Check if there's already a pending request for this address
    const existingRequest = pendingRequests.get(creatorAddress);
    if (existingRequest) {
      setIsLoading(true);
      existingRequest.then((result) => {
        setProfile(result);
        setIsLoading(false);
      });
      return;
    }

    // Debounce the request
    timeoutRef.current = setTimeout(() => {
      fetchProfile(creatorAddress);
    }, 100); // 100ms debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [creatorAddress]);

  const fetchProfile = async (address: string) => {
    setIsLoading(true);
    
    try {
      // Create the fetch promise
      const fetchPromise = (async (): Promise<TwitterProfile | null> => {
        const response = await fetch(`/api/profile/${address}`);
        const data = await response.json();
        
        if (response.ok && data.profile) {
          return data.profile;
        } else {
          return null;
        }
      })();

      // Store the pending request
      pendingRequests.set(address, fetchPromise);

      const result = await fetchPromise;
      
      // Cache the result
      profileCache.set(address, {
        profile: result,
        timestamp: Date.now()
      });
      
      setProfile(result);
      
      // Clean up the pending request
      pendingRequests.delete(address);
      
    } catch (err) {
      console.error('Creator profile fetch error:', err);
      
      // Cache the null result to avoid repeated failed requests
      profileCache.set(address, {
        profile: null,
        timestamp: Date.now()
      });
      
      setProfile(null);
      pendingRequests.delete(address);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    isLoading
  };
}

// Utility function to preload profiles for better UX
export const preloadCreatorProfiles = (addresses: string[]) => {
  addresses.forEach((address) => {
    if (!address) return;
    
    // Check if already cached or pending
    const cached = profileCache.get(address);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) return;
    if (pendingRequests.has(address)) return;
    
    // Start loading in background
    const fetchPromise = (async () => {
      try {
        const response = await fetch(`/api/profile/${address}`);
        const data = await response.json();
        
        const result = response.ok && data.profile ? data.profile : null;
        
        profileCache.set(address, {
          profile: result,
          timestamp: Date.now()
        });
        
        return result;
      } catch (err) {
        console.error('Background profile fetch error:', err);
        profileCache.set(address, {
          profile: null,
          timestamp: Date.now()
        });
        return null;
      }
    })();
    
    pendingRequests.set(address, fetchPromise);
    
    fetchPromise.finally(() => {
      pendingRequests.delete(address);
    });
  });
};