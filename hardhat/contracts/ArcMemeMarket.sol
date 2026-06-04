// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ArcMemeMarket
 * @notice Constant Product AMM (x * y = k) for a specific MemeToken paired with USDC.
 * @dev Assumes USDC has 6 decimals and Token has 18 decimals. No reserve scaling is used.
 */
contract ArcMemeMarket is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable memeToken;
    IERC20 public immutable usdcToken;

    uint256 public reserveToken;
    uint256 public reserveUSDC;

    uint256 public constant MINIMUM_SEED_USDC = 10 * 10**6; // 10 USDC

    event MarketInitialized(uint256 tokenAmount, uint256 usdcAmount);
    event Buy(address indexed buyer, uint256 usdcIn, uint256 tokenOut);
    event Sell(address indexed seller, uint256 tokenIn, uint256 usdcOut);

    /**
     * @param _memeToken Address of the 18-decimal Meme Token
     * @param _usdcToken Address of the 6-decimal USDC Token
     * @param _factoryOwner Address of the Factory owner (has pause rights)
     */
    constructor(
        address _memeToken,
        address _usdcToken,
        address _factoryOwner
    ) Ownable(_factoryOwner) {
        require(_memeToken != address(0), "Invalid token address");
        require(_usdcToken != address(0), "Invalid USDC address");
        
        memeToken = IERC20(_memeToken);
        usdcToken = IERC20(_usdcToken);
    }

    /**
     * @notice Initializes the market with initial liquidity.
     * @dev Called by the factory after tokens and USDC are directly transferred to this contract.
     */
    function initialize() external nonReentrant {
        require(reserveUSDC == 0 && reserveToken == 0, "Already initialized");

        uint256 tokenBalance = memeToken.balanceOf(address(this));
        require(tokenBalance > 0, "No tokens provided for liquidity");

        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        require(usdcBalance >= MINIMUM_SEED_USDC, "Insufficient USDC seed");

        reserveToken = tokenBalance;
        reserveUSDC = usdcBalance;

        emit MarketInitialized(reserveToken, reserveUSDC);
    }

    /**
     * @notice Swaps USDC for Meme Tokens
     * @param usdcAmount Amount of USDC to spend
     * @param minTokensOut Minimum amount of tokens to receive (slippage protection)
     */
    function buy(uint256 usdcAmount, uint256 minTokensOut) external nonReentrant whenNotPaused {
        require(usdcAmount > 0, "Invalid input amount");
        require(reserveUSDC > 0 && reserveToken > 0, "Market not initialized");

        // Calculate amount out (TokenOut = (ReserveToken * USDCIn) / (ReserveUSDC + USDCIn))
        uint256 tokensOut = (reserveToken * usdcAmount) / (reserveUSDC + usdcAmount);
        
        require(tokensOut >= minTokensOut, "Slippage tolerance exceeded");
        require(tokensOut < reserveToken, "Insufficient liquidity");

        // Transfer USDC in
        usdcToken.safeTransferFrom(msg.sender, address(this), usdcAmount);

        // Update reserves
        reserveUSDC += usdcAmount;
        reserveToken -= tokensOut;

        // Transfer Tokens out
        memeToken.safeTransfer(msg.sender, tokensOut);

        emit Buy(msg.sender, usdcAmount, tokensOut);
    }

    /**
     * @notice Swaps Meme Tokens for USDC
     * @param tokenAmount Amount of Tokens to spend
     * @param minUsdcOut Minimum amount of USDC to receive (slippage protection)
     */
    function sell(uint256 tokenAmount, uint256 minUsdcOut) external nonReentrant whenNotPaused {
        require(tokenAmount > 0, "Invalid input amount");
        require(reserveUSDC > 0 && reserveToken > 0, "Market not initialized");

        // Calculate amount out (USDCOut = (ReserveUSDC * TokenIn) / (ReserveToken + TokenIn))
        uint256 usdcOut = (reserveUSDC * tokenAmount) / (reserveToken + tokenAmount);

        require(usdcOut >= minUsdcOut, "Slippage tolerance exceeded");
        require(usdcOut < reserveUSDC, "Insufficient liquidity");

        // Transfer Tokens in
        memeToken.safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Update reserves
        reserveToken += tokenAmount;
        reserveUSDC -= usdcOut;

        // Transfer USDC out
        usdcToken.safeTransfer(msg.sender, usdcOut);

        emit Sell(msg.sender, tokenAmount, usdcOut);
    }

    /**
     * @notice Pauses trading (Factory Owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses trading (Factory Owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
