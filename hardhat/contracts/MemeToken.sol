// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MemeToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address creator
    ) ERC20(name, symbol) {
        // Mint the entire total supply to the creator.
        // We assume the frontend passes the value scaled by 10**18 if necessary,
        // or we can handle decimals here. OpenZeppelin ERC20 defaults to 18 decimals.
        // Assuming totalSupply argument includes the 18 zeros.
        _mint(creator, totalSupply);
    }
}
