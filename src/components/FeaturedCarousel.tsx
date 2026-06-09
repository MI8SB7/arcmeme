import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatPrice } from '../utils/formatPrice';
import { formatDisplaySymbol } from '../utils/formatSymbol';
import { formatCompactBalance } from '../trading';
import { getCreatorDisplayName, getRankedTrendingAssets } from '../utils/dashboardData';
import { TokenLogo } from './TokenLogo';

const SkeletonValue: React.FC = () => (
  <span className="inline-block animate-pulse bg-border/40 rounded h-5 w-16 align-middle" />
);

export const FeaturedCarousel: React.FC = () => {
  const { assets, isAssetsLoading, creatorProfiles } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Hero slides use the same ranked trending source as the dashboard section.
  const top3Trending = useMemo(() => {
    if (!assets || assets.length === 0) return [];
    return getRankedTrendingAssets(assets)
      .slice(0, 3)
      .map(r => r.asset);
  }, [assets]);

  // Reset active index if the set or order of Top 3 assets updates in real-time
  const assetsKey = useMemo(() => {
    return top3Trending.map(a => a.contractAddress).join(',');
  }, [top3Trending]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [assetsKey]);

  // Auto rotation loop every 5 seconds
  useEffect(() => {
    if (top3Trending.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % top3Trending.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [top3Trending.length]);

  const handlePrev = () => {
    if (top3Trending.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + top3Trending.length) % top3Trending.length);
  };

  const handleNext = () => {
    if (top3Trending.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % top3Trending.length);
  };

  // Loading skeleton state
  if (isAssetsLoading && (!assets || assets.length === 0)) {
    return (
      <div className="w-full rounded-3xl bg-gradient-to-br from-cardLight to-card border border-border p-5 md:p-8 animate-pulse">
        <div className="flex flex-col gap-6">
          {/* Row 1 Skeleton */}
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-border/40 rounded-2xl shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-border/40 rounded w-1/3"></div>
                <div className="h-5 bg-border/40 rounded w-1/4"></div>
              </div>
            </div>
            <div className="w-28 h-10 bg-border/40 rounded-xl shrink-0"></div>
          </div>
          
          {/* Divider Skeleton */}
          <div className="border-t border-border/80 w-full"></div>
          
          {/* Row 2 Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 bg-border/40 rounded w-1/2"></div>
                <div className="h-5 bg-border/40 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (top3Trending.length === 0) {
    return (
      <div className="w-full rounded-3xl bg-card/40 border border-border flex items-center justify-center p-12 min-h-[200px] shadow-sm">
        <p className="text-muted font-medium text-lg">No community tokens launched yet.</p>
      </div>
    );
  }

  const featuredAsset = top3Trending[currentIndex];
  const hasPrice = featuredAsset.price !== undefined && featuredAsset.price > 0;
  const hasLiquidity = featuredAsset.liquidity !== undefined && featuredAsset.liquidity > 0;
  const hasMarketCap = featuredAsset.marketCap !== undefined && featuredAsset.marketCap > 0;
  const hasHolders = featuredAsset.holderCount !== undefined;
  const creatorDisplayName = getCreatorDisplayName(featuredAsset, creatorProfiles);

  return (
    <div className="w-full rounded-3xl bg-transparent overflow-hidden relative group/carousel">
      <Link 
        key={featuredAsset.contractAddress}
        to={`/token/${featuredAsset.contractAddress}`}
        className="block w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-cardLight to-card border border-border hover:border-accent/50 transition-all p-5 md:p-8 pb-12 md:pb-14 shadow-sm group/card animate-fadeIn"
      >
        <div className="relative z-10 flex flex-col gap-6">
          
          {/* Row 1: Logo | Name | Symbol (Left) & Trade Button (Right) */}
          <div className="flex items-center justify-between gap-4 w-full">
            
            {/* Logo, Name, Symbol, Creator (Left) */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-card border border-border rounded-2xl overflow-hidden shrink-0 shadow-sm group-hover/card:scale-105 transition-transform duration-500">
                <TokenLogo logo={featuredAsset.logo} symbol={featuredAsset.symbol} size="w-full h-full" />
              </div>
              
              {/* Name, Symbol, Creator Badge */}
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-4xl md:text-5xl font-extrabold text-text tracking-tight truncate max-w-[180px] sm:max-w-xs">
                    {formatDisplaySymbol(featuredAsset.symbol)}
                  </h2>
                  {featuredAsset.verificationStatus === 'Verified' && (
                    <CheckCircle2 size={24} className="text-[#10B981] shrink-0" />
                  )}
                </div>
                
                <span className="text-sm md:text-base font-medium text-muted truncate max-w-[180px] sm:max-w-xs">
                  {featuredAsset.name}
                </span>
                
                {/* Creator Badge below Name */}
                <div className="flex items-center space-x-1.5 text-xs text-muted mt-0.5">
                  <span>Created by</span>
                  <div className="inline-flex items-center space-x-1 bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full">
                    <div className="w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center text-[7px] text-white">
                      {featuredAsset.creatorAvatar || '👤'}
                    </div>
                    <span className="font-semibold text-[11px]">{creatorDisplayName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button (Right) - Never Clips */}
            <div className="btn-trade flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-extrabold text-sm transition-all group-hover/card:scale-[1.02] shrink-0 shadow-md min-w-[125px] whitespace-nowrap mr-8">
              <Rocket size={16} />
              <span>Trade Now</span>
            </div>

          </div>

          {/* Divider */}
          <div className="border-t border-border/80 w-full"></div>

          {/* Row 2: Price | Market Cap | Liquidity | Holders */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 w-full">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-muted mb-1 font-bold">Price</span>
              <span className="text-base md:text-lg font-black text-text break-all">
                {featuredAsset.price !== undefined ? (hasPrice ? `$${formatPrice(featuredAsset.price)}` : '--') : <SkeletonValue />}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-muted mb-1 font-bold">Market Cap</span>
              <span className="text-base md:text-lg font-black text-text">
                {featuredAsset.marketCap !== undefined ? (hasMarketCap ? `$${formatCompactBalance(featuredAsset.marketCap)}` : '--') : <SkeletonValue />}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-muted mb-1 font-bold">Liquidity</span>
              <span className="text-base md:text-lg font-black text-text">
                {featuredAsset.liquidity !== undefined ? (hasLiquidity ? `$${formatCompactBalance(featuredAsset.liquidity)}` : '--') : <SkeletonValue />}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-muted mb-1 font-bold">Holders</span>
              <span className="text-base md:text-lg font-black text-text">
                {hasHolders ? featuredAsset.holderCount : <SkeletonValue />}
              </span>
            </div>
          </div>

        </div>
      </Link>

      {/* Manual Navigation Chevrons */}
      {top3Trending.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePrev(); }}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/65 border border-border flex items-center justify-center text-muted hover:text-text hover:bg-card transition-all z-20 cursor-pointer shadow-sm hover:scale-105"
            title="Previous Slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNext(); }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/65 border border-border flex items-center justify-center text-muted hover:text-text hover:bg-card transition-all z-20 cursor-pointer shadow-sm hover:scale-105"
            title="Next Slide"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {top3Trending.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {top3Trending.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex(idx); }}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx ? 'bg-accent w-4' : 'bg-muted/40 hover:bg-muted'
              }`}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
