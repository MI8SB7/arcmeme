// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ArcMemeToken
 * @notice Fixed supply ERC20 token designed for the ArcMeme ecosystem.
 * @dev Mints exactly 1,000,000,000 tokens upon deployment with a 40/60 split.
 */
contract ArcMemeToken is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    
    // Percentages of total supply
    uint256 public constant CREATOR_ALLOCATION = 400_000_000 * 10**18;
    uint256 public constant FACTORY_ALLOCATION = 600_000_000 * 10**18;

    /**
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param creator The address of the user creating the token
     */
    constructor(
        string memory name,
        string memory symbol,
        address creator
    ) ERC20(name, symbol) {
        require(creator != address(0), "Invalid creator address");

        // Mint 40% (400M) directly to the creator
        _mint(creator, CREATOR_ALLOCATION);

        // Mint 60% (600M) to the Factory (msg.sender) to seed the liquidity pool
        _mint(msg.sender, FACTORY_ALLOCATION);
        
        // Assert standard safety check
        assert(totalSupply() == TOTAL_SUPPLY);
    }
}
