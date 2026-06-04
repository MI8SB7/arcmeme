export interface MemeAsset {
  id: string;
  name: string;
  symbol: string;
  contractAddress: string;
  marketAddress?: string;
  logo: string;
  category: 'AI' | 'Galactic' | 'Community' | 'DeFi' | 'Gaming';
  verificationStatus: 'New' | 'Trending' | 'Verified' | 'None';
  description: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar: string;
  likes: number;
  views: number;
  rank: number;
  hotness: number; // 0 to 100
  followers: number;
  launchDate: string;
  txHash?: string;
  price?: number;
  marketCap?: number;
  liquidity?: number;
  volume24h?: number;
  holderCount?: number;
  priceChangePercent?: number;
  tradeCount?: number;
}

export interface Creator {
  rank: number;
  name: string;
  handle: string;
  avatar: string;
  totalAssets: number;
  popularityScore: number;
  followers: number;
  featuredAsset: string;
}

export interface ActivityEvent {
  id: string;
  tokenName: string;
  creatorName: string;
  contractAddress: string;
  timestamp: number;
}
