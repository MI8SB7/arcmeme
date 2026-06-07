import { createPublicClient, http, erc20Abi, parseAbi } from 'viem';
import { arcTestnet } from './src/config/chains';

const marketAbi = parseAbi(["function reserveUSDC() view returns (uint256)", "function reserveToken() view returns (uint256)"]);

async function test() {
  const client = createPublicClient({ chain: arcTestnet, transport: http() });
  const trader = '0xA3Ca9CC33764f8b061b79B9A8A0a00663ea9B181';
  const token = '0x20236C6F47b57d158d8f3b3D0A29Ded375D7Fc45';
  const market = '0xd0f9a9adEc069B6Fe147Af6f99CD82C510bAEc97';
  
  const results = await client.multicall({
    contracts: [
      { address: token, abi: erc20Abi, functionName: 'balanceOf', args: [trader] },
      { address: market, abi: marketAbi, functionName: 'reserveUSDC' },
      { address: market, abi: marketAbi, functionName: 'reserveToken' }
    ]
  });
  console.log(JSON.stringify(results, (key, value) => typeof value === 'bigint' ? value.toString() : value));
}
test().catch(console.error);