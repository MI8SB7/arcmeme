import { ethers } from "hardhat";

async function main() {
  console.log("Starting ArcMeme Deployment Flow...");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account found. Ensure your PRIVATE_KEY is loaded in .env");
  }

  const network = await ethers.provider.getNetwork();
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer Address: ${deployer.address}`);

  const ARC_NATIVE_USDC = "0x3600000000000000000000000000000000000000";
  console.log(`\n[1] Using Native Arc USDC Precompile: ${ARC_NATIVE_USDC}`);

  // Deploy ArcMemeFactory
  console.log("\n[2] Deploying ArcMemeFactory...");
  const ArcMemeFactory = await ethers.getContractFactory("ArcMemeFactory");
  const factory = await ArcMemeFactory.deploy(ARC_NATIVE_USDC, deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`✅ ArcMemeFactory deployed to: ${factoryAddress}`);

  // Summary
  console.log("\n=============================================");
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=============================================");
  console.log("Next Steps:");
  console.log("Copy these addresses into your frontend config:");
  console.log(`export const ARC_NATIVE_USDC = '${ARC_NATIVE_USDC}';`);
  console.log(`export const ARC_MEME_FACTORY_ADDRESS = '${factoryAddress}';`);
  console.log("=============================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
