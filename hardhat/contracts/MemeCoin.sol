// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// TokenA: MemeCoin
contract MemeCoin is ERC20 {
    constructor(uint256 initialSupply) ERC20("MemeCoin", "MEME") {
        _mint(msg.sender, initialSupply);
    }
}