// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./TicketToken.sol";
import "./TicketNFT.sol";

contract EventTicketing {
    TicketToken public paymentToken;
    TicketNft public ticketNFT;
    uint256 public ticketPrice;
    address public owner;

    struct Event {
        string name;
        uint256 totalTickets;
        uint256 totalAvailable;
        uint256 totalSold;
    }

    struct Ticket {
        address owner;
        uint256 purchaseTime;
        uint256 eventId;
        string seat;
    }

    mapping(uint256 => Event) public events;
    uint256 public nextEventId;
    mapping(uint256 => Ticket) public tickets;

    event TicketPurchased(address indexed buyer, uint256 indexed tokenId, uint256 indexed eventId);
    event EventCreated(uint256 indexed eventId, string name, uint256 totalTickets);

    constructor(address _paymentToken, address _ticketNFT, uint256 _ticketPrice) {
        paymentToken = TicketToken(_paymentToken);
        ticketNFT = TicketNft(_ticketNFT);
        ticketPrice = _ticketPrice;
        owner = msg.sender;
    }

    function createEvent(string calldata name, uint256 totalTickets) external returns (uint256) {
        require(msg.sender == owner, "Not owner");
        require(totalTickets > 0, "Must have tickets");
        uint256 eventId = nextEventId++;
        events[eventId] = Event({
            name: name,
            totalTickets: totalTickets,
            totalAvailable: totalTickets,
            totalSold: 0
        });
        emit EventCreated(eventId, name, totalTickets);
        return eventId;
    }

    function buyTicket(uint256 eventId, string calldata seat) external {
        Event storage evt = events[eventId];
        require(bytes(evt.name).length > 0, "Event does not exist");
        require(evt.totalAvailable > 0, "Sold out");
        require(paymentToken.transferFrom(msg.sender, owner, ticketPrice), "Payment failed");
        uint256 tokenId = ticketNFT.mint(msg.sender);
        tickets[tokenId] = Ticket({
            owner: msg.sender,
            purchaseTime: block.timestamp,
            eventId: eventId,
            seat: seat
        });
        evt.totalAvailable--;
        evt.totalSold++;
        emit TicketPurchased(msg.sender, tokenId, eventId);
    }

    function setTicketPrice(uint256 _ticketPrice) external {
        require(msg.sender == owner, "Not owner");
        ticketPrice = _ticketPrice;
    }
}
