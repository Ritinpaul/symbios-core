// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NegotiationContract is Ownable {
    IERC20 public symbiosisToken;

    enum State { Created, OfferSubmitted, Locked, Executed, Cancelled }

    struct Negotiation {
        address buyer;
        address seller;
        string resourceType; // e.g., "HEAT"
        uint256 quantity;
        uint256 price;       // Total price in SYM tokens
        State state;
    }

    mapping(uint256 => Negotiation) public negotiations;
    uint256 public negotiationCounter;

    event NegotiationCreated(uint256 indexed id, address indexed buyer, address indexed seller, string resourceType, uint256 quantity);
    event OfferSubmitted(uint256 indexed id, uint256 price);
    event FundsLocked(uint256 indexed id);
    event AtomicSwapExecuted(uint256 indexed id);
    event NegotiationCancelled(uint256 indexed id);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        symbiosisToken = IERC20(_tokenAddress);
    }

    // Step 1: Buyer initiates a need
    function createNegotiation(address _seller, string memory _resourceType, uint256 _quantity) public returns (uint256) {
        uint256 id = ++negotiationCounter;
        negotiations[id] = Negotiation({
            buyer: msg.sender,
            seller: _seller,
            resourceType: _resourceType,
            quantity: _quantity,
            price: 0,
            state: State.Created
        });

        emit NegotiationCreated(id, msg.sender, _seller, _resourceType, _quantity);
        return id;
    }

    // Step 2: Seller submits a binding offer price
    function submitOffer(uint256 _id, uint256 _price) public {
        Negotiation storage neg = negotiations[_id];
        require(msg.sender == neg.seller, "Only seller can submit offer");
        require(neg.state == State.Created, "Invalid state");

        neg.price = _price;
        neg.state = State.OfferSubmitted;

        emit OfferSubmitted(_id, _price);
    }

    // Step 3: Buyer accepts offer and LOCKS FUNDS (Atomic Swap Prep)
    function acceptOfferAndLockFunds(uint256 _id) public {
        Negotiation storage neg = negotiations[_id];
        require(msg.sender == neg.buyer, "Only buyer can accept");
        require(neg.state == State.OfferSubmitted, "Invalid state");

        // Transfer funds from Buyer to this Contract (Escrow)
        // Note: Buyer must have called approve() on SYM token first
        require(symbiosisToken.transferFrom(msg.sender, address(this), neg.price), "Transfer failed");

        neg.state = State.Locked;
        emit FundsLocked(_id);
    }

    // Step 4: Atomic Swap Execution (Triggered by Oracle or manual in Phase 1-3)
    // In a full implementation, the DeliveryContract would trigger this upon physical delivery.
    function executeSwap(uint256 _id) public {
        Negotiation storage neg = negotiations[_id];
        require(neg.state == State.Locked, "Funds not locked");
        
        // Only authorized entities should execute. For Hackathon, we allow buyer to confirm receipt
        // or the delivery oracle. Here we simplify to allow buyer to confirm.
        require(msg.sender == neg.buyer || msg.sender == owner(), "Unauthorized execution");

        neg.state = State.Executed;

        // Release funds from Contract to Seller
        require(symbiosisToken.transfer(neg.seller, neg.price), "Transfer to seller failed");

        emit AtomicSwapExecuted(_id);
    }

    function cancelNegotiation(uint256 _id) public {
        Negotiation storage neg = negotiations[_id];
        require(neg.state == State.Created || neg.state == State.OfferSubmitted, "Cannot cancel now");
        require(msg.sender == neg.buyer || msg.sender == neg.seller, "Unauthorized");

        neg.state = State.Cancelled;
        emit NegotiationCancelled(_id);
    }
}
