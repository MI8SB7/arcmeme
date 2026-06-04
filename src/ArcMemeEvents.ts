// d:\arcmeme\src\ArcMemeEvents.ts
import { ethers } from 'ethers';
import { USDC_DECIMALS, TOKEN_DECIMALS } from './trading';

// ABIs specifically for Event filtering
export const FACTORY_EVENTS_ABI = [
  "event TokenCreated(address indexed token, address indexed market, address indexed creator, string name, string symbol, uint256 usdcSeed)"
];

export const MARKET_EVENTS_ABI = [
  "event Buy(address indexed buyer, uint256 usdcIn, uint256 tokenOut)",
  "event Sell(address indexed seller, uint256 tokenIn, uint256 usdcOut)",
  "event Paused(address account)",
  "event Unpaused(address account)",
  "event MarketInitialized(uint256 tokenAmount, uint256 usdcAmount)"
];

export type ActivityItem = {
  type: "CREATE" | "BUY" | "SELL" | "PAUSE" | "UNPAUSE";
  tokenAddress: string;
  user: string;
  amount: string; // Formatted string representation for UI
  timestamp: number;
};

/**
 * Parses raw blockchain event logs into the clean UI format.
 */
export async function parseEvent(
  event: ethers.EventLog | ethers.Log,
  contractInterface: ethers.Interface,
  tokenAddress: string,
  provider: ethers.Provider
): Promise<ActivityItem | null> {
  try {
    const parsedLog = contractInterface.parseLog({
      topics: event.topics as string[],
      data: event.data
    });
    
    if (!parsedLog) return null;

    // Fetch timestamp from the block
    const block = await provider.getBlock(event.blockHash);
    const timestamp = block ? block.timestamp * 1000 : Date.now();

    switch (parsedLog.name) {
      case 'TokenCreated':
        return {
          type: "CREATE",
          tokenAddress: parsedLog.args.token,
          user: parsedLog.args.creator,
          amount: `${ethers.formatUnits(parsedLog.args.usdcSeed, Number(USDC_DECIMALS))} USDC`,
          timestamp
        };
      case 'Buy':
        return {
          type: "BUY",
          tokenAddress,
          user: parsedLog.args.buyer,
          amount: `${ethers.formatUnits(parsedLog.args.usdcIn, Number(USDC_DECIMALS))} USDC`,
          timestamp
        };
      case 'Sell':
        return {
          type: "SELL",
          tokenAddress,
          user: parsedLog.args.seller,
          amount: `${ethers.formatUnits(parsedLog.args.tokenIn, Number(TOKEN_DECIMALS))} MEME`,
          timestamp
        };
      case 'Paused':
        return {
          type: "PAUSE",
          tokenAddress,
          user: parsedLog.args.account,
          amount: "-",
          timestamp
        };
      case 'Unpaused':
        return {
          type: "UNPAUSE",
          tokenAddress,
          user: parsedLog.args.account,
          amount: "-",
          timestamp
        };
      default:
        return null;
    }
  } catch (error) {
    console.warn("Failed to parse event", error);
    return null;
  }
}

/**
 * Fetches recent historical activity (past events) for the feed.
 */
export async function getRecentActivity(
  provider: ethers.Provider,
  factoryAddress: string,
  marketAddress: string, // Address of a specific market to track
  tokenAddress: string,  // Address of the token tied to the market
  fromBlock: number = -10000 // Look back roughly ~10k blocks by default
): Promise<ActivityItem[]> {
  const factoryInterface = new ethers.Interface(FACTORY_EVENTS_ABI);
  const marketInterface = new ethers.Interface(MARKET_EVENTS_ABI);
  
  const factoryContract = new ethers.Contract(factoryAddress, FACTORY_EVENTS_ABI, provider);
  const marketContract = new ethers.Contract(marketAddress, MARKET_EVENTS_ABI, provider);

  const activities: ActivityItem[] = [];

  // Fetch Factory Events (TokenCreated)
  const factoryLogs = await factoryContract.queryFilter('*', fromBlock, 'latest');
  for (const log of factoryLogs) {
    const item = await parseEvent(log, factoryInterface, tokenAddress, provider);
    if (item && item.type === "CREATE") activities.push(item);
  }

  // Fetch Market Events (Buy, Sell, Paused, Unpaused)
  const marketLogs = await marketContract.queryFilter('*', fromBlock, 'latest');
  for (const log of marketLogs) {
    // Ignore MarketInitialized as it's implied by CREATE for the UI feed
    if (log.topics[0] !== marketInterface.getEvent('MarketInitialized')!.topicHash) {
      const item = await parseEvent(log, marketInterface, tokenAddress, provider);
      if (item) activities.push(item);
    }
  }

  // Sort newest first
  return activities.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Subscribes to real-time events and executes a callback when one occurs.
 * Returns cleanup functions to remove listeners when components unmount.
 */
export function subscribeToEvents(
  provider: ethers.Provider,
  factoryAddress: string,
  marketAddress: string,
  tokenAddress: string,
  onNewActivity: (activity: ActivityItem) => void
): () => void {
  const factoryContract = new ethers.Contract(factoryAddress, FACTORY_EVENTS_ABI, provider);
  const marketContract = new ethers.Contract(marketAddress, MARKET_EVENTS_ABI, provider);
  
  const factoryInterface = new ethers.Interface(FACTORY_EVENTS_ABI);
  const marketInterface = new ethers.Interface(MARKET_EVENTS_ABI);

  const handleFactoryEvent = async (...args: any[]) => {
    const event = args[args.length - 1]; // ethers v6 passes EventLog as last arg
    const item = await parseEvent(event, factoryInterface, tokenAddress, provider);
    if (item && item.type === "CREATE") onNewActivity(item);
  };

  const handleMarketEvent = async (...args: any[]) => {
    const event = args[args.length - 1];
    if (event.topics[0] === marketInterface.getEvent('MarketInitialized')!.topicHash) return;
    
    const item = await parseEvent(event, marketInterface, tokenAddress, provider);
    if (item) onNewActivity(item);
  };

  // Attach listeners
  factoryContract.on('*', handleFactoryEvent);
  marketContract.on('*', handleMarketEvent);

  // Return unsubscribe cleanup function
  return () => {
    factoryContract.off('*', handleFactoryEvent);
    marketContract.off('*', handleMarketEvent);
  };
}
