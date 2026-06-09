import React from 'react';
import { X, Heart, Eye, User, Share2, BarChart2, Users, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AssetCard } from './AssetCard';
import { getCreatorDisplayName } from '../utils/dashboardData';
import { formatDisplaySymbol } from '../utils/formatSymbol';
import { TokenLogo } from './TokenLogo';

export const AssetDetailModal: React.FC = () => {
  const { selectedAsset, setSelectedAsset, assets, creatorProfiles } = useAppContext();

  if (!selectedAsset) return null;

  const relatedAssets = assets
    .filter(a => a.category === selectedAsset.category && a.id !== selectedAsset.id)
    .slice(0, 2); // Show 2 related tokens

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-sm">
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={() => setSelectedAsset(null)}
      ></div>
      
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto glassmorphism border border-border shadow-[0_0_40px_rgba(124,58,237,0.15)] rounded-2xl flex flex-col animate-fadeIn">
        
        {/* Header */}
        <div className="sticky top-0 z-20 flex justify-between items-start p-6 bg-card/95 border-b border-border backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              <TokenLogo logo={selectedAsset.logo} symbol={selectedAsset.symbol} size="w-full h-full" />
            </div>
            <div>
              <div className="flex flex-col items-start">
                  <span className="text-3xl font-bold text-text">{formatDisplaySymbol(selectedAsset.symbol)}</span>
                  <h2 className="text-xl font-semibold text-text">{selectedAsset.name}</h2>
                  <div className="flex items-center space-x-3 mt-1 text-sm">
                    <span className="text-muted">•</span>
                    <span className="text-[#10B981]">{selectedAsset.category}</span>
                  </div>
                </div>
            </div>
          </div>
          
          <button 
            onClick={() => setSelectedAsset(null)}
            className="p-2 text-muted hover:text-text hover:bg-cardLight rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8 flex-1">
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Column: Info & Creator */}
            <div className="xl:col-span-1 space-y-6">
              
              <div className="glassmorphism-light p-5 rounded-xl border border-border">
                <h3 className="text-sm font-semibold text-text mb-3 uppercase tracking-wider">About</h3>
                <p className="text-muted text-sm leading-relaxed">
                  {selectedAsset.description}
                </p>
              </div>

              <div className="glassmorphism-light p-5 rounded-xl border border-border">
                <h3 className="text-sm font-semibold text-text mb-3 uppercase tracking-wider">Creator</h3>
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{selectedAsset.creatorAvatar}</div>
                  <div>
                    <p className="font-medium text-text">{getCreatorDisplayName(selectedAsset, creatorProfiles)}</p>
                    <p className="text-sm text-[#06B6D4]">{selectedAsset.creatorHandle}</p>
                  </div>
                </div>
              </div>

              <div className="glassmorphism-light p-5 rounded-xl border border-border">
                <h3 className="text-sm font-semibold text-text mb-3 uppercase tracking-wider">Community Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted flex items-center"><Heart size={16} className="mr-2 text-[#EF4444]" /> Likes</span>
                    <span className="text-text font-medium">{selectedAsset.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted flex items-center"><Eye size={16} className="mr-2 text-[#10B981]" /> Views</span>
                    <span className="text-text font-medium">{selectedAsset.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted flex items-center"><Users size={16} className="mr-2 text-[#A855F7]" /> Followers</span>
                    <span className="text-text font-medium">{selectedAsset.followers?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/50">
                    <span className="text-muted flex items-center"><User size={16} className="mr-2 text-[#3B82F6]" /> Rank</span>
                    <span className="text-text font-medium">#{selectedAsset.rank}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Analytics & Related */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Analytics Placeholder */}
              <div className="glassmorphism-light p-6 rounded-xl border border-border h-48 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-[rgba(6,182,212,0.1)] flex items-center justify-center mb-4">
                  <BarChart2 size={32} className="text-[#06B6D4] opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-text mb-2">Token Analytics</h3>
                <p className="text-muted">No market data available yet.</p>
              </div>

              {/* Related Tokens */}
              {relatedAssets.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text">Related Tokens</h3>
                    <button className="text-sm text-[#06B6D4] hover:text-[#3B82F6] flex items-center">
                      View more <ArrowRight size={14} className="ml-1" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedAssets.map(asset => (
                      <AssetCard key={asset.id} asset={asset} showRank={false} />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4 mt-auto">
                <button className="flex-1 glow-btn-primary py-3 rounded-xl flex items-center justify-center space-x-2">
                  <Heart size={18} className="fill-current" />
                  <span>Like Asset</span>
                </button>
                <button className="px-6 py-3 rounded-xl glassmorphism-light hover:bg-cardLight border border-border transition-colors flex items-center justify-center text-text">
                  <Share2 size={18} />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
