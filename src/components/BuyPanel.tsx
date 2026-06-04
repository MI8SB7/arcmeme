import React, { useState, useMemo, useEffect } from 'react';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { parseAbi, formatUnits, parseUnits } from 'viem';
import { ArrowDown, AlertCircle, Info, CheckCircle2, ExternalLink } from 'lucide-react';
import {
  calculateBuyOutput,
  calculateSpotPrice,
  calculatePriceImpact,
  applySlippage,
  formatCompactBalance,
  USDC_DECIMALS,
  TOKEN_DECIMALS,
  calculateMarketCap
} from '../trading';
import { indexerApi } from '../utils/indexerApi';
import usdcLogo from '../assets/usdc.png';

const MARKET_ABI = parseAbi([
  "function reserveUSDC() view returns (uint256)",
  "function reserveToken() view returns (uint256)",
  "function buy(uint256 usdcAmount, uint256 minTokensOut) external"
]);

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)"
]);

const UsdcLogo: React.FC = () => (
  <img src={usdcLogo} alt="USDC" className="w-6 h-6 rounded-full shrink-0" />
);

interface TokenLogoProps {
  logo: string;
  symbol: string;
}

const TokenLogo: React.FC<TokenLogoProps> = ({ logo, symbol }) => {
  if (typeof logo === 'string' && logo.startsWith('data:image')) {
    return <img src={logo} alt={symbol} className="w-6 h-6 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-6 h-6 rounded-full bg-cardLight border border-border flex items-center justify-center text-xs shrink-0 select-none text-muted">
      {logo || '🚀'}
    </div>
  );
};

interface BuyPanelProps {
  marketAddress: string;
  tokenAddress: string;
  usdcAddress: string;
  userAddress: string | null;
  reserveUSDC: bigint;
  reserveToken: bigint;
  usdcBalance: bigint;
  onSuccess: () => void;
  tokenSymbol: string;
  tokenLogo: string;
}

