import React, { useState, useMemo, useEffect } from 'react';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseAbi, formatUnits, parseUnits } from 'viem';
import { ArrowDown, AlertCircle, Info, CheckCircle2, ExternalLink } from 'lucide-react';
import {
  calculateSellOutput,
  calculateSpotPrice,
  calculatePriceImpact,
  applySlippage,
  formatCompactBalance,
  USDC_DECIMALS,
  TOKEN_DECIMALS,
  calculateMarketCap
} from '../trading';
import { indexerApi } from '../utils/indexerApi';
import { TokenLogo } from './TokenLogo';
import usdcLogo from '../assets/usdc.png';

const MARKET_ABI = parseAbi([
  "function reserveUSDC() view returns (uint256)",
  "function reserveToken() view returns (uint256)",
  "function sell(uint256 tokenAmount, uint256 minUsdcOut) external"
]);

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)"
]);

const UsdcLogo: React.FC = () => (
  <img src={usdcLogo} alt="USDC" className="w-6 h-6 rounded-full shrink-0" />
);

interface SellPanelProps {
  marketAddress: string;
  tokenAddress: string;
  userAddress: string | null;
  reserveUSDC: bigint;
  reserveToken: bigint;
  tokenBalance: bigint;
  onSuccess: () => void;
  tokenSymbol: string;
  tokenLogo: string;
}

