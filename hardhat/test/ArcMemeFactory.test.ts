import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
// Typechain imports will resolve after the next compilation
import { ArcMemeFactory, MockUSDC, ArcMemeToken, ArcMemeMarket } from "../typechain-types";

describe("ArcMemeFactory", function () {
  let factory: ArcMemeFactory;
  let usdc: MockUSDC;
  let owner: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let creator2: HardhatEthersSigner;

  const MIN_SEED = ethers.parseUnits("10", 6); // 10 USDC
  const REC_SEED = ethers.parseUnits("100", 6); // 100 USDC

  beforeEach(async function () {
    [owner, creator, creator2] = await ethers.getSigners();
    
    // 1. Deploy MockUSDC
    // We deploy our newly created 6-decimal MockUSDC contract to authentically simulate mainnet liquidity.
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const initialSupply = ethers.parseUnits("100000", 6);
    usdc = (await MockUSDCFactory.deploy(initialSupply)) as any;

    // 3. Mint USDC to users
    await usdc.transfer(creator.address, ethers.parseUnits("1000", 6));
    await usdc.transfer(creator2.address, ethers.parseUnits("1000", 6));

    // 2. Deploy ArcMemeFactory(usdcAddress, owner)
    const Factory = await ethers.getContractFactory("ArcMemeFactory");
    factory = (await Factory.deploy(await usdc.getAddress(), owner.address)) as any;
  });

  describe("1. Factory Deployment", function () {
    it("Should deploy successfully and set correct state variables", async function () {
      expect(await factory.usdcToken()).to.equal(await usdc.getAddress());
      expect(await factory.owner()).to.equal(owner.address);
      expect(await factory.getTokensCount()).to.equal(0);
    });
  });

  describe("Token & Market Creation", function () {
    const tokenName = "ArcPepe";
    const tokenSymbol = "APEPE";

    beforeEach(async function () {
      // 4. User approve Factory
      await usdc.connect(creator).approve(await factory.getAddress(), REC_SEED);
    });

    it("2, 3 & 8. Should create Token, Market, and emit TokenCreated", async function () {
      // 5. User createToken()
      const tx = await factory.connect(creator).createToken(tokenName, tokenSymbol, REC_SEED);
      const receipt = await tx.wait();

      // 8. Verify TokenCreated event
      const filter = factory.filters.TokenCreated();
      const events = await factory.queryFilter(filter, receipt?.blockNumber, receipt?.blockNumber);
      
      expect(events.length).to.equal(1);
      const event = events[0];
      
      expect(event.args[0]).to.not.equal(ethers.ZeroAddress); // token
      expect(event.args[1]).to.not.equal(ethers.ZeroAddress); // market
      expect(event.args[2]).to.equal(creator.address); // creator
      expect(event.args[3]).to.equal(tokenName); // name
      expect(event.args[4]).to.equal(tokenSymbol); // symbol
      expect(event.args[5]).to.equal(REC_SEED); // usdcSeed
    });

    it("4. Should enforce strict 40/60 Token allocation split", async function () {
      await factory.connect(creator).createToken(tokenName, tokenSymbol, REC_SEED);
      
      const allTokens = await factory.getAllTokens();
      const tokenAddress = allTokens[0];
      const marketAddress = await factory.tokenToMarket(tokenAddress);

      const ArcTokenFactory = await ethers.getContractFactory("ArcMemeToken");
      const arcToken = ArcTokenFactory.attach(tokenAddress) as any;

      const expectedCreatorAllocation = ethers.parseUnits("400000000", 18);
      const expectedMarketAllocation = ethers.parseUnits("600000000", 18);
      const expectedTotalSupply = ethers.parseUnits("1000000000", 18);

      expect(await arcToken.balanceOf(creator.address)).to.equal(expectedCreatorAllocation);
      expect(await arcToken.balanceOf(marketAddress)).to.equal(expectedMarketAllocation);
      expect(await arcToken.totalSupply()).to.equal(expectedTotalSupply);
    });

    it("5. Should revert if seed is less than minimum 10 USDC", async function () {
      const smallSeed = ethers.parseUnits("9.9", 6);
      await usdc.connect(creator).approve(await factory.getAddress(), smallSeed);
      
      await expect(
        factory.connect(creator).createToken(tokenName, tokenSymbol, smallSeed)
      ).to.be.revertedWith("Insufficient USDC seed");
    });

    it("6. Should update the Market registry accurately", async function () {
      await factory.connect(creator).createToken(tokenName, tokenSymbol, REC_SEED);
      
      const allTokens = await factory.getAllTokens();
      expect(allTokens.length).to.equal(1);
      
      const tokenAddr = allTokens[0];
      const marketAddr = await factory.tokenToMarket(tokenAddr);
      
      expect(marketAddr).to.not.equal(ethers.ZeroAddress);
      expect(await factory.isMarket(marketAddr)).to.equal(true);
      expect(await factory.getTokensCount()).to.equal(1);
    });

    it("7. Should support multiple token deployments", async function () {
      await factory.connect(creator).createToken("Token 1", "TK1", REC_SEED);
      
      await usdc.connect(creator2).approve(await factory.getAddress(), REC_SEED);
      await factory.connect(creator2).createToken("Token 2", "TK2", REC_SEED);
      
      expect(await factory.getTokensCount()).to.equal(2);
      
      const allTokens = await factory.getAllTokens();
      const market1 = await factory.tokenToMarket(allTokens[0]);
      const market2 = await factory.tokenToMarket(allTokens[1]);
      
      expect(market1).to.not.equal(market2);
      expect(await factory.isMarket(market1)).to.equal(true);
      expect(await factory.isMarket(market2)).to.equal(true);
    });
  });
});
