// d:\arcmeme\src\utils\indexerApi.ts
// Mock API layer wrapping localStorage to simulate a future backend/indexer.

export interface TradeEvent {
  marketAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  traderAddress: string;
  tradeType: 'buy' | 'sell';
  usdcAmount: string;
  tokenAmount: string;
  spotPrice: number;
  marketCap: number;
  liquidity: number;
  usdcReserve: string;
  tokenReserve: string;
  timestamp: number;
  blockTimestamp: number;
  blockNumber: number;
  txHash: string;
}

export interface PortfolioSnapshot {
  wallet: string;
  timestamp: number;
  portfolioValue: number;
}

export interface MarketStats {
  price: number;
  marketCap: number;
  liquidity: number;
}

export const indexerApi = {
  /**
   * Records a new comprehensive trade event.
   * Single Source of Truth for the entire ecosystem.
   */
  addTradeEvent: async (tradeEvent: TradeEvent): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const historyKey = `arc_trades_${tradeEvent.marketAddress.toLowerCase()}`;
          console.log(`[STORAGE AUDIT] WRITE -> Key: ${historyKey}`);
          
          const existingHistoryRaw = localStorage.getItem(historyKey);
          const existingHistory: TradeEvent[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];
          console.log(`[STORAGE AUDIT] WRITE -> Pre-append count: ${existingHistory.length}`);
          
          existingHistory.unshift(tradeEvent);
          const trimmedHistory = existingHistory.slice(0, 500);
          
          localStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
          resolve();
        } catch (error) {
          console.error("indexerApi.addTradeEvent Error:", error);
          reject(error);
        }
      }, 50);
    });
  },

  /**
   * Retrieves the chart data series for a specific market by deriving it from trades.
   * Returns data formatted for lightweight-charts: { time, value }
   */
  getChartData: async (marketAddress: string): Promise<{ time: number, value: number }[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const historyKey = `arc_trades_${marketAddress.toLowerCase()}`;
        console.log(`[STORAGE AUDIT] READ -> Key: ${historyKey}`);
        
        const raw = localStorage.getItem(historyKey);
        if (!raw) {
          console.log(`[STORAGE AUDIT] READ -> Key missing, returning []`);
          return resolve([]);
        }

        const history: TradeEvent[] = JSON.parse(raw);
        console.log(`[STORAGE AUDIT] READ -> Post-parse count: ${history.length}`);
        
        // Map to lightweight-charts format (sorted oldest to newest)
        const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
        
        const chartPoints = sortedHistory.map(trade => ({
          time: trade.blockTimestamp > 0 ? trade.blockTimestamp : trade.timestamp,
          value: trade.spotPrice
        }));

        console.log("RAW_TRADES", history);
        console.log("MAPPED_TRADES", chartPoints);
        console.log("RETURNED_ARRAY", chartPoints);

        resolve(chartPoints);
      }, 50);
    });
  },

  /**
   * Retrieves the most recent market stats (price, cap, liquidity).
   */
  getMarketStats: async (marketAddress: string): Promise<MarketStats | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const historyKey = `arc_trades_${marketAddress.toLowerCase()}`;
        const raw = localStorage.getItem(historyKey);
        if (!raw) return resolve(null);

        const history: TradeEvent[] = JSON.parse(raw);
        if (history.length === 0) return resolve(null);

        // First item is newest
        const latest = history[0];
        resolve({
          price: latest.spotPrice,
          marketCap: latest.marketCap,
          liquidity: latest.liquidity
        });
      }, 50);
    });
  },

  /**
   * Retrieves the recent trade history for a specific market.
   */
  getRecentTrades: async (marketAddress: string): Promise<TradeEvent[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const historyKey = `arc_trades_${marketAddress.toLowerCase()}`;
        const existingHistoryRaw = localStorage.getItem(historyKey);
        const existingHistory: TradeEvent[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];
        resolve(existingHistory);
      }, 50);
    });
  },

  /**
   * Retrieves all trades for a specific user across ALL markets.
   */
  getUserTrades: async (userAddress: string, registryMarkets: string[]): Promise<TradeEvent[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userTrades: TradeEvent[] = [];
        for (const market of registryMarkets) {
          const historyKey = `arc_trades_${market.toLowerCase()}`;
          const raw = localStorage.getItem(historyKey);
          if (raw) {
            const history: TradeEvent[] = JSON.parse(raw);
            const filtered = history.filter(t => t.traderAddress.toLowerCase() === userAddress.toLowerCase());
            userTrades.push(...filtered);
          }
        }
        userTrades.sort((a, b) => b.timestamp - a.timestamp); // Newest first
        resolve(userTrades);
      }, 50);
    });
  },

  /**
   * Calculates the cost basis (USDC spent - USDC received) for a user on a specific market.
   */
  getUserCostBasis: async (userAddress: string, marketAddress: string): Promise<number> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const historyKey = `arc_trades_${marketAddress.toLowerCase()}`;
        const raw = localStorage.getItem(historyKey);
        if (!raw) return resolve(0);

        const history: TradeEvent[] = JSON.parse(raw);
        let costBasis = 0;

        for (const trade of history) {
          if (trade.traderAddress.toLowerCase() === userAddress.toLowerCase()) {
            const usdc = parseFloat(trade.usdcAmount);
            if (!isNaN(usdc)) {
              if (trade.tradeType === 'buy') {
                costBasis += usdc;
              } else {
                costBasis -= usdc;
              }
            }
          }
        }
        resolve(costBasis);
      }, 50);
    });
  },

  /**
   * Records a snapshot of the user's total portfolio value.
   */
  recordPortfolioSnapshot: async (wallet: string, portfolioValue: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!wallet || portfolioValue <= 0) return resolve();

        const key = `arc_snapshot_${wallet.toLowerCase()}`;
        const raw = localStorage.getItem(key);
        const snapshots: PortfolioSnapshot[] = raw ? JSON.parse(raw) : [];

        snapshots.push({
          wallet: wallet.toLowerCase(),
          timestamp: Math.floor(Date.now() / 1000),
          portfolioValue
        });

        if (snapshots.length > 30) snapshots.shift();

        localStorage.setItem(key, JSON.stringify(snapshots));
        resolve();
      }, 10);
    });
  }
};
