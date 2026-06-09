import { supabase } from '../lib/supabase';
import type { MemeAsset } from '../types';

const mapRowToAsset = (row: any): MemeAsset => {
  return {
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
    marketCap: row.market_cap ?? 0,
    liquidity: row.liquidity ?? 0,
    holderCount: row.holders ?? 0,
    volume24h: row.volume_24h ?? 0,
  } as MemeAsset;
};

/** Fetch active tokens from Supabase and map to MemeAsset shape */
export const getAllTokens = async (): Promise<MemeAsset[]> => {
  const { data, error } = await supabase.from('tokens').select('*');
  if (error) {
    console.error('Token load failed', error);
    return [];
  }
  // Only return tokens that are active (default true).
  const rows = (data as any[]).filter(row => row.is_active !== false);
  
  // Debug log for logo_url lengths
  console.log("=== TOKEN IMAGE LENGTH DEBUG (INITIAL FETCH) ===");
  rows.forEach(row => {
    console.log(`Token ${row.symbol} fetchedToken.logo_url?.length:`, row.logo_url?.length || 0);
  });
  
  return rows.map(mapRowToAsset);
};

/** Subscribe to new tokens inserted into Supabase for realtime UI updates */
export const subscribeToNewTokens = (callback: (asset: MemeAsset) => void) => {
  const channel = supabase
    .channel('public:tokens')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'tokens' },
      (payload) => {
        if (payload.new && payload.new.is_active !== false) {
          console.log("=== TOKEN IMAGE LENGTH DEBUG (REALTIME) ===");
          console.log(`Token ${payload.new.symbol} payload.new.logo_url?.length:`, payload.new.logo_url?.length || 0);
          callback(mapRowToAsset(payload.new));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/** Convert a Base64 Data URI to a Blob */
const base64ToBlob = (base64URI: string): Blob => {
  const [header, data] = base64URI.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
  const binaryString = atob(data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};

/** Uploads a base64 image to Supabase Storage and returns the public URL */
export const uploadTokenImage = async (base64Data: string, tokenId: string): Promise<string> => {
  try {
    const blob = base64ToBlob(base64Data);
    const fileName = `${tokenId}-${Date.now()}.webp`;
    
    const { error: uploadError } = await supabase.storage
      .from('token-images')
      .upload(fileName, blob, {
        contentType: 'image/webp',
        upsert: false
      });
      
    if (uploadError) {
      console.log('UPLOAD RESULT: Failed', uploadError);
      return ''; // Return empty string to gracefully fall back
    }
    
    const { data: urlData } = supabase.storage
      .from('token-images')
      .getPublicUrl(fileName);
      
    console.log('PUBLIC URL', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.log('UPLOAD RESULT: Exception', error);
    return '';
  }
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
    
    // Process base64 logo if present
    let finalLogoUrl = token.logo;
    if (finalLogoUrl && finalLogoUrl.startsWith('data:image/')) {
      console.log("BASE64 LENGTH", finalLogoUrl.length);
      console.log("UPLOAD STARTED");
      const uploadedUrl = await uploadTokenImage(finalLogoUrl, token.id || token.contractAddress);
      if (uploadedUrl) {
        finalLogoUrl = uploadedUrl;
        console.log('Successfully uploaded image, new URL:', finalLogoUrl);
      } else {
        console.log('Upload failed, stripping Base64 from payload to prevent realtime crashes');
        finalLogoUrl = ''; // DO NOT fall back to Base64
      }
    }

    const dbToken = {
      contract_address: token.contractAddress,
      creator_wallet: token.creatorHandle,
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      logo_url: finalLogoUrl,
      // Dynamic stats
      market_cap: token.marketCap,
      liquidity: token.liquidity,
      holders: token.holderCount,
      volume_24h: token.volume24h,
      is_active: true,
    };
    
    console.log("FINAL TOKEN PAYLOAD", dbToken);
    console.log("SUPABASE INSERT PAYLOAD", dbToken);
    
    const { data, error: insertError } = await supabase.from('tokens').insert([dbToken]).select();
    console.log("SUPABASE INSERT RESPONSE", data);
    console.log("SUPABASE INSERT ERROR", insertError);
    
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
