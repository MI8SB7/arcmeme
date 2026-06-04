// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice 6-decimal ERC20 token explicitly for testing ArcMeme deployments.
 */
contract MockUSDC is ERC20 {
    /**
     * @param initialSupply The amount of USDC to mint to the deployer (uses 6 decimals)
     */
    constructor(uint256 initialSupply) ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @notice Overrides the default OpenZeppelin 18 decimals to mirror genuine USDC.
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
