import React, { useState, useRef, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, LogOut, Menu, ExternalLink, Copy, Check, ChevronDown, User, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useSwitchChain } from 'wagmi';
import { arcTestnet } from '../config/wagmi';

export const Navbar: React.FC = () => {
  const { isWalletConnected, walletAddress, chainName, chainId, usdcBalance, usdcBalanceLoading, disconnectWallet, currentUser, assets, theme, setTheme } = useAppContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { switchChain } = useSwitchChain();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!isWalletConnected || !chainId || chainId === arcTestnet.id) return;
    switchChain({ chainId: arcTestnet.id });
  }, [chainId, isWalletConnected, switchChain]);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatBalance = (balance: string | null) => {
    if (balance === null) return null;
    const num = parseFloat(balance);
    if (isNaN(num)) return null;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <header className="sticky top-0 z-30 w-full glassmorphism border-b border-border bg-background/80">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        
        {/* Left: Mobile Menu, Logo & Greeting */}
        <div className="flex items-center space-x-6 flex-1">
          <div className="flex items-center space-x-4">
            <button className="md:hidden text-muted hover:text-text">
              <Menu size={24} />
            </button>
            <div className="md:hidden flex items-center space-x-2">
              <img src="/arc_logo.png" alt="ArcMeme Logo" className="h-6 w-auto object-contain" />
              <span className="text-lg font-bold text-text">ArcMeme</span>
            </div>
          </div>

          {/* Inline Greeting */}
          {currentUser && (
            <div className="hidden md:flex flex-col justify-center">
              <span className="text-xl font-extrabold text-text tracking-wide leading-none">
                Welcome back {currentUser.displayName} 👋
              </span>
              <span className="text-xs text-muted mt-0.5 font-medium">
                Discover, launch and trade meme tokens on Arc Network.
              </span>
            </div>
          )}
        </div>

        {/* Right: Wallet & Profile */}
        <div className="flex items-center space-x-4">
          {/* Theme Switcher */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-border/50 hover:bg-border/80 border border-border text-muted hover:text-text transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!isWalletConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button 
                  onClick={openConnectModal}
                  className="btn-connect flex items-center space-x-2 px-5 py-2 rounded-lg"
                >
                  <Wallet size={18} />
                  <span>Connect Wallet</span>
                </button>
              )}
            </ConnectButton.Custom>
          ) : (
            <div className="flex items-center space-x-3 relative" ref={dropdownRef}>
              {/* Arc Testnet Badge */}
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-[#7C3AED]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                <span>{chainName || 'Arc Testnet'}</span>
              </div>

              {/* USDC Balance */}
              <div className="hidden md:flex flex-col items-end mr-1">
                {usdcBalanceLoading ? (
                  <span className="text-xs text-muted">Loading...</span>
                ) : usdcBalance !== null ? (
                  <>
                    <span className="text-sm font-bold text-text">{formatBalance(usdcBalance)} USDC</span>
                    <span className="text-xs text-accent font-mono">{truncateAddress(walletAddress!)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-muted">USDC Balance Unavailable</span>
                    <span className="text-xs text-accent font-mono">{truncateAddress(walletAddress!)}</span>
                  </>
                )}
              </div>

              {/* Profile Avatar + Dropdown Toggle */}
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 group hover:bg-border/50 p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-border"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#7C3AED] flex items-center justify-center text-white font-bold shadow-inner">
                  {currentUser?.avatarSeed || 'A'}
                </div>
                <span className="font-bold text-sm text-text hidden sm:block">
                  {currentUser?.displayName || 'Loading...'}
                </span>
                <ChevronDown size={14} className={`text-muted transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>


              {/* Profile Dropdown */}
              {showDropdown && (
                <div className="absolute top-14 right-0 w-72 glassmorphism rounded-xl border border-border shadow-lg animate-fadeIn z-50 overflow-hidden">
                  <div className="p-4 border-b border-border/50 bg-sidebar/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#7C3AED] flex items-center justify-center text-xl font-bold text-white shadow-inner shrink-0">
                        {currentUser?.avatarSeed || 'A'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-text truncate">{currentUser?.displayName}</p>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span className="text-xs text-accent font-mono">{walletAddress ? truncateAddress(walletAddress) : ''}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                      <div className="bg-cardLight rounded-lg p-2 border border-border/50">
                        <span className="block text-[10px] text-muted uppercase">Joined</span>
                        <span className="text-xs font-semibold text-text">{currentUser?.joinedAt}</span>
                      </div>
                      <div className="bg-cardLight rounded-lg p-2 border border-border/50">
                        <span className="block text-[10px] text-muted uppercase">Created</span>
                        <span className="text-xs font-semibold text-text">
                          {assets.filter(a => a.creatorHandle === walletAddress).length} Tokens
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Row */}
                  <div className="p-4 border-b border-border/50">
                    <div className="p-3 rounded-lg bg-cardLight border border-border/50">
                      <span className="text-xs text-muted uppercase tracking-wider">USDC Balance</span>
                      {usdcBalanceLoading ? (
                        <p className="text-lg font-bold text-text mt-1">Loading...</p>
                      ) : usdcBalance !== null ? (
                        <p className="text-lg font-bold text-text mt-1">{formatBalance(usdcBalance)} <span className="text-sm text-accent">USDC</span></p>
                      ) : (
                        <p className="text-sm text-muted mt-1">USDC Balance Unavailable</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2">
                    <Link 
                      to={`/creator/${walletAddress}`}
                      onClick={() => setShowDropdown(false)}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-text font-medium hover:bg-border/60 transition-colors"
                    >
                      <User size={16} className="text-[#3B82F6]" />
                      <span>View Profile</span>
                    </Link>
                    <button 
                      onClick={copyAddress}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-cardLight hover:text-text transition-colors"
                    >
                      {copied ? <Check size={16} className="text-[#10B981]" /> : <Copy size={16} />}
                      <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                    </button>
                    <a 
                      href={walletAddress ? `https://testnet.arcscan.app/address/${walletAddress}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-cardLight hover:text-text transition-colors"
                    >
                      <ExternalLink size={16} />
                      <span>View on ArcScan</span>
                    </a>
                    <div className="h-px bg-border/50 my-1 mx-2"></div>
                    <button 
                      onClick={() => { disconnectWallet(); setShowDropdown(false); }}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
