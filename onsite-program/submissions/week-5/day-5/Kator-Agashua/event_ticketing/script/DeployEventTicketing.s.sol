// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {TicketToken} from "../src/TicketToken.sol";
import {TicketNft} from "../src/TicketNFT.sol";
// Update the import path below if the file is located elsewhere, e.g. "../src/EventTicketing.sol"
import {EventTicketing} from "../src/EventTicketing.sol";

contract DeployEventTicketing is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        uint256 initialSupply = 1_000_000 ether; // 1,000,000 tokens with 18 decimals
        TicketToken token = new TicketToken(initialSupply);
        TicketNft nft = new TicketNft();
        uint256 ticketPrice = 1e18; // Example: 1 token per ticket
        EventTicketing eventTicketing = new EventTicketing(
            address(token),
            address(nft),
            ticketPrice
        );
        vm.stopBroadcast();
    }
}
