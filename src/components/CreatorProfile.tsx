"use client";

import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CreatorProfileProps {
  creatorAddress: string;
  className?: string;
  preventLink?: boolean;
  lazy?: boolean;
}

export default function CreatorProfile({ 
  creatorAddress, 
  className = "", 
  preventLink = false,
  lazy = false
}: CreatorProfileProps) {
  const [isVisible, setIsVisible] = useState(!lazy);
  const divRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  
  const { profile, isLoading } = useCreatorProfile(isVisible ? creatorAddress : '');

  useEffect(() => {
    if (!lazy) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    const targetElement = preventLink ? divRef.current : anchorRef.current;
    if (targetElement) {
      observer.observe(targetElement);
    }

    return () => observer.disconnect();
  }, [lazy, preventLink]);

  if (isLoading || (lazy && !isVisible)) {
    return (
      <div ref={divRef} className={`flex items-center space-x-2 ${className}`}>
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div ref={divRef} className={`flex items-center space-x-2 ${className}`}>
        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {creatorAddress.slice(2, 4).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {`${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`}
          </p>
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="relative">
        <img
          src={profile.twitterAvatarUrl || '/placeholder-avatar.png'}
          alt={profile.twitterName}
          className="w-6 h-6 rounded-full object-cover"
          loading="lazy"
        />
        {/* Always show verified badge if Twitter profile exists */}
        <CheckCircle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-blue-500 bg-white rounded-full" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {profile.twitterName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          @{profile.twitterHandle}
        </p>
      </div>
    </>
  );

  if (preventLink) {
    return (
      <div ref={divRef} className={`flex items-center space-x-2 ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <a
      ref={anchorRef}
      href={`https://x.com/${profile.twitterHandle}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer ${className}`}
    >
      {content}
    </a>
  );
} 