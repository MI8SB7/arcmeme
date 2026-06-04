import { ethers } from "hardhat";

async function main() {
  const ARC_USDC = "0x3600000000000000000000000000000000000000";
  const abi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  console.log("Checking Arc USDC Precompile at", ARC_USDC);
  const [signer] = await ethers.getSigners();
  const usdc = new ethers.Contract(ARC_USDC, abi, signer);

  try {
    const name = await usdc.name();
    const symbol = await usdc.symbol();
    const decimals = await usdc.decimals();
    console.log(`Token: ${name} (${symbol}) - Decimals: ${decimals}`);

    const balance = await usdc.balanceOf(signer.address);
    console.log(`Balance of ${signer.address}:`, balance.toString());

    console.log("Testing approve...");
    const tx = await usdc.approve(signer.address, 100n, { gasLimit: 100000 });
    await tx.wait();
    console.log("Approve successful!");
    
    const allowance = await usdc.allowance(signer.address, signer.address);
    console.log(`Allowance: ${allowance.toString()}`);
  } catch (err: any) {
    console.error("ERC20 interface check failed:", err.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
