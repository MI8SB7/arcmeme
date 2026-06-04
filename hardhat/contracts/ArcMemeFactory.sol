// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Interfaces for interactions to prevent compilation dependency issues if files are not fully resolved
import "./ArcMemeToken.sol";
import "./ArcMemeMarket.sol";

/**
 * @title ArcMemeFactory
 * @notice Permissionless factory for deploying ArcMemeToken and ArcMemeMarket pairs.
 */
contract ArcMemeFactory is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdcToken;
    
    uint256 public constant MINIMUM_SEED_USDC = 10 * 10**6; // 10 USDC

    // Market Registry
    address[] public allTokens;
    mapping(address => address) public tokenToMarket;
    mapping(address => bool) public isMarket;

    event TokenCreated(
        address indexed token,
        address indexed market,
        address indexed creator,
        string name,
        string symbol,
        uint256 usdcSeed
    );

    /**
     * @param _usdcToken Address of the 6-decimal USDC Token
     * @param _initialOwner Address of the Factory owner (has pause rights on markets)
     */
    constructor(address _usdcToken, address _initialOwner) Ownable(_initialOwner) {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcToken);
    }

    /**
     * @notice Deploys a new Meme Token and its Market atomically.
     * @param name The name of the token.
     * @param symbol The symbol of the token.
     * @param usdcSeed The initial USDC seed amount provided by the creator.
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 usdcSeed
    ) external returns (address token, address market) {
        require(bytes(name).length > 0, "Invalid name");
        require(bytes(symbol).length > 0, "Invalid symbol");
        require(usdcSeed >= MINIMUM_SEED_USDC, "Insufficient USDC seed");

        // 1. Deploy ArcMemeToken
        // The token constructor mints 400M (40%) to creator (msg.sender)
        // and 600M (60%) to the Factory (address(this)). Total Supply = 1 Billion.
        ArcMemeToken newToken = new ArcMemeToken(name, symbol, msg.sender);
        token = address(newToken);

        // 2. Deploy ArcMemeMarket
        // We pass owner() to the market so the Factory Owner controls pauses.
        ArcMemeMarket newMarket = new ArcMemeMarket(token, address(usdcToken), owner());
        market = address(newMarket);

        // 3. Register Market
        allTokens.push(token);
        tokenToMarket[token] = market;
        isMarket[market] = true;

        // 4. Transfer 60% Token allocation to Market
        uint256 factoryTokenBalance = newToken.balanceOf(address(this));
        require(factoryTokenBalance > 0, "Factory received no tokens");
        newToken.transfer(market, factoryTokenBalance);

        // 5. Transfer USDC seed from Creator directly to Market
        usdcToken.safeTransferFrom(msg.sender, market, usdcSeed);

        // 6. Initialize Market Atomically
        newMarket.initialize();

        emit TokenCreated(token, market, msg.sender, name, symbol, usdcSeed);

        return (token, market);
    }

    /**
     * @notice Returns an array of all deployed token addresses.
     */
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    /**
     * @notice Returns the total number of tokens deployed through this factory.
     */
    function getTokensCount() external view returns (uint256) {
        return allTokens.length;
    }
}
