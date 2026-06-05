import { supabase } from '../lib/supabase';

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
    try {
      const dbRow = {
        market_address: tradeEvent.marketAddress,
        token_address: tradeEvent.tokenAddress,
        token_symbol: tradeEvent.tokenSymbol,
        trader_address: tradeEvent.traderAddress,
        trade_type: tradeEvent.tradeType,
        usdc_amount: tradeEvent.usdcAmount,
        token_amount: tradeEvent.tokenAmount,
        spot_price: tradeEvent.spotPrice,
        market_cap: tradeEvent.marketCap,
        liquidity: tradeEvent.liquidity,
        usdc_reserve: tradeEvent.usdcReserve,
        token_reserve: tradeEvent.tokenReserve,
        timestamp: tradeEvent.timestamp,
        block_timestamp: tradeEvent.blockTimestamp,
        block_number: tradeEvent.blockNumber,
        tx_hash: tradeEvent.txHash,
      };
      
      const { error } = await supabase.from('trade_events').insert([dbRow]);
      if (error) throw error;
    } catch (error) {
      console.error("indexerApi.addTradeEvent Error:", error);
      throw error;
    }
  },

  /**
   * Retrieves the chart data series for a specific market by deriving it from trades.
   * Returns data formatted for lightweight-charts: { time, value }
   */
  getChartData: async (marketAddress: string): Promise<{ time: number, value: number }[]> => {
    try {
      const { data, error } = await supabase
        .from('trade_events')
        .select('timestamp, block_timestamp, spot_price')
        .eq('market_address', marketAddress)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      return data.map(trade => ({
        time: trade.block_timestamp > 0 ? Number(trade.block_timestamp) : Number(trade.timestamp),
        value: Number(trade.spot_price)
      }));
    } catch (error) {
      console.error("indexerApi.getChartData Error:", error);
      return [];
    }
  },

  /**
   * Retrieves the most recent market stats (price, cap, liquidity).
   */
  getMarketStats: async (marketAddress: string): Promise<MarketStats | null> => {
    try {
      const { data, error } = await supabase
        .from('trade_events')
        .select('spot_price, market_cap, liquidity')
        .eq('market_address', marketAddress)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        price: Number(data.spot_price),
        marketCap: Number(data.market_cap),
        liquidity: Number(data.liquidity)
      };
    } catch (error) {
      console.error("indexerApi.getMarketStats Error:", error);
      return null;
    }
  },

  /**
   * Retrieves the recent trade history for a specific market.
   */
  getRecentTrades: async (marketAddress: string): Promise<TradeEvent[]> => {
    try {
      const { data, error } = await supabase
        .from('trade_events')
        .select('*')
        .eq('market_address', marketAddress)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;
      if (!data) return [];

      return data.map(row => ({
        marketAddress: row.market_address,
        tokenAddress: row.token_address,
        tokenSymbol: row.token_symbol,
        traderAddress: row.trader_address,
        tradeType: row.trade_type as 'buy' | 'sell',
        usdcAmount: row.usdc_amount,
        tokenAmount: row.token_amount,
        spotPrice: Number(row.spot_price),
        marketCap: Number(row.market_cap),
        liquidity: Number(row.liquidity),
        usdcReserve: row.usdc_reserve,
        tokenReserve: row.token_reserve,
        timestamp: Number(row.timestamp),
        blockTimestamp: Number(row.block_timestamp),
        blockNumber: Number(row.block_number),
        txHash: row.tx_hash
      }));
    } catch (error) {
      console.error("indexerApi.getRecentTrades Error:", error);
      return [];
    }
  },

  /**
   * Retrieves all trades for a specific user across ALL markets.
   */
  getUserTrades: async (userAddress: string, _registryMarkets?: string[]): Promise<TradeEvent[]> => {
    try {
      // With Supabase, we can just query by trader_address directly across all markets!
      const { data, error } = await supabase
        .from('trade_events')
        .select('*')
        .eq('trader_address', userAddress)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(row => ({
        marketAddress: row.market_address,
        tokenAddress: row.token_address,
        tokenSymbol: row.token_symbol,
        traderAddress: row.trader_address,
        tradeType: row.trade_type as 'buy' | 'sell',
        usdcAmount: row.usdc_amount,
        tokenAmount: row.token_amount,
        spotPrice: Number(row.spot_price),
        marketCap: Number(row.market_cap),
        liquidity: Number(row.liquidity),
        usdcReserve: row.usdc_reserve,
        tokenReserve: row.token_reserve,
        timestamp: Number(row.timestamp),
        blockTimestamp: Number(row.block_timestamp),
        blockNumber: Number(row.block_number),
        txHash: row.tx_hash
      }));
    } catch (error) {
      console.error("indexerApi.getUserTrades Error:", error);
      return [];
    }
  },

  /**
   * Calculates the cost basis (USDC spent - USDC received) for a user on a specific market.
   */
  getUserCostBasis: async (userAddress: string, marketAddress: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('trade_events')
        .select('trade_type, usdc_amount')
        .eq('market_address', marketAddress)
        .eq('trader_address', userAddress);

      if (error) throw error;
      if (!data) return 0;

      let costBasis = 0;
      for (const trade of data) {
        const usdc = parseFloat(trade.usdc_amount);
        if (!isNaN(usdc)) {
          if (trade.trade_type === 'buy') {
            costBasis += usdc;
          } else {
            costBasis -= usdc;
          }
        }
      }
      return costBasis;
    } catch (error) {
      console.error("indexerApi.getUserCostBasis Error:", error);
      return 0;
    }
  },

  /**
   * Records a snapshot of the user's total portfolio value.
   */
  recordPortfolioSnapshot: async (wallet: string, portfolioValue: number): Promise<void> => {
    try {
      if (!wallet || portfolioValue <= 0) return;

      const dbRow = {
        wallet: wallet.toLowerCase(),
        timestamp: Math.floor(Date.now() / 1000),
        portfolio_value: portfolioValue
      };

      const { error } = await supabase.from('portfolio_snapshots').insert([dbRow]);
      if (error) throw error;
    } catch (error) {
      console.error("indexerApi.recordPortfolioSnapshot Error:", error);
    }
  }
};
