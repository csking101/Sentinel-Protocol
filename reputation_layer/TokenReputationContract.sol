// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TokenReputationContract {

    // Struct to store scores
    struct Scores {
        uint256 marketStability;
        uint256 fundamentalStrength;
        uint256 risk;
        uint256 reputationScore;
    }

    // Mapping token symbol => Scores
    mapping(string => Scores) private tokenScores;

    // List of all tokens
    string[] private tokenList;
    mapping(string => bool) private tokenExists; // For checking duplicates

    // Owner of contract
    address public owner;

    // Events
    event ScoresUpdated(string token, uint256 market, uint256 fundamental, uint256 risk, uint256 reputation);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Add or update scores for a token
    function setScores(
        string calldata token,
        uint256 marketStability,
        uint256 fundamentalStrength,
        uint256 risk,
        uint256 reputationScore
    ) public {
        // If token is new, add to tokenList
        if (!tokenExists[token]) {
            tokenList.push(token);
            tokenExists[token] = true;
        }

        tokenScores[token] = Scores({
            marketStability: marketStability,
            fundamentalStrength: fundamentalStrength,
            risk: risk,
            reputationScore: reputationScore
        });

        emit ScoresUpdated(token, marketStability, fundamentalStrength, risk, reputationScore);
    }

    /// @notice Read scores for a token
    function getScores(string calldata token) external view returns (
        uint256 marketStability,
        uint256 fundamentalStrength,
        uint256 risk,
        uint256 reputationScore
    ) {
        Scores memory s = tokenScores[token];
        return (s.marketStability, s.fundamentalStrength, s.risk, s.reputationScore);
    }

    /// @notice Get all token symbols with stored scores
    function getAllTokens() external view returns (string[] memory) {
        return tokenList;
    }
}
