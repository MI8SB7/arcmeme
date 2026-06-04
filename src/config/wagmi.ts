import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { QueryClient } from '@tanstack/react-query';

/**
 * Arc Testnet chain definition
 * Source: https://docs.arc.io/arc-chain
 *
 * Key: USDC is the native gas token on Arc (not ETH).
 * Native currency uses 6 decimals.
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});

/**
 * Wagmi + RainbowKit configuration
 * The projectId comes from WalletConnect / Reown Cloud.
 */
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const wagmiConfig = getDefaultConfig({
  appName: 'ArcMeme',
  projectId,
  chains: [arcTestnet],
  ssr: false,
});

export const queryClient = new QueryClient();
