import React, { useMemo, useEffect, useState } from 'react';
import { DEV_CONTRACTS } from '../config/devContracts';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { FeaturedCarousel } from './FeaturedCarousel';
import { AssetCard } from './AssetCard';
import { Flame, Star, Rocket, ArrowRight } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

import { getCreatorDisplayName, getRankedTrendingAssets } from '../utils/dashboardData';
import { formatDisplaySymbol } from '../utils/formatSymbol';

const SkeletonValue: React.FC = () => (
  <span className="inline-block animate-pulse bg-border/40 rounded h-4 w-16 align-middle" />
);

export const Dashboard: React.FC = () => {
  const { assets, activities, isAssetsLoading, creatorProfiles } = useAppContext();
  
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const getRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 60) return `${Math.max(0, seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Sort activities newest first
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => b.timestamp - a.timestamp);
  }, [activities]);

  // Filter out activities related to dev contracts or missing token symbols
  const filteredActivities = useMemo(() => {
    return sortedActivities.filter((activity) => {
      const token = assets.find((t) => t.contractAddress === activity.contractAddress);
      if (!token) return false;
      // Exclude if contract is in DEV_CONTRACTS (case-insensitive)
      if (DEV_CONTRACTS.map((c) => c.toLowerCase()).includes(token.contractAddress.toLowerCase())) return false;
      // Exclude if token symbol is missing, empty, or just a dollar sign
      if (!token.symbol || token.symbol.trim() === '' || token.symbol.trim() === '$') return false;
      return true;
    });
  }, [sortedActivities, assets]);
  
  // Sort by launchDate or ID to get newest first for Latest Launches
  const latestLaunches = useMemo(() => [...assets].reverse().slice(0, 8), [assets]);
  
  // Dynamic Trending score ranking
  const rankedTrending = useMemo(() => {
    return getRankedTrendingAssets(assets);
  }, [assets]);

  const top3Trending = useMemo(() => rankedTrending.slice(0, 3).map(r => r.asset), [rankedTrending]);
  const remainingTrending = useMemo(() => rankedTrending.slice(3).map(r => r.asset), [rankedTrending]);

  // Top gainers by priceChangePercent
  const topGainers = useMemo(() => {
    return [...assets]
      .filter(a => a.priceChangePercent !== undefined)
      .sort((a, b) => (b.priceChangePercent || 0) - (a.priceChangePercent || 0))
      .slice(0, 6);
  }, [assets]);

  // Render Trending Section Skeleton
  const renderTrendingSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map((rank) => (
        <div 
          key={rank}
          className="flex flex-col p-6 glassmorphism rounded-2xl border border-border animate-pulse relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border/80 text-muted font-bold shadow-md z-10 text-lg">
            #{rank}
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 bg-border/20 rounded-full border border-border"></div>
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-border/40 rounded w-2/3"></div>
              <div className="h-4 bg-border/40 rounded w-1/3"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-3.5 text-xs text-muted pt-4 border-t border-border mt-auto">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Price</span>
              <div className="h-4 bg-border/40 rounded w-16"></div>
            </div>
            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Market Cap</span>
              <div className="h-4 bg-border/40 rounded w-16 ml-auto"></div>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Liquidity</span>
              <div className="h-4 bg-border/40 rounded w-16"></div>
            </div>
            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Holders</span>
              <div className="h-4 bg-border/40 rounded w-8 ml-auto"></div>
            </div>
            <div className="col-span-2 pt-2 border-t border-border/20 flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-wider text-muted">Volume (24h)</span>
              <div className="h-4 bg-border/40 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render Top Gainers Skeleton
  const renderGainerSkeletons = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((rank) => (
        <div 
          key={rank}
          className="flex items-center justify-between p-4 glassmorphism-light rounded-xl border border-border animate-pulse"
        >
          <div className="flex items-center space-x-4 flex-1">
            <div className="text-2xl w-10 text-center text-muted font-bold">#{rank}</div>
            <div className="w-10 h-10 bg-border/20 rounded-full border border-border"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-border/40 rounded w-1/3"></div>
              <div className="h-3 bg-border/40 rounded w-1/4"></div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end space-y-2">
            <div className="h-4 bg-border/40 rounded w-16"></div>
            <div className="h-3 bg-border/40 rounded w-10"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 space-y-8">
      
      {/* Section 1: Live Activity Feed */}
      {filteredActivities.length > 0 && (
        <section className="relative overflow-hidden glassmorphism-light border-y border-border bg-background/50 py-3">
          <div className="flex whitespace-nowrap animate-marquee items-center pl-6 hover:[animation-play-state:paused]">
            {filteredActivities.concat(filteredActivities).map((activity, idx) => {
              const token = assets.find(t => t.contractAddress === activity.contractAddress);
              const logo = token?.logo ?? '🚀';
              const isImage = typeof logo === 'string' && logo.startsWith('data:image');
              const creatorDisplayName = token 
                ? getCreatorDisplayName(token, creatorProfiles) 
                : getCreatorDisplayName({ creatorName: activity.creatorName, creatorHandle: activity.creatorName } as any, creatorProfiles);
              
              return (
                <Link to={`/token/${activity.contractAddress}`} key={`${activity.id}-${idx}`} className="flex items-center space-x-2 mx-8 text-sm hover:opacity-85 transition-opacity">
                  <span className="w-5 h-5 flex items-center justify-center overflow-hidden rounded-full shrink-0 bg-border/50">
                    {isImage ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-sm">{logo}</span>}
                  </span>
                  <span className="text-text font-semibold">
                    <span className="font-extrabold text-[#4F46E5] dark:text-[#A855F7]">{creatorDisplayName}</span>
                    <span className="mx-1 text-text/80 font-medium">launched</span>
                    <span className="font-extrabold text-text">{formatDisplaySymbol(token?.symbol ?? "")}</span>
                  </span>
                  <span className="text-[#64748B] dark:text-[#94A3B8] text-xs ml-2">({getRelativeTime(activity.timestamp)})</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0] dark:bg-border ml-8 shrink-0"></div>
                </Link>
              );
            })}
          </div>
          <div className="absolute right-0 top-0 z-10 h-full bg-gradient-to-l from-background to-transparent w-24"></div>
        </section>
      )}

      {/* Featured Carousel */}
      <section className="px-6 md:px-10">
        <FeaturedCarousel />
      </section>

      <div className="px-6 md:px-10 space-y-12 pb-20">
        
        {/* Trending Tokens */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Flame className="text-[#EF4444]" size={24} />
              <h2 className="text-2xl font-bold text-text">Trending on ArcMeme</h2>
            </div>
            <button className="text-sm text-accent hover:text-secondary flex items-center transition-colors">
              View all <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          
          {/* Top 3 Large Featured Cards */}
          {isAssetsLoading && assets.length === 0 ? (
            renderTrendingSkeletons()
          ) : top3Trending.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
{top3Trending.map((asset, index) => (
  <AssetCard key={asset.id} asset={asset} rank={index + 1} showRank />
))}
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-card/40 border border-border flex items-center justify-center p-10 shadow-sm">
              <p className="text-muted font-medium text-lg">No community tokens launched yet.</p>
            </div>
          )}

          {/* Remaining Trending Tokens as horizontal cards */}
          {(isAssetsLoading && assets.length === 0) ? (
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">More Trending</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[4, 5, 6, 7, 8, 9, 10].map((rank) => (
                  <AssetCard key={rank} loading={true} rank={rank} />
                ))}
              </div>
            </div>
          ) : remainingTrending.length > 0 ? (
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">More Trending</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {remainingTrending.slice(0, 7).map((asset, index) => (
                  <AssetCard key={asset.id} asset={asset} rank={index + 4} />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* Latest Launches */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Rocket className="text-[#A855F7]" size={28} />
              <h2 className="text-2xl md:text-3xl font-bold text-text">Latest Launches</h2>
            </div>
            <button className="text-sm text-accent hover:text-secondary flex items-center transition-colors">
              View all <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          
          {isAssetsLoading && assets.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <AssetCard key={i} loading={true} />
              ))}
            </div>
          ) : latestLaunches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestLaunches.slice(0, 4).map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-card/40 border border-border flex items-center justify-center p-10 shadow-sm">
              <p className="text-muted font-medium text-lg">No community tokens launched yet.</p>
            </div>
          )}
        </section>

        {/* Top Gainers */}
        <section>
          <div className="flex items-center space-x-3 mb-8">
            <Star className="text-[#F59E0B]" size={24} />
            <h2 className="text-2xl font-bold text-text">Top Gainers</h2>
          </div>
          
          {isAssetsLoading && assets.length === 0 ? (
            renderGainerSkeletons()
          ) : topGainers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {topGainers.map((asset, idx) => {
                const isNewToken = !asset.tradeCount || asset.tradeCount === 0;
                const isPositive = asset.priceChangePercent !== undefined && asset.priceChangePercent >= 0;
                const hasPrice = asset.price !== undefined && asset.price > 0;

                return (
                  <Link 
                    key={asset.id}
                    to={`/token/${asset.contractAddress}`}
                    className="flex items-center justify-between p-4 glassmorphism-light rounded-xl border border-border hover:border-accent transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl w-10 text-center text-muted font-bold">#{idx + 1}</div>
                      <div className="text-4xl w-10 h-10 flex items-center justify-center bg-border/20 rounded-full overflow-hidden border border-border shrink-0">
                        {typeof asset.logo === 'string' && asset.logo.startsWith('data:image') ? (
                          <img src={asset.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          asset.logo ?? '🚀'
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-mono text-accent font-semibold">{formatDisplaySymbol(asset.symbol)}</span>
                        <span className="block text-xs text-muted mt-1 truncate max-w-[140px]">
                          Created by {getCreatorDisplayName(asset, creatorProfiles)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="text-text font-bold">
                        {asset.price !== undefined ? (hasPrice ? `$${formatPrice(asset.price)}` : '--') : <SkeletonValue />}
                      </div>
                      <div className={`font-semibold text-xs mt-1 ${isNewToken ? 'text-[#3B82F6]' : (isPositive ? 'text-[#10B981]' : 'text-[#EF4444]')}`}>
                        {asset.priceChangePercent !== undefined ? (
                          isNewToken 
                            ? 'New' 
                            : `${isPositive ? '+' : ''}${asset.priceChangePercent?.toFixed(2)}%`
                        ) : (
                          <SkeletonValue />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-card/40 border border-border flex items-center justify-center p-10 shadow-sm">
              <p className="text-muted font-medium text-lg">No community tokens launched yet.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
