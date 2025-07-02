"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTwitterProfile } from "@/hooks/useTwitterProfile";
import { 
  Trophy, 
  CreditCard, 
  ArrowLeftRight, 
  Ticket, 
  Sun, 
  Moon, 
  Menu, 
  X,
  User,
  Link2,
  LogOut,
  ChevronDown,
  Twitter,
  MessageCircle
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  gradient?: string;
}

interface NavbarProps {
  userTickets?: any[];
  brand?: {
    name: string;
    href: string;
    logo?: React.ReactNode;
  };
  ticketsLabel?: string;
  ticketsHref?: string;
  showTicketsButton?: boolean;
}

export default function Navbar({ 
  userTickets = [], 
  brand = {
    name: "NadPay",
    href: "/",
    logo: <Link2 className="w-5 h-5 text-white" />
  },
  ticketsLabel = "My Tickets",
  ticketsHref = "/dashboard",
  showTicketsButton = true
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { profile: twitterProfile } = useTwitterProfile();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDiscordToast, setShowDiscordToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems: NavItem[] = [
    {
      label: "Leaderboard",
      href: "/leaderboard",
      icon: <Trophy className="w-4 h-4" />,
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      label: "RaffleHouse",
      href: "/rafflehouse",
      icon: <Trophy className="w-4 h-4" />,
      gradient: "from-purple-500 to-pink-600",
    },
    {
      label: "NadPay",
      href: "/nadpay",
      icon: <CreditCard className="w-4 h-4" />,
      gradient: "from-green-500 to-teal-500",
    },
    {
      label: "NadSwap",
      href: "/nadswap",
      icon: <ArrowLeftRight className="w-4 h-4" />,
      gradient: "from-blue-500 to-purple-500",
    },
  ];

  const getActiveTicketsCount = () => {
    return userTickets.filter(ticket => ticket.status === 0).length;
  };

  const isActiveRoute = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleWalletDropdown = () => {
    setIsWalletDropdownOpen(!isWalletDropdownOpen);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsWalletDropdownOpen(false);
  };

  const handleProfile = () => {
    router.push('/dashboard');
    setIsWalletDropdownOpen(false);
  };

  const handleConnectTwitter = () => {
    router.push('/dashboard');
    setIsWalletDropdownOpen(false);
  };

  const handleDiscordClick = () => {
    setShowDiscordToast(true);
    setTimeout(() => setShowDiscordToast(false), 3000);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Discord Coming Soon Toast */}
      {showDiscordToast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          <p className="text-sm font-medium">Discord coming soon! 🚀</p>
        </div>
      )}
      
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <Link href={brand.href} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  {brand.logo}
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                  {brand.name}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActiveRoute(item.href) 
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-105` 
                      : `border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-transparent hover:text-white hover:shadow-md
                         ${item.href === '/leaderboard' ? 'hover:bg-gradient-to-r hover:from-yellow-500 hover:to-orange-500' :
                           item.href === '/rafflehouse' ? 'hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-600' :
                           item.href === '/nadpay' ? 'hover:bg-gradient-to-r hover:from-green-500 hover:to-teal-500' :
                           item.href === '/nadswap' ? 'hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500' : ''}`
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* My Tickets/Links - Desktop */}
              {isConnected && showTicketsButton && (
                <button
                  onClick={() => router.push(ticketsHref)}
                  className={`
                    hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative
                    ${isActiveRoute(ticketsHref) 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' 
                      : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:shadow-md'
                    }
                  `}
                  title={ticketsLabel}
                >
                  <Ticket className="w-4 h-4" />
                  <span>{ticketsLabel}</span>
                  {getActiveTicketsCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getActiveTicketsCount()}
                    </span>
                  )}
                </button>
              )}

              {/* Social Links */}
              <a
                href="https://x.com/nadpayxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Follow us on X"
              >
                <Twitter className="w-4 h-4" />
              </a>

              <button
                onClick={handleDiscordClick}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Join our Discord"
              >
                <MessageCircle className="w-4 h-4" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Wallet Connection */}
              {isConnected ? (
                <div className="relative" ref={dropdownRef}>
                  <ConnectKitButton.Custom>
                    {({ truncatedAddress, ensName }) => (
                      <button
                        onClick={toggleWalletDropdown}
                        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        {twitterProfile ? (
                          // Show Twitter profile when connected
                          <>
                            <img
                              src={twitterProfile.twitterAvatarUrl || '/placeholder-avatar.png'}
                              alt={twitterProfile.twitterName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-sm font-medium hidden sm:inline">
                              {twitterProfile.twitterName}
                            </span>
                          </>
                        ) : (
                          // Show wallet address when Twitter not connected
                          <>
                            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">
                                {ensName ? ensName.slice(0, 2) : address?.slice(2, 4).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium hidden sm:inline">
                              {ensName || truncatedAddress}
                            </span>
                          </>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isWalletDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </ConnectKitButton.Custom>

                  {/* Dropdown Menu */}
                  {isWalletDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {/* Twitter Profile Info */}
                      {twitterProfile && (
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-3">
                            <img
                              src={twitterProfile.twitterAvatarUrl || '/placeholder-avatar.png'}
                              alt={twitterProfile.twitterName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {twitterProfile.twitterName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                @{twitterProfile.twitterHandle}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Menu Items */}
                      <button
                        onClick={handleProfile}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Dashboard</span>
                      </button>
                      
                      {!twitterProfile && (
                        <button
                          onClick={handleConnectTwitter}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Twitter className="w-4 h-4" />
                          <span>Connect Twitter</span>
                        </button>
                      )}
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect Wallet</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <ConnectKitButton.Custom>
                  {({ show }) => (
                    <button
                      onClick={show}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                      <span className="hidden sm:inline">Connect Wallet</span>
                      <User className="w-4 h-4 sm:hidden" />
                    </button>
                  )}
                </ConnectKitButton.Custom>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200
                    ${isActiveRoute(item.href) 
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg` 
                      : `border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-transparent hover:text-white hover:shadow-md
                         ${item.href === '/leaderboard' ? 'hover:bg-gradient-to-r hover:from-yellow-500 hover:to-orange-500' :
                           item.href === '/rafflehouse' ? 'hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-600' :
                           item.href === '/nadpay' ? 'hover:bg-gradient-to-r hover:from-green-500 hover:to-teal-500' :
                           item.href === '/nadswap' ? 'hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500' : ''}`
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Mobile My Tickets/Links */}
              {isConnected && showTicketsButton && (
                <button
                  onClick={() => {
                    router.push(ticketsHref);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 w-full text-left relative text-base font-medium
                    ${isActiveRoute(ticketsHref) 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                      : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:shadow-md'
                    }
                  `}
                >
                  <Ticket className="w-4 h-4" />
                  <span>{ticketsLabel}</span>
                  {getActiveTicketsCount() > 0 && (
                    <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-auto">
                      {getActiveTicketsCount()}
                    </span>
                  )}
                </button>
              )}

            </div>
          </div>
        )}
      </nav>
    </>
  );
} 