const { decodeEventLog, parseAbi } = require('viem');

const ARC_MEME_FACTORY_ABI = parseAbi([
  'function createToken(string name, string symbol, uint256 totalSupply) external returns (address)',
  'event TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 totalSupply, uint256 timestamp)',
  'function getAllTokens() external view returns (address[])',
  'function getTokensCount() external view returns (uint256)'
]);

const logData = "0x000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000033b2e3c9fd0803ce8000000000000000000000000000000000000000000000000000000000000006a1d4bab00000000000000000000000000000000000000000000000000000000000000056b6b616b6100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024144000000000000000000000000000000000000000000000000000000000000";
const topics = [
  "0xc12630d761ddbf18b9530f31d91e67493535a2b635711bcff59fded8bf381cce",
  "0x000000000000000000000000063efce5526a5b33b17b22d6646baeee4dd0c9e0",
  "0x000000000000000000000000a3ca9cc33764f8b061b79b9a8a0a00663ea9b181"
];

try {
  const decodedLog = decodeEventLog({
    abi: ARC_MEME_FACTORY_ABI,
    data: logData,
    topics: topics,
  });
  console.log("SUCCESS:", decodedLog);
} catch (e) {
  console.error("ERROR:", e);
}
