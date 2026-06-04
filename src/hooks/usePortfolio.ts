import { useState, useEffect, useMemo, useRef } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { erc20Abi, parseAbi, formatUnits } from 'viem';
import { useAppContext } from '../context/AppContext';
import { indexerApi, type TradeEvent } from '../utils/indexerApi';
import { calculateSpotPrice, TOKEN_DECIMALS } from '../trading';
import { type MemeAsset } from '../types';

export interface PortfolioHolding {
  asset: MemeAsset;
  balance: bigint;
  spotPrice: number;
  currentValueUSDC: number;
  costBasisUSDC: number;
  unrealizedPnL: number;
  pnlPercentage: number;
}

export function usePortfolio(targetAddress?: string) {
  const { address: connectedAddress } = useAccount();
  const address = targetAddress || connectedAddress;
  const { assets } = useAppContext();

  const [recentTrades, setRecentTrades] = useState<TradeEvent[]>([]);
  const [activeAssets, setActiveAssets] = useState<MemeAsset[]>([]);
  const [costBases, setCostBases] = useState<Record<string, number>>({});
  const [isLoadingIndexer, setIsLoadingIndexer] = useState(true);
  const hasLoadedRef = useRef(false);
  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  // Stable key: only re-run when the set of market addresses actually changes
  const assetsKey = useMemo(() => {
    return assets.map(a => a.marketAddress || a.contractAddress).sort().join(',');
  }, [assets]);

  // 1. Fetch User Trades & Cost Bases from Indexer (runs once per address/asset-set change)
  useEffect(() => {
    let isMounted = true;
    
    async function loadIndexerData() {
      const currentAssets = assetsRef.current;
      if (!address || currentAssets.length === 0) {
        if (isMounted) setIsLoadingIndexer(false);
        return;
      }

      // Only show loading spinner on the first load, not on subsequent syncs
      if (!hasLoadedRef.current) {
        setIsLoadingIndexer(true);
      }

      try {
        const registryMarkets = currentAssets.map(a => a.marketAddress).filter(Boolean) as string[];
        const trades = await indexerApi.getUserTrades(address, registryMarkets);
        
        if (!isMounted) return;
        setRecentTrades(trades);

        // Find unique tokens the user has traded or created
        const activeMarketAddresses = new Set(trades.map(t => t.marketAddress?.toLowerCase()).filter(Boolean));
        
        // Also add tokens created by the user
        currentAssets.forEach(a => {
          if (a.creatorHandle?.toLowerCase() === address.toLowerCase()) {
            if (a.marketAddress) activeMarketAddresses.add(a.marketAddress.toLowerCase());
          }
        });

        const activeList = currentAssets.filter(a => a.marketAddress && activeMarketAddresses.has(a.marketAddress.toLowerCase()));
        if (isMounted) setActiveAssets(activeList);

        // Fetch cost bases
        const bases: Record<string, number> = {};
        for (const asset of activeList) {
          if (asset.marketAddress) {
            bases[asset.marketAddress] = await indexerApi.getUserCostBasis(address, asset.marketAddress);
          }
        }
        if (isMounted) setCostBases(bases);

      } catch (err) {
        console.error("Failed to load indexer data", err);
      } finally {
        if (isMounted) {
          setIsLoadingIndexer(false);
          hasLoadedRef.current = true;
        }
      }
    }

    loadIndexerData();
    return () => { isMounted = false; };
  }, [address, assetsKey]);

  // 2. Multicall Balances and Reserves for Active Assets
  const marketAbi = parseAbi(["function reserveUSDC() view returns (uint256)", "function reserveToken() view returns (uint256)"]);
  
  const multicallContracts = useMemo(() => {
    if (activeAssets.length === 0 || !address) return [];
    
    const calls = [];
    for (const asset of activeAssets) {
      // 1. balanceOf
      calls.push({
        address: asset.contractAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      });
      // 2. reserveUSDC
      calls.push({
        address: asset.marketAddress as `0x${string}`,
        abi: marketAbi,
        functionName: 'reserveUSDC'
      });
      // 3. reserveToken
      calls.push({
        address: asset.marketAddress as `0x${string}`,
        abi: marketAbi,
        functionName: 'reserveToken'
      });
    }
    return calls;
  }, [activeAssets, address]);

  const { data: multicallData, isLoading: isLoadingMulticall, refetch } = useReadContracts({
    contracts: multicallContracts as any,
    query: {
      enabled: multicallContracts.length > 0,
      refetchInterval: 10000, // Refresh every 10s
    }
  });

  // 3. Process Multicall Data into PortfolioHoldings
  const holdings = useMemo(() => {
    if (!multicallData || activeAssets.length === 0) return [];

    const result: PortfolioHolding[] = [];
    let i = 0;
    
    for (const asset of activeAssets) {
      const balanceRes = multicallData[i++];
      const reserveUsdcRes = multicallData[i++];
      const reserveTokenRes = multicallData[i++];

      const balance = balanceRes?.result as bigint | undefined ?? 0n;
      const reserveUSDC = reserveUsdcRes?.result as bigint | undefined ?? 0n;
      const reserveToken = reserveTokenRes?.result as bigint | undefined ?? 0n;

      if (balance > 0n) {
        const spotPrice = calculateSpotPrice(reserveUSDC, reserveToken);
        const floatBalance = Number(formatUnits(balance, Number(TOKEN_DECIMALS)));
        const currentValueUSDC = floatBalance * spotPrice;
        
        const cb = costBases[asset.marketAddress || ''] || 0;
        const unrealizedPnL = currentValueUSDC - cb;
        const pnlPercentage = cb > 0 ? (unrealizedPnL / cb) * 100 : 0;

        result.push({
          asset,
          balance,
          spotPrice,
          currentValueUSDC,
          costBasisUSDC: cb,
          unrealizedPnL,
          pnlPercentage
        });
      }
    }

    return result.sort((a, b) => b.currentValueUSDC - a.currentValueUSDC);
  }, [activeAssets, multicallData, costBases]);

  // 4. Calculate Aggregate Metrics
  const metrics = useMemo(() => {
    let totalValue = 0;
    let totalInvested = 0;

    for (const h of holdings) {
      totalValue += h.currentValueUSDC;
      totalInvested += h.costBasisUSDC;
    }

    const totalPnL = totalValue - totalInvested;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercentage
    };
  }, [holdings]);

  // 5. Snapshot Logging Effect
  useEffect(() => {
    if (address && metrics.totalValue > 0) {
      // We wait slightly to prevent spamming snapshots on brief intermediate renders
      const timeout = setTimeout(() => {
        indexerApi.recordPortfolioSnapshot(address, metrics.totalValue);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [address, metrics.totalValue]);

  return {
    isLoading: isLoadingIndexer || isLoadingMulticall,
    holdings,
    metrics,
    recentTrades,
    refetch
  };
}
