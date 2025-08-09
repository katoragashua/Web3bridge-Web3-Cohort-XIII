// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {TicketToken} from "../src/TicketToken.sol";
import {TicketNft} from "../src/TicketNFT.sol";
import {EventTicketing} from "../src/EventTicketing.sol";

contract EventTicketingTest is Test {
    TicketToken token;
    TicketNft nft;
    EventTicketing eventTicketing;
    address user = address(0xBEEF);
    uint256 initialSupply = 1_000_000 ether;
    uint256 ticketPrice = 1 ether;

    function setUp() public {
        token = new TicketToken(initialSupply);
        nft = new TicketNft();
        eventTicketing = new EventTicketing(address(token), address(nft), ticketPrice);
        // Give user some tokens and approve contract
        token.transfer(user, 100 ether);
        vm.prank(user);
        token.approve(address(eventTicketing), 100 ether);
    }

    function test_CreateEventAndBuyTicket() public {
        // Owner creates event
        uint256 eventId = eventTicketing.createEvent("Concert", 10);
        // User buys ticket
        vm.prank(user);
        eventTicketing.buyTicket(eventId, "A1");
        // Check event stats
        (string memory name, uint256 total, uint256 avail, uint256 sold) = eventTicketing.events(eventId);
        assertEq(name, "Concert");
        assertEq(total, 10);
        assertEq(avail, 9);
        assertEq(sold, 1);
        // Check ticket struct
        uint256 tokenId = 0; // First minted tokenId is 0
        (address owner,, uint256 ticketEventId, string memory seat) = eventTicketing.tickets(tokenId);
        assertEq(owner, user);
        assertEq(ticketEventId, eventId);
        assertEq(seat, "A1");
        // Check NFT ownership
        assertEq(nft.ownerOf(tokenId), user);
    }
}
