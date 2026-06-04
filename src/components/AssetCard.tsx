import React from 'react';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MemeAsset } from '../types';
import { formatPrice } from '../utils/formatPrice';
import { formatDisplaySymbol } from '../utils/formatSymbol';
import { formatCompactBalance } from '../trading';
import { useAppContext } from '../context/AppContext';
import { getCreatorDisplayName } from '../utils/dashboardData';

interface AssetCardProps {
  asset?: MemeAsset;
  showRank?: boolean;
  rank?: number;
  loading?: boolean;
}

const SkeletonValue: React.FC = () => (
  <span className="inline-block animate-pulse bg-border/40 rounded h-3.5 w-14 align-middle" />
);

export const AssetCardSkeleton: React.FC = () => {
  return (
    <div className="glassmorphism rounded-2xl p-5 animate-pulse relative overflow-hidden block">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-10 h-10 bg-border/20 rounded-full border border-border"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-border/40 rounded w-2/3"></div>
          <div className="h-3 bg-border/40 rounded w-1/3"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-3 text-xs pt-3 border-t border-border mt-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={i % 2 === 0 ? "text-right" : ""}>
            <div className={`h-2.5 bg-border/40 rounded w-12 mb-1 ${i % 2 === 0 ? "ml-auto" : ""}`}></div>
            <div className={`h-4 bg-border/40 rounded w-16 ${i % 2 === 0 ? "ml-auto" : ""}`}></div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border flex flex-col space-y-2">
        <div className="h-3.5 bg-border/40 rounded w-3/4"></div>
      </div>
    </div>
  );
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset, showRank, rank, loading }) => {
  const { creatorProfiles } = useAppContext();

  if (loading || !asset) {
    return <AssetCardSkeleton />;
  }

  const hasPrice = asset.price !== undefined && asset.price > 0;
  const hasLiquidity = asset.liquidity !== undefined && asset.liquidity > 0;
  const hasMarketCap = asset.marketCap !== undefined && asset.marketCap > 0;

  return (
    <Link 
      to={`/token/${asset.contractAddress}`}
      className="glassmorphism rounded-2xl p-5 hover:scale-[1.01] hover:border-accent transition-all duration-300 cursor-pointer group relative overflow-hidden block"
    >
      {(showRank || rank !== undefined) && (
        <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border text-text font-bold shadow-md z-10">
          #{rank !== undefined ? rank : asset.rank}
        </div>
      )}

      {asset.verificationStatus !== 'None' && !showRank && (
        <div className="absolute top-4 right-4 flex items-center justify-center px-2 py-1 rounded-full bg-card border border-border text-xs font-semibold z-10 shadow-md">
          {asset.verificationStatus === 'Verified' && <span className="text-[#10B981]">Verified</span>}
          {asset.verificationStatus === 'Trending' && <span className="text-[#F59E0B]">Trending</span>}
          {asset.verificationStatus === 'New' && <span className="text-[#3B82F6]">New</span>}
        </div>
      )}

      <div className="flex items-center space-x-4 mb-4 relative z-10">
        <div className="text-4xl w-10 h-10 flex items-center justify-center bg-border/20 rounded-full overflow-hidden border border-border">
          {typeof asset.logo === 'string' && asset.logo.startsWith('data:image') ? (
            <img src={asset.logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl shrink-0">{asset.logo || '🚀'}</span>
          )}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-mono text-accent font-semibold">{formatDisplaySymbol(asset.symbol)}</span>
          <span className="block text-xs text-muted mt-1 truncate max-w-[140px]">{asset.name}</span>
        </div>
      </div>

      {/* Realtime Stats Grid */}
      <div className="grid grid-cols-2 gap-y-3 text-xs pt-3 border-t border-border mt-3 text-muted">
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Price</span>
          <span className="font-semibold text-text">
            {asset.price !== undefined ? (hasPrice ? `$${formatPrice(asset.price)}` : '--') : <SkeletonValue />}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Liquidity</span>
          <span className="font-semibold text-text">
            {asset.liquidity !== undefined ? (hasLiquidity ? `$${formatCompactBalance(asset.liquidity)}` : '--') : <SkeletonValue />}
          </span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Holders</span>
          <span className="font-semibold text-text">
            {asset.holderCount !== undefined ? asset.holderCount : <SkeletonValue />}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Market Cap</span>
          <span className="font-semibold text-[#10B981]">
            {asset.marketCap !== undefined ? (hasMarketCap ? `$${formatCompactBalance(asset.marketCap)}` : '--') : <SkeletonValue />}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex flex-col space-y-2">
        <div className="flex items-center text-xs text-muted">
          <User size={12} className="mr-1.5 text-primary" />
          <span className="truncate">Creator: <span className="text-text font-medium">{getCreatorDisplayName(asset, creatorProfiles)}</span></span>
        </div>
      </div>
    </Link>
  );
};
