import { createPublicClient, http } from 'viem';
import { arcTestnet } from './config/chains';
import { erc20Abi } from 'viem';

const client = createPublicClient({ chain: arcTestnet, transport: http() });
client.readContract({
  address: '0x20236C6F47b57d158d8f3b3D0A29Ded375D7Fc45',
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: ['0xA3Ca9CC33764f8b061b79B9A8A0a00663ea9B181']
}).then(console.log).catch(console.error);