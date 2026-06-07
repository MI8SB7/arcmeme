import { supabase } from '../lib/supabase';

export interface Profile {
  id?: string;
  created_at?: string;
  wallet_address: string;
  username: string;
  avatar_url?: string;
  bio?: string;
}

export const getProfileByWallet = async (walletAddress: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('Supabase getProfile error', error);
    return null;
  }
  return data as Profile | null;
};

export const getAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('Supabase getAllProfiles error', error);
    return [];
  }
  return data as Profile[];
};

export const createProfile = async (profile: Omit<Profile, 'id' | 'created_at'>): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').insert([profile]).single();
  if (error) {
    console.error('Supabase createProfile error', error);
    return null;
  }
  return data as Profile;
};
