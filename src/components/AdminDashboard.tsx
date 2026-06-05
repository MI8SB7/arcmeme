import React, { useMemo, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ShieldAlert, Users, Activity, Rocket, ArrowRightLeft, Lock } from 'lucide-react';
import { APP_CONFIG } from '../config/constants';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export const AdminDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { assets, creatorProfiles } = useAppContext();

  const isAdmin = isConnected && address && APP_CONFIG.ADMIN_WALLET_ADDRESS 
    ? address.toLowerCase() === APP_CONFIG.ADMIN_WALLET_ADDRESS.toLowerCase()
    : false;

  // ---------------------------------------------------------------------------
  // Trade metrics from Supabase trade_events (canonical source after migration).
  // ---------------------------------------------------------------------------
  const [tradeMetrics, setTradeMetrics] = useState<{
    totalTrades: number;
    tradeUsers: string[];
    activeTradeUsers: string[];
  }>({ totalTrades: 0, tradeUsers: [], activeTradeUsers: [] });

  useEffect(() => {
    if (!isAdmin) return;
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('trade_events')
          .select('trader_address, timestamp');
        if (error || !data || !isMounted) return;
        const SEVEN_DAYS_SEC = 7 * 24 * 60 * 60;
        const nowSec = Math.floor(Date.now() / 1000);
        setTradeMetrics({
          totalTrades: data.length,
          tradeUsers: data.map(r => r.trader_address.toLowerCase()),
          activeTradeUsers: data
            .filter(r => r.timestamp && (nowSec - Number(r.timestamp)) <= SEVEN_DAYS_SEC)
            .map(r => r.trader_address.toLowerCase()),
        });
      } catch (e) {
        console.error('Failed to load trade metrics from Supabase', e);
      }
    })();
    return () => { isMounted = false; };
  }, [isAdmin]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!isAdmin) return { totalUsers: 0, activeUsers: 0, totalTokens: 0, totalTransactions: 0 };

    const uniqueUsers = new Set<string>();
    const activeUsers = new Set<string>();
    const SEVEN_DAYS_SEC = 7 * 24 * 60 * 60;
    const nowSec = Math.floor(Date.now() / 1000);

    // 1. Add users from creator profiles
    Object.keys(creatorProfiles).forEach(wallet => {
      uniqueUsers.add(wallet.toLowerCase());
    });

    // 2. Add users from token launches
    assets.forEach(asset => {
      if (asset.creatorHandle) {
        const handle = asset.creatorHandle.toLowerCase();
        uniqueUsers.add(handle);
        const launchSec = Math.floor(new Date(asset.launchDate).getTime() / 1000);
        if (nowSec - launchSec <= SEVEN_DAYS_SEC) {
          activeUsers.add(handle);
        }
      }
    });

    // 3. Add users from Supabase trade_events (replaces localStorage arc_trades_* loop)
    tradeMetrics.tradeUsers.forEach(trader => uniqueUsers.add(trader));
    tradeMetrics.activeTradeUsers.forEach(trader => activeUsers.add(trader));

    return {
      totalUsers: uniqueUsers.size,
      activeUsers: activeUsers.size,
      totalTokens: assets.length,
      totalTransactions: assets.length + tradeMetrics.totalTrades
    };
  }, [isAdmin, assets, creatorProfiles, tradeMetrics]);

  if (!isConnected || !isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 animate-fadeIn h-full min-h-[60vh]">
        <div className="glassmorphism p-10 rounded-2xl flex flex-col items-center max-w-md w-full text-center border-red-500/20">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <Lock size={40} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-text mb-4">Access Denied</h2>
          <p className="text-muted text-lg mb-2">
            This area is restricted to the platform administrator.
          </p>
          <div className="w-full bg-sidebar p-4 rounded-xl border border-border/80 text-left mt-6">
            <span className="text-xs text-muted block mb-1">Your Wallet:</span>
            <span className="text-sm text-accent font-mono break-all">
              {isConnected ? address : 'Not Connected'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 md:px-10 py-10 max-w-7xl mx-auto w-full animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2 flex items-center">
          <ShieldAlert className="mr-3 text-red-500" />
          Admin Panel
        </h1>
        <p className="text-muted">Platform overview and real-time metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="glassmorphism-light p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={80} className="text-primary" />
          </div>
          <div className="relative z-10">
            <h3 className="text-muted font-medium mb-1 flex items-center">
              <Users size={16} className="mr-2 text-primary" /> Total Users
            </h3>
            <p className="text-4xl font-bold text-text">{metrics.totalUsers.toLocaleString()}</p>
          </div>
        </div>

        {/* Active Users */}
        <div className="glassmorphism-light p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={80} className="text-[#10B981]" />
          </div>
          <div className="relative z-10">
            <h3 className="text-muted font-medium mb-1 flex items-center">
              <Activity size={16} className="mr-2 text-[#10B981]" /> Active Users (7d)
            </h3>
            <p className="text-4xl font-bold text-text">{metrics.activeUsers.toLocaleString()}</p>
          </div>
        </div>

        {/* Total Tokens Created */}
        <div className="glassmorphism-light p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Rocket size={80} className="text-accent" />
          </div>
          <div className="relative z-10">
            <h3 className="text-muted font-medium mb-1 flex items-center">
              <Rocket size={16} className="mr-2 text-accent" /> Tokens Created
            </h3>
            <p className="text-4xl font-bold text-text">{metrics.totalTokens.toLocaleString()}</p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="glassmorphism-light p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowRightLeft size={80} className="text-purple-400" />
          </div>
          <div className="relative z-10">
            <h3 className="text-muted font-medium mb-1 flex items-center">
              <ArrowRightLeft size={16} className="mr-2 text-purple-400" /> Transactions
            </h3>
            <p className="text-4xl font-bold text-text">{metrics.totalTransactions.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
