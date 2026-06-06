import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Rocket, ArrowLeft, Search, Clock, X } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import { formatDisplaySymbol } from '../utils/formatSymbol';
import { formatCompactBalance } from '../trading';
import { getCreatorDisplayName } from '../utils/dashboardData';

/**
 * Renders a token logo with reliable fallback.
 */
const TokenLogo: React.FC<{ logo?: string; size?: string }> = ({ logo, size = 'w-10 h-10' }) => {
  const isImage =
    typeof logo === 'string' &&
    logo.length > 0 &&
    (logo.startsWith('data:image') || logo.startsWith('http') || logo.startsWith('/'));

  if (isImage) {
    return (
      <img
        src={logo}
        alt="Token"
        className={`${size} rounded-full object-cover shrink-0`}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const fallback = document.createElement('span');
          fallback.className = 'text-xl';
          fallback.textContent = '🚀';
          target.parentElement?.appendChild(fallback);
        }}
      />
    );
  }

  return <span className="text-xl shrink-0">{logo && logo.length > 0 ? logo : '🚀'}</span>;
};

export const LatestLaunchesPage: React.FC = () => {
  const { assets, isAssetsLoading, creatorProfiles } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  // All assets sorted by launchDate, newest first
  const allLaunches = useMemo(() => {
    return [...assets]
      .sort((a, b) => {
        const dateA = a.launchDate ? new Date(a.launchDate).getTime() : 0;
        const dateB = b.launchDate ? new Date(b.launchDate).getTime() : 0;
        return dateB - dateA;
      });
  }, [assets]);

  // Filtered by search
  const filteredLaunches = useMemo(() => {
    if (!searchQuery.trim()) return allLaunches;
    const q = searchQuery.trim().toLowerCase();
    return allLaunches.filter((asset) =>
      asset.name.toLowerCase().includes(q) ||
      asset.symbol.toLowerCase().includes(q) ||
      asset.contractAddress.toLowerCase().includes(q) ||
      (asset.creatorName && asset.creatorName.toLowerCase().includes(q))
    );
  }, [allLaunches, searchQuery]);

  const getRelativeTime = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${Math.max(0, seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div className="flex-1 px-6 md:px-10 py-4 space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-text hover:border-accent transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center space-x-3">
            <Rocket className="text-[#A855F7]" size={28} />
            <h1 className="text-3xl font-bold text-text">Latest Launches</h1>
          </div>
        </div>
        <span className="text-sm text-muted">
          {filteredLaunches.length} of {allLaunches.length} token{allLaunches.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, symbol, creator, or address..."
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-card border border-border text-text placeholder:text-muted/60 text-sm focus:outline-none focus:border-accent transition-colors"
        />
        {searchQuery.length > 0 && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Launches Grid */}
      {isAssetsLoading && assets.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="glassmorphism rounded-2xl p-5 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-border/20 rounded-full border border-border"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-border/40 rounded w-2/3"></div>
                  <div className="h-3 bg-border/40 rounded w-1/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 pt-3 border-t border-border">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j}>
                    <div className="h-2.5 bg-border/40 rounded w-12 mb-1"></div>
                    <div className="h-4 bg-border/40 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filteredLaunches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLaunches.map((asset) => (
            <Link
              key={asset.id}
              to={`/token/${asset.contractAddress}`}
              className="glassmorphism rounded-2xl p-5 hover:scale-[1.01] hover:border-accent transition-all duration-300 cursor-pointer group relative overflow-hidden block"
            >
              {/* Logo + Name + Symbol */}
              <div className="flex items-center space-x-4 mb-4 relative z-10">
                <div className="w-10 h-10 flex items-center justify-center bg-border/20 rounded-full overflow-hidden border border-border shrink-0">
                  <TokenLogo logo={asset.logo} size="w-10 h-10" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-mono text-accent font-semibold truncate max-w-[140px]">
                    {formatDisplaySymbol(asset.symbol)}
                  </span>
                  <span className="block text-xs text-muted mt-0.5 truncate max-w-[140px]">{asset.name}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-y-3 text-xs pt-3 border-t border-border mt-3 text-muted">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Price</span>
                  <span className="font-semibold text-text">
                    {asset.price !== undefined && asset.price > 0 ? `$${formatPrice(asset.price)}` : '--'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Mkt Cap</span>
                  <span className="font-semibold text-[#10B981]">
                    {asset.marketCap !== undefined && asset.marketCap > 0 ? `$${formatCompactBalance(asset.marketCap)}` : '--'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Liquidity</span>
                  <span className="font-semibold text-text">
                    {asset.liquidity !== undefined && asset.liquidity > 0 ? `$${formatCompactBalance(asset.liquidity)}` : '--'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase tracking-wider text-muted mb-0.5">Launched</span>
                  <span className="font-semibold text-text flex items-center justify-end space-x-1">
                    <Clock size={10} className="text-muted" />
                    <span>{asset.launchDate ? getRelativeTime(asset.launchDate) : '--'}</span>
                  </span>
                </div>
              </div>

              {/* Creator */}
              <div className="mt-4 pt-3 border-t border-border flex items-center text-xs text-muted">
                <span className="truncate">
                  Creator: <span className="text-text font-medium">{getCreatorDisplayName(asset, creatorProfiles)}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="w-full rounded-2xl bg-card/40 border border-border flex flex-col items-center justify-center p-16 shadow-sm">
          {searchQuery.trim() ? (
            <>
              <Search className="text-muted mb-4" size={48} />
              <p className="text-muted font-medium text-lg">No tokens match "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-accent hover:text-secondary text-sm font-medium transition-colors"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <Rocket className="text-muted mb-4" size={48} />
              <p className="text-muted font-medium text-lg">No community tokens launched yet.</p>
              <Link to="/create" className="mt-4 text-accent hover:text-secondary text-sm font-medium transition-colors">
                Launch the first token →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};