export const BuyPanel: React.FC<BuyPanelProps> = ({ 
  marketAddress, 
  tokenAddress,
  usdcAddress, 
  userAddress,
  reserveUSDC,
  reserveToken,
  usdcBalance,
  onSuccess,
  tokenSymbol,
  tokenLogo
}) => {
  const [usdcInput, setUsdcInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const SLIPPAGE_BPS = 100; // 1%

  // AMM Math
  const parsedInputUsdc = useMemo(() => {
    try {
      return usdcInput ? parseUnits(usdcInput, Number(USDC_DECIMALS)) : 0n;
    } catch {
      return 0n;
    }
  }, [usdcInput]);

  const tokensOut = useMemo(() => {
    return calculateBuyOutput(parsedInputUsdc, reserveUSDC, reserveToken);
  }, [parsedInputUsdc, reserveUSDC, reserveToken]);

  const minTokensOut = useMemo(() => {
    return applySlippage(tokensOut, SLIPPAGE_BPS);
  }, [tokensOut]);

  // const spotPrice = useMemo(() => {
  //   return calculateSpotPrice(reserveUSDC, reserveToken);
  // }, [reserveUSDC, reserveToken]);

  const priceImpact = useMemo(() => {
    return calculatePriceImpact(parsedInputUsdc, tokensOut, reserveUSDC, reserveToken);
  }, [parsedInputUsdc, tokensOut, reserveUSDC, reserveToken]);

  // Read Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress as `0x${string}`,
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
    if (usdcBalance > 0n) {
      setUsdcInput(formatUnits(usdcBalance, Number(USDC_DECIMALS)));
    }
  };

  console.log("=== CURRENT_RENDER_STATE BuyPanel ===");
  console.log("isTrading:", isTrading);
  console.log("isApproving:", isApproving);
  console.log("successData:", successData);
  console.log("error:", error);
  console.log("=====================================");

  const handleBuy = async () => {
    console.log("=== BUY TRANSACTION INVESTIGATION ===");
    console.log("1. marketAddress:", marketAddress);
    console.log("2. reserveUSDC (raw):", reserveUSDC.toString());
    console.log("3. reserveToken (raw):", reserveToken.toString());
    console.log("4. current allowance (raw):", allowance?.toString());
    console.log("5. usdcBalance (raw):", usdcBalance.toString());
    console.log("6. amountIn / parsedInputUsdc (raw):", parsedInputUsdc.toString(), `(${formatUnits(parsedInputUsdc, Number(USDC_DECIMALS))} USDC)`);
    console.log("7. minTokensOut (raw):", minTokensOut.toString(), `(${formatUnits(minTokensOut, Number(TOKEN_DECIMALS))} ${tokenSymbol})`);
    console.log("=====================================");

    if (!userAddress) return setError("Wallet not connected");
    if (parsedInputUsdc === 0n) return setError("Enter a valid amount");
    if (parsedInputUsdc > usdcBalance) return setError("Insufficient USDC balance");
    
    setError(null);
    try {
      const currentAllowance = allowance || 0n;
      console.log("TX_START: Checking allowance...");
      
      // Step 1: Approve
      if (currentAllowance < parsedInputUsdc) {
        console.log("TX_APPROVE_1: Triggering approve()...");
        setIsApproving(true);
        const hash = await writeContractAsync({
          address: usdcAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [marketAddress as `0x${string}`, parsedInputUsdc]
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

      // Step 2: Buy
      console.log("TX_BUY_1: Triggering buy()...");
      setIsTrading(true);
      const hash = await writeContractAsync({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: 'buy',
        args: [parsedInputUsdc, minTokensOut]
      });
      console.log("TX_BUY_2: Hash received:", hash);
      
      if (publicClient) {
        console.log("TX_BUY_3: Waiting for receipt...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("TX_BUY_4: Receipt received:", receipt);
        console.log("TX_BUY_5: Receipt status:", receipt.status);
      }

      console.log("C = addTradeEvent start");
      const newReserveUSDC = reserveUSDC + parsedInputUsdc;
      const newReserveToken = reserveToken - tokensOut;
      const newSpotPrice = calculateSpotPrice(newReserveUSDC, newReserveToken);
      const newMarketCap = calculateMarketCap(newSpotPrice);
      const newLiquidity = Number(newReserveUSDC) / 1e6 * 2;

      await indexerApi.addTradeEvent({
        marketAddress,
        tokenAddress,
        tokenSymbol,
        traderAddress: userAddress ?? '0x0',
        tradeType: 'buy',
        usdcAmount: formatUnits(parsedInputUsdc, Number(USDC_DECIMALS)),
        tokenAmount: formatUnits(tokensOut, Number(TOKEN_DECIMALS)),
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

      console.log("TX_BUY_6: Entering success flow.");

      try {
        console.log("D = before success state");
        
        const amInStr = formatUnits(parsedInputUsdc, Number(USDC_DECIMALS));
        const amOutStr = formatUnits(tokensOut, Number(TOKEN_DECIMALS));
        
        console.log("=== SUCCESS STATE DATA ===");
        console.log("tokenSymbol:", tokenSymbol);
        console.log("marketAddress:", marketAddress);
        console.log("txHash:", hash);
        console.log("usdcAmount (raw formatUnits):", amInStr);
        console.log("tokenAmount (raw formatUnits):", amOutStr);
        console.log("==========================");

        setUsdcInput('');
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
      console.error("-> BUY TRANSACTION FAILED:", err);
      if (err.cause) console.error("Cause:", err.cause);
      if (err.details) console.error("Details:", err.details);
      
      const revertReason = err.shortMessage || (err.cause?.reason) || err.message || "Transaction failed";
      console.error("Extracted Revert Reason:", revertReason);
      
      setError(revertReason);
    } finally {
      setIsApproving(false);
      setIsTrading(false);
    }
  };

  const isInsufficientBalance = parsedInputUsdc > usdcBalance;
  const isInputZero = parsedInputUsdc === 0n;
  const isPending = isApproving || isTrading;
  
  let buttonText = "Place Buy Order";
  if (isInputZero) buttonText = "Enter an amount";
  else if (isInsufficientBalance) buttonText = "Insufficient balance";
  else if (isApproving) buttonText = "Approving USDC...";
  else if (isTrading) buttonText = "Buying...";

  if (successData) {
    return (
      <div className="w-full text-center p-6 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl animate-fadeIn">
        <CheckCircle2 size={48} className="text-[#10B981] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text mb-6">Buy Successful</h3>
        
        <div className="bg-cardLight rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">You purchased</span>
            <span className="text-[#10B981] font-bold">{successData.amountOut} {tokenSymbol}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Spent</span>
            <span className="text-text font-bold">{successData.amountIn} USDC</span>
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
      <div className="bg-cardLight border border-border p-4 rounded-2xl mb-1 transition-colors focus-within:border-[#10B981]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted">You Pay</span>
          <div className="text-xs text-muted flex items-center space-x-2">
            <span>Balance: {formatCompactBalance(formatUnits(usdcBalance, Number(USDC_DECIMALS)))} USDC</span>
            <button 
              onClick={handleMax}
              className="text-[#10B981] hover:text-[#059669] font-bold px-1.5 py-0.5 rounded bg-[#10B981]/10 transition-colors"
            >
              MAX
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <input 
            type="number"
            value={usdcInput}
            onChange={(e) => setUsdcInput(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-3xl outline-none w-full font-bold text-text placeholder-muted/35"
          />
          <div className="flex items-center space-x-2 bg-border/50 px-3 py-1.5 rounded-xl ml-2 shrink-0">
            <UsdcLogo />
            <span className="font-bold text-text">USDC</span>
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
            {usdcInput ? formatCompactBalance(formatUnits(tokensOut, Number(TOKEN_DECIMALS))) : '0.00'}
          </div>
          <div className="flex items-center space-x-2 bg-border/50 px-3 py-1.5 rounded-xl ml-2 shrink-0">
            <TokenLogo logo={tokenLogo} symbol={tokenSymbol} />
            <span className="font-bold text-text">{tokenSymbol}</span>
          </div>
        </div>
      </div>

      {/* Details Footer */}
      {parsedInputUsdc > 0n && (
        <div className="space-y-3 mb-6 px-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted flex items-center"><Info size={14} className="mr-1.5" /> Price Impact</span>
            <span className={priceImpact > 2 ? 'text-red-400 font-medium' : 'text-[#10B981] font-medium'}>
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
        onClick={handleBuy}
        disabled={isPending || isInputZero || isInsufficientBalance}
        className={`w-full py-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg ${
          isPending || isInputZero || isInsufficientBalance
            ? 'bg-border text-muted cursor-not-allowed border border-border/80'
            : 'hover:scale-[1.02] text-white bg-gradient-to-r from-[#10B981] to-[#059669] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
};
