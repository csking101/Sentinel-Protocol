// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// TokenC: NativeCoin (ERC20 version for demo)
contract NativeCoin is ERC20 {
    constructor(uint256 initialSupply) ERC20("NativeCoin", "NATIVE") {
        _mint(msg.sender, initialSupply);
    }
}