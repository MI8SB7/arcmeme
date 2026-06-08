import { supabase } from '../lib/supabase';
import type { MemeAsset } from '../types';

/** Fetch active tokens from Supabase and map to MemeAsset shape */
export const getAllTokens = async (): Promise<MemeAsset[]> => {
  const { data, error } = await supabase.from('tokens').select('*');
  if (error) {
    console.error('Token load failed', error);
    return [];
  }
  // Only return tokens that are active (default true).
  const rows = (data as any[]).filter(row => row.is_active !== false);
  return rows.map(row => {
    const asset = {
      id: row.id ?? Math.random().toString(36).substr(2, 9),
      name: row.name ?? '',
      symbol: row.symbol ?? '',
      contractAddress: row.contract_address ?? '',
      marketAddress: row.market_address ?? '',
      logo: row.logo_url ?? '',
      category: row.category ?? 'Community',
      verificationStatus: row.verification_status ?? 'New',
      description: row.description ?? '',
      creatorName: row.creator_name ?? '',
      creatorHandle: row.creator_wallet ?? '',
      creatorAvatar: row.creator_avatar ?? '',
      likes: row.likes ?? 0,
      views: row.views ?? 0,
      rank: row.rank ?? 0,
      hotness: row.hotness ?? 0,
      followers: row.followers ?? 0,
      launchDate: row.created_at ?? new Date().toISOString(),
      txHash: row.tx_hash ?? '',
      // Add dynamic stats with safe defaults
      marketCap: row.market_cap ?? 0,
      liquidity: row.liquidity ?? 0,
      holderCount: row.holders ?? 0,
      volume24h: row.volume_24h ?? 0,
    } as MemeAsset;
    
    return asset;
  });
};

/** Update token dynamic stats (price, marketCap, liquidity, holderCount, volume24h) */
export const updateTokenStats = async (
  contractAddress: string,
  marketCap: number,
  liquidity: number,
  holderCount: number,
  volume24h: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tokens')
      .update({
        market_cap: marketCap,
        liquidity: liquidity,
        holders: holderCount,
        volume_24h: volume24h,
      })
      .eq('contract_address', contractAddress);
    if (error) {
      console.error('Failed to update token stats', error);
    } else {
      console.log('Token stats updated for', contractAddress);
    }
  } catch (e) {
    console.error('Exception updating token stats', e);
  }
}

/** Insert a token if it does not already exist (by contract_address) */
export const insertToken = async (token: MemeAsset): Promise<void> => {
  try {
    // Log token before saving
    console.log('Saving token to Supabase', token);
    const { data: existing, error: selectError } = await supabase
      .from('tokens')
      .select('id')
      .eq('contract_address', token.contractAddress)
      .maybeSingle();
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Token existence check error', selectError);
      return;
    }
    if (existing) {
      console.log('Token already exists');
      return;
    }
    const dbToken = {
      contract_address: token.contractAddress,
      creator_wallet: token.creatorHandle,
      creator_name: token.creatorName,
      creator_avatar: token.creatorAvatar,
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      logo_url: token.logo,
      // Dynamic stats
      market_cap: token.marketCap,
      liquidity: token.liquidity,
      holders: token.holderCount,
      volume_24h: token.volume24h,
      is_active: true,
    };
    const { error: insertError } = await supabase.from('tokens').insert([dbToken]);
    if (insertError) {
      console.error('Token save failed', insertError);
    } else {
      console.log('Token saved to Supabase');
    }
  } catch (e) {
    console.error('Token save failed', e);
  }
};

/** Soft‑delete (deactivate) a token. Only the creator can deactivate their token.
 *  Returns true if deactivated, false otherwise.
 */
export const deactivateToken = async (
  contractAddress: string,
  requesterWallet: string
): Promise<boolean> => {
  try {
    // Verify token exists and requester is creator
    const { data: token, error: fetchError } = await supabase
      .from('tokens')
      .select('creator_wallet, is_active')
      .eq('contract_address', contractAddress)
      .single();
    if (fetchError) {
      console.error('Token fetch error', fetchError);
      return false;
    }
    if (token.creator_wallet !== requesterWallet) {
      console.warn('Only token creator can deactivate');
      return false;
    }
    // Update is_active flag
    const { error: updateError } = await supabase
      .from('tokens')
      .update({ is_active: false })
      .eq('contract_address', contractAddress);
    if (updateError) {
      console.error('Token deactivate error', updateError);
      return false;
    }
    console.log('Token deactivated');
    return true;
  } catch (e) {
    console.error('Token deactivate exception', e);
    return false;
  }
};
