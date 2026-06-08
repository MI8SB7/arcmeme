import type { MemeAsset } from '../types';
import type { UserProfile } from '../context/AppContext';

type CreatorLike = {
  username?: string | null;
  displayName?: string | null;
  name?: string | null;
};

export type RankedTrendingAsset = {
  asset: MemeAsset;
  score: number;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const hasUsableName = (value: string | null | undefined) => {
  if (!value) return false;
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();
  return trimmed.length > 0
    && normalized !== 'unknown'
    && !normalized.startsWith('0x')
    && !/^0x[a-f0-9]{4}\.\.\.[a-f0-9]{4}$/i.test(trimmed);
};

export const formatWalletFallback = (walletAddress: string | undefined) => {
  if (!walletAddress || !walletAddress.startsWith('0x')) return 'Unknown creator';
  if (walletAddress.toLowerCase() === ZERO_ADDRESS) return 'Unknown creator';
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
};

export const getCreatorDisplayName = (
  asset: MemeAsset,
  profiles: Record<string, UserProfile> = {},
) => {
  const creator = (asset as MemeAsset & { creator?: CreatorLike }).creator;
  const profileKey = asset.creatorHandle ? asset.creatorHandle.toLowerCase() : '';
  const profile = profileKey ? profiles[profileKey] : undefined;
  
  // Priority: profile.displayName (from profiles table: display_name -> username) -> fallback creator fields
  const candidates = [
    profile?.displayName,
    creator?.displayName,
    creator?.name,
    creator?.username,
    asset.creatorName,
  ];

  const name = candidates.find(hasUsableName);
  const finalName = name ?? formatWalletFallback(asset.creatorHandle);

  // DEBUG LOGS AS REQUESTED
  if (asset.creatorHandle && asset.creatorHandle.toLowerCase() !== '0xa3ca9cc33764f8b061b79b9a8a0a00663ea9b181') {
    console.log("=== NEW TOKEN PROFILE DEBUG ===");
    console.log("Creator Wallet:", asset.creatorHandle);
    console.log("CreatorName stored on token:", asset.creatorName);
    console.log("Profile username (from profile dict):", profile?.walletAddress); // wallet address is only id we have in UserProfile
    console.log("Profile display_name:", profile?.displayName);
    console.log("Final rendered creator name:", finalName);
  }

  return finalName;
};

export const getRankedTrendingAssets = (assets: MemeAsset[]): RankedTrendingAsset[] => {
  return [...assets]
    .map((asset) => {
      const volume = asset.volume24h ?? 0;
      const trades = asset.tradeCount ?? 0;
      const holders = asset.holderCount ?? 0;
      const score = volume * 0.5 + trades * 0.3 + holders * 0.2;

      return { asset, score };
    })
    .sort((a, b) => b.score - a.score);
};
