export const APP_CONFIG = {
  // Dynamic fee configuration for token creation (in USDC)
  // This can later be wired to read directly from a smart contract.
  TOKEN_CREATION_FEE_USDC: 10,
  
  // Admin wallet allowed to deploy core infrastructure contracts
  ADMIN_WALLET_ADDRESS: import.meta.env.VITE_ADMIN_WALLET_ADDRESS || '',
};
