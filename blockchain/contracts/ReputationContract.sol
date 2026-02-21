// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationContract is ERC721, Ownable {
    uint256 private _nextTokenId;

    // Factory Address => Score (1 to 100)
    mapping(address => uint256) public reputationScores;
    // Factory Address => Token ID (Each factory only gets ONE soulbound token)
    mapping(address => uint256) public factoryToToken;
    
    // Who can update scores? Usually the DeliveryContract or Admin
    mapping(address => bool) public authorizedUpdaters;

    event ScoreUpdated(address indexed factory, uint256 newScore);
    event SoulboundIssued(address indexed factory, uint256 tokenId);

    constructor() ERC721("Symbiosis Reputation", "SYMR") Ownable(msg.sender) {
        authorizedUpdaters[msg.sender] = true;
    }

    function setAuthorizedUpdater(address updater, bool isAuthorized) public onlyOwner {
        authorizedUpdaters[updater] = isAuthorized;
    }

    // 1. Issue the SBT Identity. Can only happen once per factory address.
    function issueSoulbound(address factory) public onlyOwner {
        require(factoryToToken[factory] == 0 && balanceOf(factory) == 0, "Factory already has a Soulbound Token");
        
        uint256 tokenId = ++_nextTokenId;
        _safeMint(factory, tokenId);
        factoryToToken[factory] = tokenId;
        reputationScores[factory] = 100; // Start with perfect score

        emit SoulboundIssued(factory, tokenId);
    }

    // 2. Update the embedded score in the token.
    function updateScore(address factory, uint256 newScore) public {
        require(authorizedUpdaters[msg.sender], "Not authorized to update scores");
        require(newScore <= 100, "Score cannot exceed 100");
        require(factoryToToken[factory] != 0, "Factory has no Soulbound token");

        reputationScores[factory] = newScore;
        emit ScoreUpdated(factory, newScore);
    }

    // 3. Prevent Transfers (This makes it "Soulbound")
    function transferFrom(address, address, uint256) public virtual override {
        revert("Reputation Tokens are Soulbound and non-transferable");
    }

    // Same for safeTransferFrom versions
    function safeTransferFrom(address, address, uint256, bytes memory) public virtual override {
        revert("Reputation Tokens are Soulbound and non-transferable");
    }
}
