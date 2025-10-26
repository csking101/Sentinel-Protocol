// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// TokenD: DeFiCoin
contract DeFiCoin is ERC20 {
    constructor(uint256 initialSupply) ERC20("DeFiCoin", "DEFI") {
        _mint(msg.sender, initialSupply);
    }
}