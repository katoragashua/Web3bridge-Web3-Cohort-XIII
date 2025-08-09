// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TicketNft is ERC721 {
    uint256 private _nextTokenId;

    constructor() ERC721("TicketNft", "TNFT") {}

    function mint(address to) public returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _mint(to, tokenId);
        return tokenId;
    }
}
