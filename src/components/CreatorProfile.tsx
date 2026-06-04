import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Calendar, LayoutGrid, Search, TrendingUp, Layers, PieChart, Activity, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatDisplaySymbol } from '../utils/formatSymbol';
import { AssetCard } from './AssetCard';
import { formatWalletFallback, getCreatorDisplayName } from '../utils/dashboardData';
import { usePortfolio } from '../hooks/usePortfolio';
import { formatUnits } from 'viem';
import { formatCompactBalance, TOKEN_DECIMALS } from '../trading';
import usdcLogo from '../assets/usdc.png';

const TokenLogo: React.FC<{ logo: string; symbol: string }> = ({ logo, symbol }) => {
  if (typeof logo === 'string' && logo.startsWith('data:image')) {
    return <img src={logo} alt={symbol} className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-border/50 border border-border/80 flex items-center justify-center text-sm shrink-0 select-none">
      {logo || '🚀'}
    </div>
  );
};

export const CreatorProfile: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const { assets, walletAddress, currentUser, creatorProfiles, usdcBalance } = useAppContext();
  const navigate = useNavigate();

  // Portfolio hooks for the target address
  const { isLoading, holdings, metrics, recentTrades } = usePortfolio(address);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'balance'>('value');

  // Filter & Sort Holdings
  const displayHoldings = useMemo(() => {
    let result = [...holdings];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(h => 
        h.asset.name.toLowerCase().includes(q) || 
        h.asset.symbol.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'value') return b.currentValueUSDC - a.currentValueUSDC;
      if (sortBy === 'pnl') return b.unrealizedPnL - a.unrealizedPnL;
      if (sortBy === 'balance') return Number(formatUnits(b.balance, Number(TOKEN_DECIMALS))) - Number(formatUnits(a.balance, Number(TOKEN_DECIMALS)));
      return 0;
    });
    return result;
  }, [holdings, searchQuery, sortBy]);

  // Find all tokens created by this address/handle
  const createdTokens = useMemo(() => {
    return assets.filter(a => a.creatorHandle === address);
  }, [assets, address]);
  
  const isOwnProfile = address === walletAddress;
  const profileData = address ? creatorProfiles[address] : undefined;
  
  const displayName = isOwnProfile
    ? currentUser?.displayName || formatWalletFallback(address)
    : createdTokens[0]
      ? getCreatorDisplayName(createdTokens[0], creatorProfiles)
      : profileData?.displayName || formatWalletFallback(address);

  const avatarSeed = isOwnProfile ? currentUser?.avatarSeed : (profileData?.avatarSeed || createdTokens[0]?.creatorAvatar || '👤');
  const joinedDate = isOwnProfile && currentUser ? currentUser.joinedAt : (profileData?.joinedAt || 'Unavailable');

  if (!address) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <h2 className="text-2xl font-bold text-text mb-4">Creator not found</h2>
        <Link to="/" className="text-primary hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const isVerified = createdTokens.some(t => t.verificationStatus === 'Verified') || profileData?.verificationStatus?.includes('Verified');

  return (
    <div className="flex-1 px-4 sm:px-6 md:px-10 py-6 max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
      
      {/* Navigation */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="p-2 rounded-xl bg-border/50 hover:bg-border/80 text-muted hover:text-text transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-text">Creator Profile</h1>
      </div>

      {/* Section 1: Creator Information */}
      <div className="glassmorphism-light p-8 md:p-12 rounded-3xl border border-border/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#7C3AED] flex items-center justify-center text-5xl font-bold text-white shadow-md shrink-0 border-4 border-sidebar">
            {avatarSeed}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <h2 className="text-3xl font-bold text-text break-all">{displayName}</h2>
              {isVerified && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-bold uppercase tracking-wider mx-auto md:mx-0">
                  <CheckCircle2 size={14} className="mr-1.5" /> Verified Creator
                </div>
              )}
            </div>
            
            <p className="text-sm text-accent font-mono mb-6 bg-accent/10 inline-block px-3 py-1 rounded-lg">
              {address}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-muted uppercase tracking-wider mb-1">Total Tokens Created</span>
                <span className="text-xl font-bold text-text flex items-center">
                  <LayoutGrid size={18} className="mr-2 text-[#3B82F6]" />
                  {createdTokens.length}
                </span>
              </div>
              <div className="w-px h-10 bg-border/80 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-xs text-muted uppercase tracking-wider mb-1">Joined Date</span>
                <span className="text-xl font-bold text-text flex items-center">
                  <Calendar size={18} className="mr-2 text-[#A855F7]" />
                  {joinedDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Section 2: Portfolio Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glassmorphism-light p-6 rounded-2xl border border-border/50 shadow-sm">
              <div className="text-muted text-xs uppercase tracking-wider mb-2 flex items-center space-x-2">
                <PieChart size={16} className="text-accent" /> <span>Total Portfolio Value</span>
              </div>
              <div className="text-3xl font-extrabold text-text">
                ${formatCompactBalance((parseFloat(isOwnProfile ? (usdcBalance || '0') : '0') + metrics.totalValue).toString())}
              </div>
            </div>
            
            <div className="glassmorphism-light p-6 rounded-2xl border border-border/50 shadow-sm">
              <div className="text-muted text-xs uppercase tracking-wider mb-2 flex items-center space-x-2">
                <img src={usdcLogo} alt="USDC" className="w-4 h-4 rounded-full shrink-0" /> <span>USDC Balance</span>
              </div>
              <div className="text-3xl font-extrabold text-text">
                {isOwnProfile ? `$${formatCompactBalance(parseFloat(usdcBalance || '0').toString())}` : 'Hidden'}
              </div>
            </div>

            <div className="glassmorphism-light p-6 rounded-2xl border border-border/50 shadow-sm">
              <div className="text-muted text-xs uppercase tracking-wider mb-2 flex items-center space-x-2">
                <Layers size={16} className="text-[#06B6D4]" /> <span>Meme Token Value</span>
              </div>
              <div className="text-3xl font-extrabold text-text">
                ${formatCompactBalance(metrics.totalValue.toString())}
              </div>
            </div>

            <div className="glassmorphism-light p-6 rounded-2xl border border-border/50 shadow-sm">
              <div className="text-muted text-xs uppercase tracking-wider mb-2 flex items-center space-x-2">
                <TrendingUp size={16} className="text-[#10B981]" /> <span>Positions</span>
              </div>
              <div className="text-3xl font-extrabold text-text">
                {holdings.length}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Section 3: My Holdings */}
              <div className="glassmorphism-light p-6 rounded-2xl border border-border/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-text">Holdings</h3>
                  </div>
                  
                  {holdings.length > 0 && (
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-48">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                        <input 
                          type="text" 
                          placeholder="Search tokens..." 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full bg-cardLight border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-text focus:outline-none focus:border-[#10B981]"
                        />
                      </div>
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-cardLight border border-border rounded-xl py-2 px-3 text-sm text-text focus:outline-none focus:border-[#10B981]"
                      >
                        <option value="value">Sort by Value</option>
                        <option value="balance">Sort by Balance</option>
                      </select>
                    </div>
                  )}
                </div>

                {holdings.length === 0 ? (
                  <div className="text-center py-8 text-muted">
                    No tokens held currently.
                  </div>
                ) : displayHoldings.length === 0 ? (
                  <div className="text-center py-8 text-muted">
                    No tokens found matching your search.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-muted text-xs uppercase border-b border-border/50">
                          <th className="pb-3 font-medium w-12">Logo</th>
                          <th className="pb-3 font-medium">Token</th>
                          <th className="pb-3 font-medium text-right">Balance</th>
                          <th className="pb-3 font-medium text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayHoldings.map((h, i) => (
                          <tr 
                            key={i} 
                            className="border-b border-border/20 hover:bg-border/35 transition-colors cursor-pointer"
                            onClick={() => navigate(`/trade/${h.asset.contractAddress}`)}
                          >
                            <td className="py-4">
                              <TokenLogo logo={h.asset.logo} symbol={h.asset.symbol} />
                            </td>
                            <td className="py-4 font-bold text-text">
                              <div className="flex flex-col min-w-0">
                                <span className="truncate max-w-[120px] sm:max-w-xs">{h.asset.name}</span>
                                <span className="text-xs text-muted font-mono font-normal mt-0.5">{formatDisplaySymbol(h.asset.symbol)}</span>
                              </div>
                            </td>
                            <td className="py-4 text-right font-medium text-text">
                              {formatCompactBalance(formatUnits(h.balance, Number(TOKEN_DECIMALS)))}
                            </td>
                            <td className="py-4 text-right font-bold text-[#10B981]">
                              ${formatCompactBalance(h.currentValueUSDC.toString())}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 4: My Tokens */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-text">Launched Tokens</h3>
                {createdTokens.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {createdTokens.map((asset) => (
                      <AssetCard key={asset.id} asset={asset} />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center text-muted">
                    This creator has not launched any tokens yet.
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Recent Activity */}
            <div className="glassmorphism-light p-6 rounded-2xl border border-border/50 h-fit max-h-[800px] flex flex-col">
              <div className="flex items-center space-x-2 mb-6">
                <Activity className="text-[#10B981]" />
                <h3 className="text-xl font-bold text-text">Recent Activity</h3>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {recentTrades.length === 0 ? (
                  <div className="text-center py-8 text-muted text-sm">
                    No recent trading activity.
                  </div>
                ) : (
                  recentTrades.map((trade, i) => {
                    const isBuy = trade.tradeType === 'buy';
                    const asset = assets.find(a => a.marketAddress?.toLowerCase() === trade.marketAddress?.toLowerCase());
                    
                    return (
                      <div key={i} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-border/30 transition-colors">
                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center ${isBuy ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                          {isBuy ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-text">
                              {isBuy ? 'Bought' : 'Sold'} {trade.tokenSymbol || asset?.symbol || 'Token'}
                            </div>
                            <a 
                              href={`https://testnet.arcscan.app/tx/${trade.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted hover:text-[#10B981] transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                          <div className="text-sm text-muted mt-0.5">
                            {isBuy ? (
                              <>Paid <span className="text-text">{formatCompactBalance(trade.usdcAmount)} USDC</span> for <span className="text-text">{formatCompactBalance(trade.tokenAmount)}</span></>
                            ) : (
                              <>Sold <span className="text-text">{formatCompactBalance(trade.tokenAmount)}</span> for <span className="text-text">{formatCompactBalance(trade.usdcAmount)} USDC</span></>
                            )}
                          </div>
                          <div className="text-xs text-[#64748B] mt-1">
                            {new Date(trade.timestamp * 1000).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
};
