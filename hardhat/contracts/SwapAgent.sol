// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract SwapAgent {
    address public owner;
    mapping(address => mapping(address => uint256)) public rates;

    constructor() {
        owner = msg.sender;
    }

    function setRate(address from, address to, uint256 rate) external {
        rates[from][to] = rate;
    }

    function swapTokens(address tokenFrom, address tokenTo, address user, uint256 amount) external {
        uint256 rate = rates[tokenFrom][tokenTo];
        require(rate > 0, "Rate not set");

        IERC20(tokenFrom).transferFrom(user, address(this), amount);
        uint256 amountTo = (amount * rate) / 1e18;
        IERC20(tokenTo).transfer(user, amountTo);
    }
}