export const SellPanel: React.FC<SellPanelProps> = ({ 
  marketAddress, 
  tokenAddress, 
  userAddress,
  reserveUSDC,
  reserveToken,
  tokenBalance,
  onSuccess,
  tokenSymbol,
  tokenLogo
}) => {
  const [tokenInput, setTokenInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const SLIPPAGE_BPS = 100; // 1%

  // AMM Math
  const parsedInputToken = useMemo(() => {
    try {
      return tokenInput ? parseUnits(tokenInput, Number(TOKEN_DECIMALS)) : 0n;
    } catch {
      return 0n;
    }
  }, [tokenInput]);

  const usdcOut = useMemo(() => {
    return calculateSellOutput(parsedInputToken, reserveUSDC, reserveToken);
  }, [parsedInputToken, reserveUSDC, reserveToken]);

  const minUsdcOut = useMemo(() => {
    return applySlippage(usdcOut, SLIPPAGE_BPS);
  }, [usdcOut]);

  // const spotPrice = useMemo(() => {
  //   return calculateSpotPrice(reserveUSDC, reserveToken);
  // }, [reserveUSDC, reserveToken]);

  const priceImpact = useMemo(() => {
    return calculatePriceImpact(parsedInputToken, usdcOut, reserveToken, reserveUSDC);
  }, [parsedInputToken, usdcOut, reserveToken, reserveUSDC]);

  // Read Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress as `0x${string}`, marketAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress }
  });

  // Wagmi Write Hooks
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isTrading, setIsTrading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [successData, setSuccessData] = useState<{ amountIn: string, amountOut: string, hash: string } | null>(null);

  useEffect(() => {
    if (successData) {
      const timer = setTimeout(() => {
        setSuccessData(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successData]);

  const handleMax = () => {
    if (tokenBalance > 0n) {
      setTokenInput(formatUnits(tokenBalance, Number(TOKEN_DECIMALS)));
    }
  };

  console.log("=== CURRENT_RENDER_STATE SellPanel ===");
  console.log("isTrading:", isTrading);
  console.log("isApproving:", isApproving);
  console.log("successData:", successData);
  console.log("error:", error);
  console.log("=====================================");

  const handleSell = async () => {
    if (!userAddress) return setError("Wallet not connected");
    if (parsedInputToken === 0n) return setError("Enter a valid amount");
    if (parsedInputToken > tokenBalance) return setError("Insufficient token balance");
    
    setError(null);
    try {
      const currentAllowance = allowance || 0n;
      console.log("TX_START: Checking allowance...");
      
      // Step 1: Approve
      if (currentAllowance < parsedInputToken) {
        console.log("TX_APPROVE_1: Triggering approve()...");
        setIsApproving(true);
        const hash = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [marketAddress as `0x${string}`, parsedInputToken]
        });
        console.log("TX_APPROVE_2: Hash received:", hash);
        
        if (publicClient) {
          console.log("TX_APPROVE_3: Waiting for receipt...");
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          console.log("TX_APPROVE_4: Receipt received:", receipt);
          console.log("TX_APPROVE_5: Receipt status:", receipt.status);
        }
        await refetchAllowance();
        console.log("TX_APPROVE_6: Allowance refetched.");
        setIsApproving(false);
      } else {
        console.log("TX_APPROVE_SKIP: Allowance sufficient.");
      }

      // Step 2: Sell
      console.log("TX_SELL_1: Triggering sell()...");
      setIsTrading(true);
      const hash = await writeContractAsync({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: 'sell',
        args: [parsedInputToken, minUsdcOut]
      });
      console.log("TX_SELL_2: Hash received:", hash);
      
      if (publicClient) {
        console.log("TX_SELL_3: Waiting for receipt...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("TX_SELL_4: Receipt received:", receipt);
        console.log("TX_SELL_5: Receipt status:", receipt.status);
      }

      console.log("C = addTradeEvent start");
      const newReserveUSDC = reserveUSDC - usdcOut;
      const newReserveToken = reserveToken + parsedInputToken;
      const newSpotPrice = calculateSpotPrice(newReserveUSDC, newReserveToken);
      const newMarketCap = calculateMarketCap(newSpotPrice);
      const newLiquidity = Number(newReserveUSDC) / 1e6 * 2;

      await indexerApi.addTradeEvent({
        marketAddress,
        tokenAddress,
        tokenSymbol,
        traderAddress: userAddress ?? '0x0',
        tradeType: 'sell',
        usdcAmount: formatUnits(usdcOut, Number(USDC_DECIMALS)),
        tokenAmount: formatUnits(parsedInputToken, Number(TOKEN_DECIMALS)),
        spotPrice: newSpotPrice,
        marketCap: newMarketCap,
        liquidity: newLiquidity,
        usdcReserve: newReserveUSDC.toString(),
        tokenReserve: newReserveToken.toString(),
        timestamp: Math.floor(Date.now() / 1000),
        blockTimestamp: Math.floor(Date.now() / 1000),
        blockNumber: 0,
        txHash: hash
      });
      console.log("C = addTradeEvent complete");

      try {
        console.log("D = before success state");
        
        const amInStr = formatUnits(parsedInputToken, Number(TOKEN_DECIMALS));
        const amOutStr = formatUnits(usdcOut, Number(USDC_DECIMALS));
        
        console.log("=== SUCCESS STATE DATA ===");
        console.log("tokenSymbol:", tokenSymbol);
        console.log("marketAddress:", marketAddress);
        console.log("txHash:", hash);
        console.log("tokenAmount (raw formatUnits):", amInStr);
        console.log("usdcAmount (raw formatUnits):", amOutStr);
        console.log("==========================");

        setTokenInput('');
        setSuccessData({
          amountIn: formatCompactBalance(amInStr),
          amountOut: formatCompactBalance(amOutStr),
          hash
        });
        
        console.log("E = success state set");
        onSuccess();
      } catch (err) {
        console.error("SUCCESS FLOW CRASH:", err);
      }
      
    } catch (err: any) {
      console.error(err);
      const revertReason = err.shortMessage || (err.cause?.reason) || err.message || "Transaction failed";
      setError(revertReason);
    } finally {
      setIsApproving(false);
      setIsTrading(false);
    }
  };

  const isInsufficientBalance = parsedInputToken > tokenBalance;
  const isInputZero = parsedInputToken === 0n;
  const isPending = isApproving || isTrading;
  
  let buttonText = "Place Sell Order";
  if (isInputZero) buttonText = "Enter an amount";
  else if (isInsufficientBalance) buttonText = "Insufficient balance";
  else if (isApproving) buttonText = `Approving ${tokenSymbol}...`;
  else if (isTrading) buttonText = "Selling...";

  if (successData) {
    return (
      <div className="w-full text-center p-6 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl animate-fadeIn">
        <CheckCircle2 size={48} className="text-[#EF4444] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text mb-6">Sell Successful</h3>
        
        <div className="bg-cardLight rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">You sold</span>
            <span className="text-[#EF4444] font-bold">{successData.amountIn} {tokenSymbol}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Received</span>
            <span className="text-[#10B981] font-bold">{successData.amountOut} USDC</span>
          </div>
        </div>

        <div className="space-y-3">
          <a 
            href={`https://testnet.arcscan.app/tx/${successData.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2 py-3 bg-border/50 hover:bg-border/80 border border-border/80 rounded-xl text-text font-medium transition-colors"
          >
            <span>View Transaction</span>
            <ExternalLink size={16} />
          </a>
          <button 
            onClick={() => setSuccessData(null)}
            className="w-full py-3 text-muted hover:text-text font-medium transition-colors"
          >
            Back to Trade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* You Pay Block */}
      <div className="bg-cardLight border border-border p-4 rounded-2xl mb-1 transition-colors focus-within:border-[#EF4444]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted">You Pay</span>
          <div className="text-xs text-muted flex items-center space-x-2">
            <span>Balance: {formatCompactBalance(formatUnits(tokenBalance, Number(TOKEN_DECIMALS)))} {tokenSymbol}</span>
            <button 
              onClick={handleMax}
              className="text-[#EF4444] hover:text-[#DC2626] font-bold px-1.5 py-0.5 rounded bg-[#EF4444]/10 transition-colors"
            >
              MAX
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <input 
            type="number"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-3xl outline-none w-full font-bold text-text placeholder-muted/35"
          />
          <div className="flex items-center space-x-2 bg-border/50 px-3 py-1.5 rounded-xl ml-2 shrink-0">
            <TokenLogo logo={tokenLogo} symbol={tokenSymbol} size="w-6 h-6" />
            <span className="font-bold text-text">{tokenSymbol}</span>
          </div>
        </div>
      </div>

      {/* Swap Divider */}
      <div className="flex justify-center -my-3 relative z-10">
        <div className="bg-card border border-border/80 p-1.5 rounded-xl">
          <ArrowDown size={16} className="text-muted" />
        </div>
      </div>

      {/* You Receive Block */}
      <div className="bg-cardLight border border-border p-4 rounded-2xl mt-1 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted">You Receive</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-text overflow-hidden text-ellipsis whitespace-nowrap">
            {tokenInput ? formatCompactBalance(formatUnits(usdcOut, Number(USDC_DECIMALS))) : '0.00'}
          </div>
          <div className="flex items-center space-x-2 bg-border/50 px-3 py-1.5 rounded-xl ml-2 shrink-0">
            <UsdcLogo />
            <span className="font-bold text-text">USDC</span>
          </div>
        </div>
      </div>

      {/* Details Footer */}
      {parsedInputToken > 0n && (
        <div className="space-y-3 mb-6 px-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted flex items-center"><Info size={14} className="mr-1.5" /> Price Impact</span>
            <span className={priceImpact > 2 ? 'text-red-400 font-medium' : 'text-[#EF4444] font-medium'}>
              {priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Slippage Tolerance</span>
            <span className="text-text">1.0%</span>
          </div>
        </div>
      )}

      {/* Errors */}
      {error && (
        <div className="flex items-center text-red-400 bg-red-400/10 p-3 rounded-xl text-sm mb-4">
          <AlertCircle size={16} className="mr-2 shrink-0" /> 
          <span className="break-words">{error}</span>
        </div>
      )}

      {/* CTA Button */}
      <button 
        onClick={handleSell}
        disabled={isPending || isInputZero || isInsufficientBalance}
        className={`w-full py-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg ${
          isPending || isInputZero || isInsufficientBalance
            ? 'bg-border text-muted cursor-not-allowed border border-border/80'
            : 'hover:scale-[1.02] text-white bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]'
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
};
