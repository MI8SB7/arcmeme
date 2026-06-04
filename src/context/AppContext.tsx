import React, { createContext, useContext, useState, useMemo, useEffect, useRef, useCallback, Component } from 'react';
import { DEV_CONTRACTS } from '../config/devContracts';
import type { ReactNode } from 'react';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { formatUnits } from 'viem';
import { type MemeAsset, type ActivityEvent } from '../types';
import { ethers } from 'ethers';
import { calculateSpotPrice } from '../trading';

class AppProviderErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("[Persistence ErrorBoundary Caught]:", error, errorInfo);
  }
  render() {
    return this.props.children; // Continue app execution
  }
}

export type NavTab = 'dashboard' | 'create' | 'trade' | 'leaderboard' | 'swap';

export interface UserProfile {
  walletAddress: string;
  displayName: string;
  joinedAt: string;
  avatarSeed: string;
  verificationStatus: 'Creator' | 'Verified Creator' | 'None';
}

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedAsset: MemeAsset | null;
  setSelectedAsset: (asset: MemeAsset | null) => void;

  // Real wallet state from wagmi
  isWalletConnected: boolean;
  walletAddress: string | undefined;
  chainName: string | undefined;
  chainId: number | undefined;
  disconnectWallet: () => void;

  // USDC balance (native token on Arc)
  usdcBalance: string | null;
  usdcBalanceLoading: boolean;

  assets: MemeAsset[];
  isAssetsLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  activities: ActivityEvent[];
  
  currentUser: UserProfile | null;
  creatorProfiles: Record<string, UserProfile>;
  showOnboarding: boolean;
  createProfile: (displayName: string) => void;
  addToken: (token: MemeAsset) => void;
  addActivity: (activity: ActivityEvent) => void;

  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedAsset, setSelectedAsset] = useState<MemeAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('theme');
      return (stored === 'light' || stored === 'dark') ? stored : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } catch (e) {
      console.error('Failed to set theme:', e);
    }
  }, [theme]);

  // Dynamic Assets State (Registry)
  const [assets, setAssets] = useState<MemeAsset[]>(() => {
    try {
      const stored = localStorage.getItem('arc_registry');
      if (stored) {
        let parsed = JSON.parse(stored);
        parsed = parsed.filter((a: any) => {
          const addr = a.contractAddress || a.address || '';
          return !addr.includes('0xMOCK') && !addr.includes('1234567890abcdef');
        }).map((a: any) => {
          return {
            ...a,
            contractAddress: a.contractAddress || a.address
          };
        });
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Temporary pre-launch cleanup.
  // Remove after production launch.
  const visibleAssets = useMemo(() => {
    return assets.filter((a: MemeAsset) => {
      const addr = (a.contractAddress || '').toLowerCase();
      return !DEV_CONTRACTS.includes(addr);
    });
  }, [assets]);

  // Log asset counts for verification
  useEffect(() => {
    console.log('Total assets loaded from arc_registry:', assets.length);
    console.log('Visible assets after DEV_CONTRACTS filtering:', visibleAssets.length);
  }, [assets, visibleAssets]);

  const [activities, setActivities] = useState<ActivityEvent[]>(() => {
    try {
      const stored = localStorage.getItem('arc_activities');
      let parsed = stored ? JSON.parse(stored) : [];
      parsed = parsed.filter((act: any) => act && act.tokenName && act.creatorName);

      if (parsed.length === 0 && assets.length > 0) {
        parsed = assets.map(asset => ({
          id: asset.id,
          tokenName: asset.name,
          creatorName: asset.creatorName,
          contractAddress: asset.contractAddress,
          timestamp: new Date(asset.launchDate || Date.now()).getTime()
        })).slice(0, 50);
      }
      return parsed;
    } catch (e) {
      return assets.map(asset => ({
        id: asset.id,
        tokenName: asset.name,
        creatorName: asset.creatorName,
        contractAddress: asset.contractAddress,
        timestamp: new Date(asset.launchDate || Date.now()).getTime()
      })).slice(0, 50);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('arc_activities', JSON.stringify(activities));
    } catch (e: any) {
      try {
        const pruned = activities.slice(0, 10);
        localStorage.setItem('arc_activities', JSON.stringify(pruned));
        setActivities(pruned);
      } catch (retryError) {}
    }
  }, [activities]);

  const addActivity = useCallback((activity: ActivityEvent) => {
    setActivities(prev => [activity, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('arc_registry', JSON.stringify(assets));
    } catch (e) {}
  }, [assets]);

  // Ref for stable access to assets inside the sync loop without re-triggering the effect
  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  // Synchronize assets and trades from the blockchain RPC
  useEffect(() => {
    let active = true;
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
    const factoryContract = new ethers.Contract(
      '0x035b5443F9b4D8994F8D83F32968D1694db269A8',
      [
        "event TokenCreated(address indexed token, address indexed market, address indexed creator, string name, string symbol, uint256 usdcSeed)",
        "function getAllTokens() external view returns (address[])",
        "function tokenToMarket(address token) external view returns (address)"
      ],
      provider
    );

    const syncOnChainData = async () => {
      try {
        const tokenAddresses: string[] = await factoryContract.getAllTokens();
        if (!active) return;

        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 4999);

        const filter = factoryContract.filters.TokenCreated();
        let logs: any[] = [];
        try {
          logs = await factoryContract.queryFilter(filter, fromBlock, 'latest');
        } catch (err) {
          console.warn("Failed to query factory created tokens logs", err);
        }
        
        const creatorsMap = new Map<string, { creator: string; usdcSeed: bigint; txHash: string }>();
        for (const log of logs) {
          const parsed = factoryContract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          if (parsed) {
            creatorsMap.set(parsed.args.token.toLowerCase(), {
              creator: parsed.args.creator,
              usdcSeed: parsed.args.usdcSeed,
              txHash: log.transactionHash
            });
          }
        }

        const updatedAssets: MemeAsset[] = [];
        
        for (const tokenAddr of tokenAddresses) {
          const marketAddr = await factoryContract.tokenToMarket(tokenAddr);
          
          const tokenContract = new ethers.Contract(
            tokenAddr,
            [
              "function name() view returns (string)",
              "function symbol() view returns (string)"
            ],
            provider
          );
          
          let name = '';
          let symbol = '';
          try {
            name = await tokenContract.name();
            symbol = await tokenContract.symbol();
          } catch {
            name = 'Unknown';
            symbol = 'UNKN';
          }

          const marketContract = new ethers.Contract(
            marketAddr,
            [
              "function reserveUSDC() view returns (uint256)",
              "function reserveToken() view returns (uint256)",
              "event Buy(address indexed buyer, uint256 usdcIn, uint256 tokenOut)",
              "event Sell(address indexed seller, uint256 tokenIn, uint256 usdcOut)"
            ],
            provider
          );

          let reserveUSDC = 0n;
          let reserveToken = 0n;
          try {
            reserveUSDC = await marketContract.reserveUSDC();
            reserveToken = await marketContract.reserveToken();
          } catch (err) {
            console.warn("Reserves failed", err);
          }

          let buyLogs: any[] = [];
          let sellLogs: any[] = [];
          try {
            buyLogs = await marketContract.queryFilter(marketContract.filters.Buy(), fromBlock, 'latest');
            sellLogs = await marketContract.queryFilter(marketContract.filters.Sell(), fromBlock, 'latest');
          } catch (err) {
            console.warn("Failed to query market trade logs for", tokenAddr, err);
          }

          const allTrades: any[] = [];
          
          for (const blog of buyLogs) {
            const parsed = marketContract.interface.parseLog({ topics: blog.topics as string[], data: blog.data });
            if (parsed) {
              allTrades.push({
                traderAddress: parsed.args.buyer,
                tradeType: 'buy',
                usdcAmount: ethers.formatUnits(parsed.args.usdcIn, 6),
                tokenAmount: ethers.formatUnits(parsed.args.tokenOut, 18),
                timestamp: Math.floor(Date.now() / 1000), // block timestamp fallback or mock
                txHash: blog.transactionHash
              });
            }
          }

          for (const slog of sellLogs) {
            const parsed = marketContract.interface.parseLog({ topics: slog.topics as string[], data: slog.data });
            if (parsed) {
              allTrades.push({
                traderAddress: parsed.args.seller,
                tradeType: 'sell',
                usdcAmount: ethers.formatUnits(parsed.args.usdcOut, 6),
                tokenAmount: ethers.formatUnits(parsed.args.tokenIn, 18),
                timestamp: Math.floor(Date.now() / 1000),
                txHash: slog.transactionHash
              });
            }
          }

          allTrades.sort((a, b) => b.timestamp - a.timestamp);

          if (allTrades.length > 0) {
            const historyKey = `arc_trades_${marketAddr.toLowerCase()}`;
            const fullTrades = allTrades.map(t => {
              const sp = parseFloat(t.usdcAmount) / parseFloat(t.tokenAmount);
              return {
                marketAddress: marketAddr,
                tokenAddress: tokenAddr,
                tokenSymbol: symbol,
                traderAddress: t.traderAddress,
                tradeType: t.tradeType,
                usdcAmount: t.usdcAmount,
                tokenAmount: t.tokenAmount,
                spotPrice: isNaN(sp) ? 0 : sp,
                marketCap: (isNaN(sp) ? 0 : sp) * 1_000_000_000,
                liquidity: (parseFloat(t.usdcAmount) || 0) * 2,
                usdcReserve: reserveUSDC.toString(),
                tokenReserve: reserveToken.toString(),
                timestamp: t.timestamp,
                blockTimestamp: t.timestamp,
                blockNumber: 0,
                txHash: t.txHash
              };
            });
            localStorage.setItem(historyKey, JSON.stringify(fullTrades));
          }

          const existing = assetsRef.current.find(a => a.contractAddress.toLowerCase() === tokenAddr.toLowerCase());

          const creatorMeta = creatorsMap.get(tokenAddr.toLowerCase());
          const usdcSeed = creatorMeta ? Number(ethers.formatUnits(creatorMeta.usdcSeed, 6)) : 10;
          const creatorWallet = creatorMeta ? creatorMeta.creator : (existing?.creatorHandle || '0x0000000000000000000000000000000000000000');
          const launchTxHash = creatorMeta ? creatorMeta.txHash : (existing?.txHash || '');

          const currentPrice = calculateSpotPrice(reserveUSDC, reserveToken);
          const marketCap = currentPrice * 1_000_000_000;
          const liquidity = (Number(reserveUSDC) / 1e6) * 2;
          
          const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
          const volume24h = allTrades
            .filter(t => t.timestamp >= oneDayAgo)
            .reduce((sum, t) => sum + parseFloat(t.usdcAmount), 0);

          const holdersSet = new Set<string>();
          holdersSet.add(creatorWallet.toLowerCase());
          allTrades.forEach(t => holdersSet.add(t.traderAddress.toLowerCase()));
          const holderCount = holdersSet.size;

          const initialPrice = usdcSeed / 600_000_000;
          const priceChangePercent = initialPrice > 0 ? ((currentPrice - initialPrice) / initialPrice) * 100 : 0;

          updatedAssets.push({
            id: existing?.id || Math.random().toString(36).substr(2, 9),
            name,
            symbol,
            contractAddress: tokenAddr,
            marketAddress: marketAddr,
            logo: existing?.logo || '🚀',
            category: existing?.category || 'Community',
            verificationStatus: existing?.verificationStatus || 'New',
            description: existing?.description || `Meme token ${name} (${symbol}) launched on Arc.`,
            creatorName: existing?.creatorName || (creatorWallet.slice(0, 6) + '...' + creatorWallet.slice(-4)),
            creatorHandle: creatorWallet,
            creatorAvatar: existing?.creatorAvatar || '👤',
            likes: existing?.likes || 0,
            views: existing?.views || 0,
            rank: existing?.rank || updatedAssets.length + 1,
            hotness: existing?.hotness || 0,
            followers: existing?.followers || 0,
            launchDate: existing?.launchDate || new Date().toISOString(),
            txHash: launchTxHash,
            
            // Computed dynamic stats
            price: currentPrice,
            marketCap,
            liquidity,
            volume24h,
            holderCount,
            priceChangePercent,
            tradeCount: allTrades.length
          });
        }

        if (active) {
          updatedAssets.sort((a, b) => a.rank - b.rank);

          // Smart deduplication: only call setAssets if dynamic data actually changed.
          // Compare a fingerprint of price/market fields to avoid re-rendering consumers
          // every 5 seconds when the blockchain state is identical.
          const fingerprint = (arr: MemeAsset[]) =>
            arr.map(a => `${a.contractAddress}:${a.price?.toFixed(10)}:${a.marketCap?.toFixed(2)}:${a.holderCount}:${a.tradeCount}`).join('|');

          setAssets(prev => {
            const prevFp = fingerprint(prev);
            const nextFp = fingerprint(updatedAssets);
            if (prevFp === nextFp) return prev; // Same data — no re-render
            return updatedAssets;

          });
          setIsAssetsLoading(false);
        }
      } catch (err) {
        console.error("Sync error:", err);
        setIsAssetsLoading(false);
      }
    };

    syncOnChainData();
    const interval = setInterval(syncOnChainData, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real wallet hooks
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // -------------------------------------------------
  // Profile handling – run when a wallet connects
  // -------------------------------------------------
  // Import the service lazily to avoid circular dependencies in the UI bundle
  // (the service itself only uses the Supabase client).
  // The effect runs once the wallet address is known.
  useEffect(() => {
    if (!isConnected || !address) return;
    // Dynamically import to keep the initial bundle small
    import('../services/profileService')
      .then(async ({ getProfileByWallet, createProfile }) => {
        const lowerAddress = address.toLowerCase();
        try {
          const profile = await getProfileByWallet(lowerAddress);
          if (!profile) {
            // Simple default username – can be refined later
            const defaultUsername = `user_${lowerAddress.slice(2, 8)}`;
            await createProfile({
              wallet_address: lowerAddress,
              username: defaultUsername,
              avatar_url: '',
              bio: ''
            });
            console.log('🟢 Created profile for', lowerAddress);
          } else {
            console.log('🔵 Profile already exists for', lowerAddress);
          }
        } catch (err) {
          console.error('Profile service error', err);
        }
      })
      .catch(e => console.error('Failed to load profile service', e));
  }, [isConnected, address]);
  const { disconnect: disconnectWallet } = useDisconnect();

  // Profile Management
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>(() => {
    try {
      const stored = localStorage.getItem('arc_profiles');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('arc_profiles', JSON.stringify(profiles));
    } catch (e) {}
  }, [profiles]);

  const currentUser = isConnected && address ? profiles[address] || null : null;
  const showOnboarding = isConnected && address && !currentUser ? true : false;

  const createProfile = useCallback((displayName: string) => {
    if (!address) return;
    const newProfile: UserProfile = {
      walletAddress: address,
      displayName,
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      avatarSeed: displayName.charAt(0).toUpperCase(),
      verificationStatus: 'Creator'
    };
    setProfiles(prev => ({ ...prev, [address]: newProfile }));
  }, [address]);

  const addToken = useCallback((token: MemeAsset) => {
    setAssets(prev => [token, ...prev]);
  }, []);

  // USDC balance
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: address,
    query: {
      enabled: isConnected,
    },
  });

  const usdcBalance = useMemo(() => {
    if (!balanceData) return null;
    try {
      const formatted = formatUnits(balanceData.value, balanceData.decimals);
      return formatted;
    } catch {
      return null;
    }
  }, [balanceData]);

  const contextValue = useMemo(() => ({
    activeTab,
    setActiveTab,
    selectedAsset,
    setSelectedAsset,
    isWalletConnected: isConnected,
    walletAddress: address,
    chainName: 'Arc Testnet',
    chainId: undefined,
    disconnectWallet,
    usdcBalance,
    usdcBalanceLoading: balanceLoading,
    assets: visibleAssets,
    isAssetsLoading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    activities,
    currentUser,
    creatorProfiles: profiles,
    showOnboarding,
    createProfile,
    addToken,
    addActivity,
    theme,
    setTheme
  }), [
    activeTab,
    selectedAsset,
    isConnected,
    address,
    disconnectWallet,
    usdcBalance,
    balanceLoading,
    assets,
    isAssetsLoading,
    searchQuery,
    categoryFilter,
    activities,
    currentUser,
    profiles,
    showOnboarding,
    createProfile,
    addToken,
    addActivity,
    theme
  ]);

  return (
    <AppProviderErrorBoundary>
      <AppContext.Provider value={contextValue}>
        {children}
      </AppContext.Provider>
    </AppProviderErrorBoundary>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
