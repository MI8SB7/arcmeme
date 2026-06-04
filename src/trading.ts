// d:\arcmeme\src\trading.ts

export const TOKEN_DECIMALS = 18n;
export const USDC_DECIMALS = 6n;
export const TOTAL_SUPPLY = 1_000_000_000n; // 1 Billion

/**
 * Calculates the exact token amount received for a given USDC input.
 * Matches Contract Math: (ReserveToken * USDCIn) / (ReserveUSDC + USDCIn)
 */
export function calculateBuyOutput(
  usdcAmount: bigint,
  reserveUSDC: bigint,
  reserveToken: bigint
): bigint {
  if (reserveUSDC === 0n || reserveToken === 0n || usdcAmount === 0n) return 0n;
  return (reserveToken * usdcAmount) / (reserveUSDC + usdcAmount);
}

/**
 * Calculates the exact USDC amount received for a given Token input.
 * Matches Contract Math: (ReserveUSDC * TokenIn) / (ReserveToken + TokenIn)
 */
export function calculateSellOutput(
  tokenAmount: bigint,
  reserveUSDC: bigint,
  reserveToken: bigint
): bigint {
  if (reserveUSDC === 0n || reserveToken === 0n || tokenAmount === 0n) return 0n;
  return (reserveUSDC * tokenAmount) / (reserveToken + tokenAmount);
}

/**
 * Calculates the spot price of 1 full Token in terms of full USDC.
 * Uses floating point math (Number) for frontend UI rendering.
 * Formula: (reserveUSDC / 1e6) / (reserveToken / 1e18)
 */
export function calculateSpotPrice(
  reserveUSDC: bigint,
  reserveToken: bigint
): number {
  if (reserveUSDC === 0n || reserveToken === 0n) return 0;
  
  const normalizedUSDC = Number(reserveUSDC) / 10 ** Number(USDC_DECIMALS);
  const normalizedToken = Number(reserveToken) / 10 ** Number(TOKEN_DECIMALS);
  
  return normalizedUSDC / normalizedToken;
}

/**
 * Calculates the total market cap in full USDC.
 * Formula: Spot Price * 1,000,000,000
 */
export function calculateMarketCap(spotPrice: number): number {
  return spotPrice * Number(TOTAL_SUPPLY);
}

/**
 * Calculates the price impact percentage of a trade.
 * Relies on the exact reserve math without floating point precision loss prior to percentage conversion.
 */
export function calculatePriceImpact(
  inputAmount: bigint,
  outputAmount: bigint,
  reserveInput: bigint,
  reserveOutput: bigint
): number {
  if (inputAmount === 0n || outputAmount === 0n || reserveInput === 0n || reserveOutput === 0n) return 0;
  
  // Spot exchange rate expected output without impact: (inputAmount * reserveOutput) / reserveInput
  const expectedOutput = (inputAmount * reserveOutput) / reserveInput;
  
  if (expectedOutput === 0n) return 0;
  
  // Impact = (expectedOutput - outputAmount) / expectedOutput
  // Multiply by 10000 for basis points (0.01% precision)
  const impactBasisPoints = ((expectedOutput - outputAmount) * 10000n) / expectedOutput;
  
  // Return percentage (e.g., 5.5 = 5.5%)
  return Number(impactBasisPoints) / 100; 
}

/**
 * Applies the slippage tolerance to an expected output amount.
 * @param expectedOutput The exact amount out calculated from AMM math
 * @param slippageBps The slippage tolerance in basis points (Default 100 = 1%)
 * @returns The minimum acceptable output amount to send to the contract
 */
export function applySlippage(expectedOutput: bigint, slippageBps: number = 100): bigint {
  if (expectedOutput === 0n) return 0n;
  
  // Output = expectedOutput * (10000 - slippageBps) / 10000
  const multiplier = 10000n - BigInt(slippageBps);
  return (expectedOutput * multiplier) / 10000n;
}

/**
 * Formats a raw token balance into a compact UI representation (K/M/B/T).
 * Max 2 decimal places.
 */
export function formatCompactBalance(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '0.00';
  
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  
  // Floor to 2 decimals to match user's example "9.373497 -> 9.37" without round up issues if preferred,
  // but toFixed(2) is standard.
  return num.toFixed(2);
}

/**
 * Formats extremely small meme token prices without scientific notation.
 */
export function formatTokenPrice(price: number): string {
  if (price === 0) return '0.00';
  if (price >= 0.01) return price.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  
  // For extremely small numbers (e.g. 0.0000000202)
  let str = price.toFixed(12);
  
  // Trim unnecessary trailing zeros
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '');
  }
  
  return str;
}
