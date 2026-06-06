// script: scripts/list_test_tokens.ts
import { ethers } from 'ethers';
import { ARC_MEME_FACTORY_ADDRESS, ARC_MEME_FACTORY_ABI } from '../src/config/contracts';

(async () => {
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
  const factory = new ethers.Contract(ARC_MEME_FACTORY_ADDRESS, ARC_MEME_FACTORY_ABI, provider);
  const tokenAddrs: string[] = await factory.getAllTokens();
  console.log('Total tokens:', tokenAddrs.length);
  for (const addr of tokenAddrs) {
    console.log(addr);
    const token = new ethers.Contract(addr, [
      'function name() view returns (string)',
      'function symbol() view returns (string)'
    ], provider);
    try {
      const [name, symbol] = await Promise.all([token.name(), token.symbol()]);
      console.log(`  -> ${symbol} (${name})`);
    } catch (e) {
      console.log(`  -> error fetching name/symbol`);
    }
  }
})();
