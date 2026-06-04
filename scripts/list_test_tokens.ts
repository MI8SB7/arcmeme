// script: scripts/list_test_tokens.ts
import { ethers } from 'ethers';
import { ARC_MEME_FACTORY_ADDRESS, ARC_MEME_FACTORY_ABI } from '../src/config/contracts';

(async () => {
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
  const factory = new ethers.Contract(ARC_MEME_FACTORY_ADDRESS, ARC_MEME_FACTORY_ABI, provider);
  const tokenAddrs: string[] = await factory.getAllTokens();
  console.log('Total tokens:', tokenAddrs.length);
  for (const addr of tokenAddrs) {
    const token = new ethers.Contract(addr, [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function market() view returns (address)'
    ], provider);
    try {
      const [name, symbol] = await Promise.all([token.name(), token.symbol()]);
      if (['LUFFY', 'PE', 'KAK'].includes(name) || ['LUFFY', 'PE', 'KAK'].includes(symbol)) {
        const market = await token.market?.();
        console.log({ name, symbol, contractAddress: addr, marketAddress: market ?? 'N/A' });
      }
    } catch (e) {
      // ignore errors
    }
  }
})();
