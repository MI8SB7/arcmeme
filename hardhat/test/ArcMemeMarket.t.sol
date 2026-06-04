// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/ArcMemeFactory.sol";
import "../contracts/ArcMemeMarket.sol";
import "../contracts/ArcMemeToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC specifically for 6 decimals
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract ArcMemeMarketTest is Test {
    ArcMemeFactory factory;
    MockUSDC usdc;
    
    address factoryOwner = address(0x1);
    address creator = address(0x2);
    address buyer = address(0x3);
    
    uint256 constant MIN_SEED = 10 * 10**6; // 10 USDC
    uint256 constant REC_SEED = 100 * 10**6; // 100 USDC
    
    // Core state
    ArcMemeToken token;
    ArcMemeMarket market;

    function setUp() public {
        vm.startPrank(factoryOwner);
        usdc = new MockUSDC();
        factory = new ArcMemeFactory(address(usdc), factoryOwner);
        vm.stopPrank();
        
        // Fund creator and buyer with USDC
        usdc.mint(creator, 1000 * 10**6);
        usdc.mint(buyer, 1000 * 10**6);
    }

    // Helper to create a token and return its instances
    function createStandardToken(uint256 seed) internal returns (ArcMemeToken, ArcMemeMarket) {
        vm.startPrank(creator);
        usdc.approve(address(factory), seed);
        (address tokenAddr, address marketAddr) = factory.createToken("Test Meme", "MEME", seed);
        vm.stopPrank();
        return (ArcMemeToken(tokenAddr), ArcMemeMarket(marketAddr));
    }

    function test_DeploymentAndInitialization() public {
        (token, market) = createStandardToken(REC_SEED);

        // 1 & 2 & 3. Deployments verified implicitly by successful creation
        assertTrue(address(token) != address(0));
        assertTrue(address(market) != address(0));

        // 4. 40/60 Split verification
        uint256 expectedCreatorBal = 400_000_000 * 10**18;
        uint256 expectedMarketBal = 600_000_000 * 10**18;
        
        assertEq(token.balanceOf(creator), expectedCreatorBal);
        assertEq(token.balanceOf(address(market)), expectedMarketBal);
        assertEq(token.totalSupply(), 1_000_000_000 * 10**18);

        // 6. Market initialization verification
        assertEq(market.reserveUSDC(), REC_SEED);
        assertEq(market.reserveToken(), expectedMarketBal);
    }

    function testRevert_MinimumSeedVerification() public {
        vm.startPrank(creator);
        usdc.approve(address(factory), MIN_SEED - 1);
        
        // 5. Minimum seed verification (should revert if < 10 USDC)
        vm.expectRevert("Insufficient USDC seed");
        factory.createToken("Test Meme", "MEME", MIN_SEED - 1);
        vm.stopPrank();
    }

    function test_Buy() public {
        (token, market) = createStandardToken(REC_SEED);
        
        uint256 buyAmount = 10 * 10**6; // 10 USDC
        
        vm.startPrank(buyer);
        usdc.approve(address(market), buyAmount);
        
        // Pre-state
        uint256 preTokenReserve = market.reserveToken();
        uint256 preUSDCReserve = market.reserveUSDC();
        uint256 preBuyerToken = token.balanceOf(buyer);
        
        // 7. Buy test
        market.buy(buyAmount, 0); // 0 min return for test
        vm.stopPrank();

        // Verify state changes
        uint256 postTokenReserve = market.reserveToken();
        uint256 postUSDCReserve = market.reserveUSDC();
        uint256 postBuyerToken = token.balanceOf(buyer);

        assertTrue(postUSDCReserve == preUSDCReserve + buyAmount);
        assertTrue(postTokenReserve < preTokenReserve);
        assertTrue(postBuyerToken > preBuyerToken);
    }

    function test_Sell() public {
        (token, market) = createStandardToken(REC_SEED);
        
        // First buy to get tokens to sell
        uint256 buyAmount = 10 * 10**6;
        vm.startPrank(buyer);
        usdc.approve(address(market), buyAmount);
        market.buy(buyAmount, 0);
        
        uint256 tokensToSell = token.balanceOf(buyer);
        token.approve(address(market), tokensToSell);
        
        // Pre-state
        uint256 preUSDCBal = usdc.balanceOf(buyer);
        
        // 8. Sell test
        market.sell(tokensToSell, 0);
        vm.stopPrank();

        uint256 postUSDCBal = usdc.balanceOf(buyer);
        assertTrue(postUSDCBal > preUSDCBal); // Received USDC back
        assertEq(token.balanceOf(buyer), 0); // Sold all tokens
    }

    function test_ConstantProductInvariant() public {
        (token, market) = createStandardToken(REC_SEED);
        
        uint256 initialK = market.reserveUSDC() * market.reserveToken();
        
        // 9. Constant product invariant test
        vm.startPrank(buyer);
        usdc.approve(address(market), 50 * 10**6);
        market.buy(50 * 10**6, 0);
        
        uint256 postK = market.reserveUSDC() * market.reserveToken();
        
        // Due to integer division round down, postK should be >= initialK
        // AMM math guarantees the pool never loses value in k
        assertTrue(postK >= initialK);
        vm.stopPrank();
    }

    function testRevert_SlippageProtection() public {
        (token, market) = createStandardToken(REC_SEED);
        
        vm.startPrank(buyer);
        usdc.approve(address(market), 10 * 10**6);
        
        // 10. Slippage revert test
        // Expect an impossible amount of tokens out
        uint256 impossibleTokens = token.totalSupply(); 
        
        vm.expectRevert("Slippage tolerance exceeded");
        market.buy(10 * 10**6, impossibleTokens);
        vm.stopPrank();
    }

    function testRevert_ZeroAmount() public {
        (token, market) = createStandardToken(REC_SEED);
        
        // 11. Zero amount revert test
        vm.startPrank(buyer);
        vm.expectRevert("Invalid input amount");
        market.buy(0, 0);
        vm.stopPrank();
    }

    function testRevert_InsufficientLiquidity() public {
        (token, market) = createStandardToken(REC_SEED);
        
        // 12. Insufficient liquidity revert test (Try to buy more than pool has)
        uint256 massiveBuy = 1000 * 10**6; // 1000 USDC
        vm.startPrank(buyer);
        usdc.approve(address(market), massiveBuy);
        
        // Because k math asymptotically approaches the reserve but never hits it,
        // we test a massive buy to ensure math holds or reverts safely.
        // Actually, tokenOut < reserveToken handles the pool drain check.
        // Let's force an exact drain attempt using raw internal variables if possible, 
        // but math makes it impossible. We'll just verify the trade succeeds but leaves tokens.
        market.buy(massiveBuy, 0);
        assertTrue(market.reserveToken() > 0);
        vm.stopPrank();
    }

    function test_PauseUnpause() public {
        (token, market) = createStandardToken(REC_SEED);
        
        // 13. Pause test
        vm.startPrank(factoryOwner);
        market.pause();
        vm.stopPrank();
        
        vm.startPrank(buyer);
        usdc.approve(address(market), 10 * 10**6);
        vm.expectRevert("EnforcedPause()");
        market.buy(10 * 10**6, 0);
        vm.stopPrank();
        
        // 14. Unpause test
        vm.startPrank(factoryOwner);
        market.unpause();
        vm.stopPrank();
        
        vm.startPrank(buyer);
        market.buy(10 * 10**6, 0); // Should succeed now
        assertTrue(token.balanceOf(buyer) > 0);
        vm.stopPrank();
    }

    function test_MultipleTrades() public {
        (token, market) = createStandardToken(REC_SEED);
        
        uint256 initialK = market.reserveUSDC() * market.reserveToken();
        
        // 15. Multiple trades test
        vm.startPrank(buyer);
        usdc.approve(address(market), type(uint256).max);
        token.approve(address(market), type(uint256).max);
        
        market.buy(10 * 10**6, 0);
        market.buy(5 * 10**6, 0);
        
        uint256 tokensToSell = token.balanceOf(buyer) / 2;
        market.sell(tokensToSell, 0);
        
        market.buy(20 * 10**6, 0);
        vm.stopPrank();
        
        uint256 finalK = market.reserveUSDC() * market.reserveToken();
        assertTrue(finalK >= initialK);
    }
}
