// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SymbiosisToken is ERC20, Ownable {
    constructor() ERC20("Symbiosis Token", "SYM") Ownable(msg.sender) {
        // Mint 100,000,000 tokens to deployer for Hackathon initial distribution
        _mint(msg.sender, 100000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
