// scripts/list_test_tokens.js
const { ethers } = require('ethers');

// Factory address (from src/config/contracts.ts)
const FACTORY_ADDRESS = '0x035b5443F9b4D8994F8D83F32968D1694db269A8';
// Minimal ABI for the factory (only getAllTokens)
const FACTORY_ABI = [
  'function getAllTokens() external view returns (address[])',
];
// Minimal token ABI (name, symbol, market)
const TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function market() view returns (address)',
];

(async () => {
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  const tokenAddrs = await factory.getAllTokens();
  console.log('Total tokens on chain:', tokenAddrs.length);
  for (const addr of tokenAddrs) {
    const token = new ethers.Contract(addr, TOKEN_ABI, provider);
    try {
      const [name, symbol, market] = await Promise.all([
        token.name(),
        token.symbol(),
        token.market ? token.market() : Promise.resolve('N/A'),
      ]);
      if (['LUFFY', 'PE', 'KAK'].includes(name) || ['LUFFY', 'PE', 'KAK'].includes(symbol)) {
        console.log({ name, symbol, contractAddress: addr, marketAddress: market });
      }
    } catch (e) {
      // ignore any contracts that don't implement the expected interface
    }
  }
})();
