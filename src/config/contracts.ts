import { parseAbi } from 'viem';

// This will be updated with the real Arc Testnet factory address once deployed
export const ARC_MEME_FACTORY_ADDRESS =
  '0x035b5443F9b4D8994F8D83F32968D1694db269A8' as const;
// The ABI for the ArcMemeFactory contract
export const ARC_MEME_FACTORY_ABI = parseAbi([
  'function createToken(string name, string symbol, uint256 usdcSeed) external returns (address)',
  'event TokenCreated(address indexed token, address indexed market, address indexed creator, string name, string symbol, uint256 usdcSeed)',
  'function getAllTokens() external view returns (address[])',
  'function getTokensCount() external view returns (uint256)',
  'function tokenToMarket(address token) external view returns (address)'
]);

export const ARC_NATIVE_USDC = '0x3600000000000000000000000000000000000000' as const;
