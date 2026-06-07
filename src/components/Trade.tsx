import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useReadContracts, useAccount, useReadContract } from 'wagmi';
import { erc20Abi, formatUnits, parseAbi } from 'viem';
import { BuyPanel } from './BuyPanel';
import { SellPanel } from './SellPanel';
import { TradingChart } from './TradingChart';
import { ARC_NATIVE_USDC, ARC_MEME_FACTORY_ADDRESS, ARC_MEME_FACTORY_ABI } from '../config/contracts';
import { calculateSpotPrice, calculateMarketCap, formatCompactBalance } from '../trading';
import { indexerApi, type TradeEvent } from '../utils/indexerApi';
import { formatPrice } from '../utils/formatPrice';
import { getCreatorDisplayName } from '../utils/dashboardData';
import { formatDisplaySymbol } from '../utils/formatSymbol';

const formatTimeAgo = (timestampInSeconds: number) => {
  const seconds = Math.floor(Date.now() / 1000 - timestampInSeconds);
  if (seconds < 0) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestampInSeconds * 1000).toLocaleDateString();
};

export function formatMicroPrice(price: number): string {
  return formatPrice(price);
}

export function renderMicroPrice(price: number): React.ReactNode {
  return formatPrice(price);
}

const shortenTxHash = (hash: string) => {
  if (!hash) return '';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export const Trade: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const { assets, creatorProfiles } = useAppContext();
  const { address: userAddress } = useAccount();
  
  const asset = assets.find((a) => a.contractAddress === address);
  const tokenAddress = (asset?.contractAddress || EMPTY_ADDRESS) as `0x${string}`;
  const contextMarketAddress = (asset?.marketAddress || EMPTY_ADDRESS) as `0x${string}`;
  
  // Dynamically resolve market address if it's missing from context
  const { data: factoryMarketAddress } = useReadContract({
    address: ARC_MEME_FACTORY_ADDRESS as `0x${string}`,
    abi: ARC_MEME_FACTORY_ABI,
    functionName: 'tokenToMarket',
    args: [tokenAddress],
    query: {
      enabled: tokenAddress !== EMPTY_ADDRESS && contextMarketAddress === EMPTY_ADDRESS,
    }
  });

  const marketAddress = (contextMarketAddress !== EMPTY_ADDRESS 
    ? contextMarketAddress 
    : (factoryMarketAddress as string || EMPTY_ADDRESS)) as `0x${string}`;
  const creatorAddress = (
    asset?.creatorHandle?.startsWith('0x') ? asset.creatorHandle : EMPTY_ADDRESS
  ) as `0x${string}`;
  
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [chartRefresh, setChartRefresh] = useState(0);

  const { data: tokenData } = useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'name',
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'totalSupply',
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [creatorAddress],
      }
    ],
    query: {
      enabled: !!asset?.contractAddress,
    }
  });

  const [nameRes, symbolRes, totalSupplyRes, decimalsRes] = tokenData || [];
  
  const tokenName = nameRes?.result as string || asset?.name || '';
  const tokenSymbol = symbolRes?.result as string || asset?.symbol || '';
  const decimals = decimalsRes?.result as number || 18;
  const totalSupply = totalSupplyRes?.result !== undefined ? formatUnits(totalSupplyRes.result as bigint, decimals) : 'Loading...';
  
  // const creatorBalance = creatorBalanceRes?.result as bigint | undefined;
  const [holderCount, setHolderCount] = useState<number>(1);
  const [recentTrades, setRecentTrades] = useState<TradeEvent[]>([]);
  
  useEffect(() => {
    const fetchMarketData = async () => {
      if (!marketAddress || marketAddress === EMPTY_ADDRESS) return;
      try {
        const trades = await indexerApi.getRecentTrades(marketAddress);
        const uniqueAddresses = new Set<string>();
        if (asset.creatorHandle) {
          uniqueAddresses.add(asset.creatorHandle.toLowerCase());
        }
        trades.forEach(t => {
          if (t.traderAddress) {
            uniqueAddresses.add(t.traderAddress.toLowerCase());
          }
        });
        setHolderCount(uniqueAddresses.size);

        // Sort trades by timestamp descending and take the top 10
        const sortedTrades = [...trades]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setRecentTrades(sortedTrades);
      } catch (e) {
        console.error("Error fetching market data:", e);
      }
    };
    fetchMarketData();
  }, [marketAddress, chartRefresh, asset?.creatorHandle]);

  const holders = totalSupplyRes?.result ? `${holderCount} Holder${holderCount === 1 ? '' : 's'}` : 'Loading...';

  const { data: dynamicData, error: readContractError, refetch: refetchDynamicData } = useReadContracts({
    contracts: [
      {
        address: marketAddress,
        abi: parseAbi(["function reserveUSDC() view returns (uint256)"]),
        functionName: 'reserveUSDC',
      },
      {
        address: marketAddress,
        abi: parseAbi(["function reserveToken() view returns (uint256)"]),
        functionName: 'reserveToken',
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress as `0x${string}`] : undefined,
      }
    ],
    query: {
      enabled: marketAddress !== EMPTY_ADDRESS,
      refetchInterval: 5000,
    }
  });

  const { data: nativeBalanceData, refetch: refetchNativeBalance } = useReadContract({
    address: ARC_NATIVE_USDC as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress }
  });

  const reserveUSDC = dynamicData?.[0]?.result as bigint | undefined;
  const reserveToken = dynamicData?.[1]?.result as bigint | undefined;
  const tokenBalance = dynamicData?.[2]?.result as bigint | undefined;
  const usdcBalance = nativeBalanceData as bigint | undefined;

  const handleRefetch = () => {
    refetchDynamicData();
    refetchNativeBalance();
    setChartRefresh(r => r + 1);
  };

  if (!asset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <h2 className="text-2xl font-bold text-[#F8FAFC] mb-4">Token not found</h2>
        <Link to="/" className="text-[#3B82F6] hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const spotPrice = (reserveUSDC !== undefined && reserveToken !== undefined) ? calculateSpotPrice(reserveUSDC, reserveToken) : 0;
  const marketCap = calculateMarketCap(spotPrice);
  const liquidity = reserveUSDC !== undefined ? (Number(reserveUSDC) / 1e6 * 2) : 0;
  const creatorDisplayName = getCreatorDisplayName(asset, creatorProfiles);

  const marketData = [
    { 
      label: 'Price', 
      value: spotPrice > 0 ? (
        <span className="select-all cursor-help" title={`$${spotPrice.toFixed(18).replace(/0+$/, '').replace(/\.$/, '')}`}>
          ${renderMicroPrice(spotPrice)}
        </span>
      ) : 'Loading...' 
    },
    { label: 'Market Cap', value: marketCap > 0 ? `$${marketCap.toLocaleString()}` : 'Loading...' },
    { label: 'Liquidity', value: liquidity > 0 ? `$${liquidity.toLocaleString()}` : 'Loading...' },
    { label: 'Holders', value: holders },
  ];

  console.log("=== Trade.tsx Diagnostics ===");
  console.log("asset.contractAddress:", asset.contractAddress);
  console.log("asset.marketAddress:", asset.marketAddress);
  console.log("readContractError:", readContractError);
  console.log("reserveUSDC (raw):", reserveUSDC);
  console.log("reserveToken (raw):", reserveToken);
  console.log("tokenBalance (raw):", tokenBalance);
  console.log("usdcBalance (raw):", usdcBalance);
  console.log("spotPrice:", spotPrice);
  console.log("=============================");

  return (
    <div className="flex-1 px-4 sm:px-6 md:px-10 py-6 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Navigation & Header */}
      <div className="flex items-center mb-4 space-x-4">
          <Link to="/" className="p-2 rounded-xl bg-border/50 hover:bg-border/80 text-muted hover:text-text transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col items-start">
            <span className="text-3xl font-extrabold text-text">{formatDisplaySymbol(asset.symbol)}</span>
            <span className="text-xl font-medium text-text">{asset.name}</span>
            <span className="text-xs text-muted font-mono truncate max-w-[150px] sm:max-w-xs">{asset.contractAddress}</span>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Panel: Market Data & Chart */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Market Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {marketData.map((data) => (
              <div key={data.label} className="glassmorphism-light p-4 rounded-xl border border-border/50">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">{data.label}</p>
                <p className="font-semibold text-[#10B981]">{data.value}</p>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <TradingChart marketAddress={marketAddress !== EMPTY_ADDRESS ? marketAddress : ''} refreshTrigger={chartRefresh} />

          {/* Recent Trades Section */}
          <div className="glassmorphism-light p-6 rounded-xl border border-border/50 space-y-4">
            <h3 className="text-lg font-bold text-text">Recent Trades</h3>
            {recentTrades.length === 0 ? (
              <div className="text-center py-6 text-muted text-sm">
                No trades yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-muted text-xs uppercase tracking-wider">
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Price (USDC)</th>
                      <th className="pb-3 font-medium">Token Amount</th>
                      <th className="pb-3 font-medium">Total (USDC)</th>
                      <th className="pb-3 font-medium">Time</th>
                      <th className="pb-3 font-medium text-right">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {recentTrades.map((trade, idx) => (
                      <tr key={idx} className="text-sm hover:bg-card/40 transition-colors">
                        <td className="py-3">
                          <span className={trade.tradeType === 'buy' ? 'text-[#10B981] font-bold uppercase' : 'text-[#EF4444] font-bold uppercase'}>
                            {trade.tradeType}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-text">
                          <span className="select-all cursor-help" title={`$${trade.spotPrice.toFixed(18).replace(/0+$/, '').replace(/\.$/, '')}`}>
                            ${renderMicroPrice(trade.spotPrice)}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-text">
                          {formatCompactBalance(trade.tokenAmount)} {trade.tokenSymbol}
                        </td>
                        <td className="py-3 font-mono text-text">
                          ${parseFloat(trade.usdcAmount).toFixed(2)}
                        </td>
                        <td className="py-3 text-muted text-xs">
                          {formatTimeAgo(trade.timestamp)}
                        </td>
                        <td className="py-3 text-right">
                          <a 
                            href={`https://testnet.arcscan.app/tx/${trade.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[#3B82F6] hover:text-[#60A5FA] font-mono text-xs hover:underline"
                          >
                            {shortenTxHash(trade.txHash)}
                            <ExternalLink size={12} className="ml-1 shrink-0" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Trading Terminal (Buy/Sell) & About Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glassmorphism p-6 rounded-2xl border border-border shadow-md">
            
            {marketAddress === EMPTY_ADDRESS ? (
              <div className="text-center p-6 text-muted">
                Market unavailable
              </div>
            ) : (
              <>
                <div className="flex bg-cardLight p-1 rounded-xl mb-6">
                  <button 
                    onClick={() => setTradeMode('buy')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${tradeMode === 'buy' ? 'bg-[#10B981] text-white shadow-md' : 'text-muted hover:text-text'}`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setTradeMode('sell')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${tradeMode === 'sell' ? 'bg-[#EF4444] text-white shadow-md' : 'text-muted hover:text-text'}`}
                  >
                    Sell
                  </button>
                </div>

                <div className="flex justify-center">
                  {tradeMode === 'buy' ? (
                    <BuyPanel 
                      marketAddress={marketAddress}
                      tokenAddress={tokenAddress}
                      usdcAddress={ARC_NATIVE_USDC}
                      userAddress={userAddress ?? null}
                      reserveUSDC={reserveUSDC ?? 0n}
                      reserveToken={reserveToken ?? 0n}
                      usdcBalance={usdcBalance ?? 0n}
                      onSuccess={handleRefetch}
                      tokenSymbol={tokenSymbol}
                      tokenLogo={asset.logo || '🚀'}
                    />
                  ) : (
                    <SellPanel 
                      marketAddress={marketAddress}
                      tokenAddress={tokenAddress}
                      userAddress={userAddress ?? null}
                      reserveUSDC={reserveUSDC ?? 0n}
                      reserveToken={reserveToken ?? 0n}
                      tokenBalance={tokenBalance ?? 0n}
                      onSuccess={handleRefetch}
                      tokenSymbol={tokenSymbol}
                      tokenLogo={asset.logo || '🚀'}
                    />
                  )}
                </div>
              </>
            )}

          </div>

          {/* About Section */}
          <div className="glassmorphism-light p-6 rounded-xl border border-border/50">
            <h3 className="text-lg font-bold text-text mb-3">About {tokenName}</h3>
            <p className="text-muted leading-relaxed mb-6">{asset.description}</p>
            
            <h4 className="text-md font-bold text-text mb-4">Token Details (On-Chain)</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-cardLight p-3 rounded-lg border border-border/80">
                <p className="text-xs text-muted mb-1">Total Supply</p>
                <p className="font-mono text-text">{totalSupply}</p>
              </div>
              <div className="bg-cardLight p-3 rounded-lg border border-border/80">
                <p className="text-xs text-muted mb-1">Creation Time</p>
                <p className="text-text">{new Date(asset.launchDate).toLocaleString()}</p>
              </div>
              <div className="bg-cardLight p-3 rounded-lg border border-border/80">
                <p className="text-xs text-muted mb-1">Creator Name</p>
                <p className="text-text">{creatorDisplayName}</p>
              </div>
              <div className="bg-cardLight p-3 rounded-lg border border-border/80 overflow-hidden">
                <p className="text-xs text-muted mb-1">Creator Wallet</p>
                <p className="font-mono text-text text-xs truncate" title={asset.creatorHandle}>{asset.creatorHandle}</p>
              </div>
            </div>

            <h4 className="text-md font-bold text-text mt-6 mb-4">ArcScan Explorer</h4>
            <div className="space-y-2">
              <a 
                href={`https://testnet.arcscan.app/token/${asset.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-sidebar border border-border/80 rounded-lg hover:border-accent transition-colors group"
              >
                <span className="text-muted group-hover:text-text transition-colors">View Contract</span>
                <ExternalLink size={16} className="text-[#06B6D4]" />
              </a>
              {asset.creatorHandle && asset.creatorHandle.startsWith('0x') && (
                <a 
                  href={`https://testnet.arcscan.app/address/${asset.creatorHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-sidebar border border-border/80 rounded-lg hover:border-accent transition-colors group"
                >
                  <span className="text-muted group-hover:text-text transition-colors">View Creator Wallet</span>
                  <ExternalLink size={16} className="text-[#06B6D4]" />
                </a>
              )}
              {asset.txHash && (
                <a 
                  href={`https://testnet.arcscan.app/tx/${asset.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-sidebar border border-border/80 rounded-lg hover:border-accent transition-colors group"
                >
                  <span className="text-muted group-hover:text-text transition-colors">View Deployment Transaction</span>
                  <ExternalLink size={16} className="text-[#06B6D4]" />
                </a>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
