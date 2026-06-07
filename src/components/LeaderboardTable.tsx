import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, CheckCircle2, Wallet, Coins, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useReadContracts } from 'wagmi';
import { parseAbi } from 'viem';
import { calculateSpotPrice, calculateMarketCap } from '../trading';
import { formatDisplaySymbol } from '../utils/formatSymbol';
import { getCreatorDisplayName } from '../utils/dashboardData';

import { indexerApi, type TradeEvent } from '../utils/indexerApi';

const TokenLogo: React.FC<{ logo: string; symbol: string }> = ({ logo, symbol }) => {
  if (typeof logo === 'string' && (logo.startsWith('data:image') || logo.startsWith('http') || logo.startsWith('/') || logo.includes('.png') || logo.includes('.jpg'))) {
    return <img src={logo} alt={symbol} className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-border/50 border border-border/80 flex items-center justify-center text-sm shrink-0 select-none">
      {logo || '🚀'}
    </div>
  );
};

export const LeaderboardTable: React.FC = () => {
  const { assets, creatorProfiles } = useAppContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'tokens' | 'creators' | 'traders'>('tokens');
  const [tradesMap, setTradesMap] = useState<Record<string, TradeEvent[]>>({});
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);

  // 1. Filter out assets with marketAddress for on-chain reserves calls
  const activeAssets = useMemo(() => {
    return assets.filter(a => !!a.marketAddress);
  }, [assets]);

  // 2. Multicall for reserveUSDC and reserveToken for active markets
  const marketAbi = parseAbi([
    "function reserveUSDC() view returns (uint256)",
    "function reserveToken() view returns (uint256)"
  ]);

  const multicallContracts = useMemo(() => {
    const calls = [];
    for (const asset of activeAssets) {
      calls.push({
        address: asset.marketAddress as `0x${string}`,
        abi: marketAbi,
        functionName: 'reserveUSDC'
      });
      calls.push({
        address: asset.marketAddress as `0x${string}`,
        abi: marketAbi,
        functionName: 'reserveToken'
      });
    }
    return calls;
  }, [activeAssets]);

  const { data: multicallData, isLoading: isLoadingReserves } = useReadContracts({
    contracts: multicallContracts as any,
    query: {
      enabled: multicallContracts.length > 0,
      refetchInterval: 10000, // Refresh every 10s
    }
  });

  // 3. Fetch trade events for all active assets to compute holders counts and trader volumes
  useEffect(() => {
    let isMounted = true;
    async function fetchAllTrades() {
      if (activeAssets.length === 0) {
        if (isMounted) setIsLoadingTrades(false);
        return;
      }
      setIsLoadingTrades(true);
      try {
        const promises = activeAssets.map(async (asset) => {
          const trades = await indexerApi.getRecentTrades(asset.marketAddress!);
          return { contractAddress: asset.contractAddress, trades };
        });
        const results = await Promise.all(promises);
        if (!isMounted) return;
        
        const newMap: Record<string, TradeEvent[]> = {};
        results.forEach(r => {
          newMap[r.contractAddress.toLowerCase()] = r.trades;
        });
        setTradesMap(newMap);
      } catch (e) {
        console.error("Failed to load trades for leaderboard calculations:", e);
      } finally {
        if (isMounted) setIsLoadingTrades(false);
      }
    }
    fetchAllTrades();
    return () => { isMounted = false; };
  }, [activeAssets]);

  // Map of reserves by asset contract address
  const reservesMap = useMemo(() => {
    const map: Record<string, { reserveUSDC: bigint; reserveToken: bigint }> = {};
    if (!multicallData) return map;

    activeAssets.forEach((asset, idx) => {
      const reserveUSDC = multicallData[idx * 2]?.result as bigint | undefined ?? 0n;
      const reserveToken = multicallData[idx * 2 + 1]?.result as bigint | undefined ?? 0n;
      map[asset.contractAddress.toLowerCase()] = { reserveUSDC, reserveToken };
    });
    return map;
  }, [activeAssets, multicallData]);

  // Formatter helpers
  const formatUSD = (val: number) => {
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderRank = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] mx-auto border border-[#F59E0B]/20">
          <Trophy size={16} />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/10 text-muted mx-auto border border-muted/20">
          <Medal size={16} />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#B45309]/10 text-[#B45309] mx-auto border border-[#B45309]/20">
          <Medal size={16} />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cardLight font-bold text-text mx-auto text-sm border border-border/50">
        #{rank}
      </div>
    );
  };

  // 4. TAB A: Tokens Calculation
  const tokensList = useMemo(() => {
    return assets.map(asset => {
      const reserves = reservesMap[asset.contractAddress.toLowerCase()] || { reserveUSDC: 0n, reserveToken: 0n };
      const spotPrice = calculateSpotPrice(reserves.reserveUSDC, reserves.reserveToken);
      const marketCap = calculateMarketCap(spotPrice);
      const liquidity = reserves.reserveUSDC !== undefined ? (Number(reserves.reserveUSDC) / 1e6 * 2) : 0;

      // Unique Holders Count calculation
      const uniqueHolders = new Set<string>();
      if (asset.creatorHandle) {
        uniqueHolders.add(asset.creatorHandle.toLowerCase());
      }
      const trades = tradesMap[asset.contractAddress.toLowerCase()] || [];
      trades.forEach(t => {
        if (t.traderAddress) {
          uniqueHolders.add(t.traderAddress.toLowerCase());
        }
      });

      return {
        ...asset,
        spotPrice,
        marketCap,
        liquidity,
        holdersCount: uniqueHolders.size
      };
    }).sort((a, b) => b.marketCap - a.marketCap);
  }, [assets, reservesMap, tradesMap]);

  // 5. TAB B: Creators Calculation
  const creatorsList = useMemo(() => {
    const creatorGroups: Record<string, {
      handle: string;
      name: string;
      avatar: string;
      tokensCount: number;
    }> = {};

    assets.forEach(asset => {
      const handle = asset.creatorHandle || 'Unknown';
      const handleLower = handle.toLowerCase();

      if (!creatorGroups[handleLower]) {
        creatorGroups[handleLower] = {
          handle: handle,
          name: getCreatorDisplayName(asset, creatorProfiles),
          avatar: asset.creatorAvatar || '👤',
          tokensCount: 0
        };
      }
      creatorGroups[handleLower].tokensCount += 1;
    });

    return Object.values(creatorGroups).sort((a, b) => b.tokensCount - a.tokensCount);
  }, [assets, creatorProfiles]);

  // 6. TAB C: Traders Calculation
  const tradersList = useMemo(() => {
    const traderVolumes: Record<string, number> = {};

    Object.values(tradesMap).forEach((trades) => {
      trades.forEach((trade) => {
        const trader = trade.traderAddress;
        if (!trader) return;

        const traderLower = trader.toLowerCase();
        const volume = parseFloat(trade.usdcAmount) || 0;

        if (!traderVolumes[traderLower]) {
          traderVolumes[traderLower] = 0;
        }
        traderVolumes[traderLower] += volume;
      });
    });

    return Object.entries(traderVolumes)
      .map(([wallet, volume]) => ({
        wallet,
        volume
      }))
      .sort((a, b) => b.volume - a.volume);
  }, [tradesMap]);

  const isLoading = isLoadingReserves || isLoadingTrades;

  if (isLoading && assets.length > 0) {
    return (
      <div className="flex-1 px-4 sm:px-6 md:px-10 py-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text flex items-center">
              <Trophy size={32} className="text-[#F59E0B] mr-3" /> Leaderboard
            </h1>
            <p className="text-muted mt-1">Discover the top tokens, creators, and traders on ArcMeme.</p>
          </div>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Determine if active tab list is empty
  const isTabEmpty = 
    (activeTab === 'tokens' && tokensList.length === 0) ||
    (activeTab === 'creators' && creatorsList.length === 0) ||
    (activeTab === 'traders' && tradersList.length === 0);

  return (
    <div className="flex-1 px-4 sm:px-6 md:px-10 py-8 max-w-6xl mx-auto w-full space-y-6">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text flex items-center">
          <Trophy size={32} className="text-[#F59E0B] mr-3" /> Leaderboard
        </h1>
        <p className="text-muted mt-1">Discover the top tokens, creators, and traders on ArcMeme.</p>
      </div>

      {/* Tabs Container */}
      <div className="inline-flex p-1 bg-sidebar/80 border border-border/80 rounded-xl mb-6 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
            activeTab === 'tokens'
              ? 'bg-text text-background shadow-md'
              : 'text-muted hover:text-text'
          }`}
        >
          <Coins size={16} />
          <span>Top Tokens</span>
        </button>
        <button
          onClick={() => setActiveTab('creators')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
            activeTab === 'creators'
              ? 'bg-text text-background shadow-md'
              : 'text-muted hover:text-text'
          }`}
        >
          <User size={16} />
          <span>Top Creators</span>
        </button>
        <button
          onClick={() => setActiveTab('traders')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
            activeTab === 'traders'
              ? 'bg-text text-background shadow-md'
              : 'text-muted hover:text-text'
          }`}
        >
          <Wallet size={16} />
          <span>Top Traders</span>
        </button>
      </div>

      {/* Leaderboard Table / Empty State */}
      {isTabEmpty ? (
        <div className="p-16 rounded-2xl border border-dashed border-border/50 text-center bg-sidebar/40 my-8 shadow-sm">
          <p className="text-muted font-medium text-lg">No leaderboard data yet</p>
        </div>
      ) : (
        <div className="glassmorphism rounded-2xl overflow-hidden border border-border/80 shadow-md">
          <div className="overflow-x-auto">
            {activeTab === 'tokens' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sidebar border-b border-border/80 text-muted text-xs uppercase tracking-wider">
                    <th className="p-5 font-medium text-center w-16">Rank</th>
                    <th className="p-5 font-medium w-16">Logo</th>
                    <th className="p-5 font-medium">Name</th>
                    <th className="p-5 font-medium">Symbol</th>
                    <th className="p-5 font-medium text-right">Market Cap</th>
                    <th className="p-5 font-medium text-right hidden sm:table-cell">Liquidity</th>
                    <th className="p-5 font-medium text-right hidden md:table-cell">Holders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {tokensList.map((token, index) => (
                    <tr
                      key={token.contractAddress}
                      onClick={() => navigate(`/trade/${token.contractAddress}`)}
                      className="hover:bg-cardLight transition-colors cursor-pointer group"
                    >
                      <td className="p-5 text-center">
                        {renderRank(index + 1)}
                      </td>
                      <td className="p-5">
                        <TokenLogo logo={token.logo} symbol={token.symbol} />
                      </td>
                      <td className="p-5">
                        <span className="font-bold text-text group-hover:text-accent transition-colors line-clamp-1">
                          {token.name}
                        </span>
                      </td>
                      <td className="p-5 font-mono text-accent font-semibold">
                         {formatDisplaySymbol(token.symbol)}
                      </td>
                      <td className="p-5 text-right font-semibold text-text">
                        {formatUSD(token.marketCap)}
                      </td>
                      <td className="p-5 text-right font-medium text-muted hidden sm:table-cell">
                        {formatUSD(token.liquidity)}
                      </td>
                      <td className="p-5 text-right font-mono text-text hidden md:table-cell">
                        {token.holdersCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'creators' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sidebar border-b border-border/80 text-muted text-xs uppercase tracking-wider">
                    <th className="p-5 font-medium text-center w-16">Rank</th>
                    <th className="p-5 font-medium">Creator</th>
                    <th className="p-5 font-medium text-center w-40">Tokens Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {creatorsList.map((creator, index) => (
                    <tr
                      key={creator.handle}
                      onClick={() => navigate(`/creator/${creator.handle}`)}
                      className="hover:bg-cardLight transition-colors cursor-pointer group"
                    >
                      <td className="p-5 text-center">
                        {renderRank(index + 1)}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl bg-border/50 w-12 h-12 flex items-center justify-center rounded-full border border-border/80 group-hover:border-primary transition-colors shrink-0">
                            {creator.avatar}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-bold text-text text-base group-hover:text-accent transition-colors">
                                {creator.name}
                              </p>
                              {index < 3 && <CheckCircle2 size={14} className="text-[#10B981]" />}
                            </div>
                            <p className="text-xs text-muted font-mono break-all max-w-[200px] sm:max-w-xs md:max-w-md">
                              {creator.handle.startsWith('0x') ? shortenAddress(creator.handle) : creator.handle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-accent/10 text-accent font-semibold border border-accent/20 font-mono">
                          {creator.tokensCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'traders' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sidebar border-b border-border/80 text-muted text-xs uppercase tracking-wider">
                    <th className="p-5 font-medium text-center w-16">Rank</th>
                    <th className="p-5 font-medium">Wallet</th>
                    <th className="p-5 font-medium text-right">Total Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {tradersList.map((trader, index) => (
                    <tr
                      key={trader.wallet}
                      className="hover:bg-cardLight/25 transition-colors"
                    >
                      <td className="p-5 text-center">
                        {renderRank(index + 1)}
                      </td>
                      <td className="p-5 font-mono text-text font-semibold">
                        <div className="flex items-center space-x-2">
                          <Wallet size={14} className="text-muted" />
                          <span>{shortenAddress(trader.wallet)}</span>
                        </div>
                      </td>
                      <td className="p-5 text-right font-semibold text-[#10B981] font-mono">
                        {formatUSD(trader.volume)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
