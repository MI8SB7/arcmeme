import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { AssetCard } from './AssetCard';
import { Flame, ArrowLeft } from 'lucide-react';
import { getRankedTrendingAssets } from '../utils/dashboardData';

export const TrendingPage: React.FC = () => {
  const { assets, isAssetsLoading } = useAppContext();

  const rankedTrending = useMemo(() => {
    return getRankedTrendingAssets(assets);
  }, [assets]);

  return (
    <div className="flex-1 px-6 md:px-10 py-4 space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-text hover:border-accent transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center space-x-3">
            <Flame className="text-[#EF4444]" size={28} />
            <h1 className="text-3xl font-bold text-text">Trending on ArcMeme</h1>
          </div>
        </div>
        <span className="text-sm text-muted">
          {rankedTrending.length} token{rankedTrending.length !== 1 ? 's' : ''} ranked
        </span>
      </div>

      {/* Ranking explanation */}
      <div className="glassmorphism-light rounded-xl border border-border p-4 text-sm text-muted">
        <span className="font-semibold text-text">How trending is calculated:</span>{' '}
        Tokens are scored by <span className="text-accent font-medium">Volume (50%)</span> +{' '}
        <span className="text-accent font-medium">Trades (30%)</span> +{' '}
        <span className="text-accent font-medium">Holders (20%)</span> and ranked highest first.
      </div>

      {/* Token Grid */}
      {isAssetsLoading && assets.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <AssetCard key={i} loading={true} />
          ))}
        </div>
      ) : rankedTrending.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rankedTrending.map((ranked, index) => (
            <AssetCard
              key={ranked.asset.id}
              asset={ranked.asset}
              rank={index + 1}
              showRank
            />
          ))}
        </div>
      ) : (
        <div className="w-full rounded-2xl bg-card/40 border border-border flex flex-col items-center justify-center p-16 shadow-sm">
          <Flame className="text-muted mb-4" size={48} />
          <p className="text-muted font-medium text-lg">No community tokens launched yet.</p>
          <Link to="/create" className="mt-4 text-accent hover:text-secondary text-sm font-medium transition-colors">
            Launch the first token →
          </Link>
        </div>
      )}
    </div>
  );
};
