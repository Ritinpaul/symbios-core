// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interfaces
interface INegotiationContract {
    function executeSwap(uint256 _id) external;
}

interface IIoTOracle {
    function getLatestReading(uint256 deliveryId, string memory sensorType) external view returns (uint256);
}

contract DeliveryContract is Ownable {
    INegotiationContract public negotiationContract;
    IIoTOracle public oracle;

    enum DeliveryState { Pending, Verified, Disputed }

    struct Delivery {
        uint256 negotiationId;
        string expectedSensorType;
        uint256 requiredValue; // e.g., 50 units of heat detected
        DeliveryState state;
    }

    mapping(uint256 => Delivery) public deliveries;

    event DeliveryVerified(uint256 indexed deliveryId, uint256 negotiationId);
    event DeliveryDisputed(uint256 indexed deliveryId, string reason);

    constructor(address _negotiationAddress, address _oracleAddress) Ownable(msg.sender) {
        negotiationContract = INegotiationContract(_negotiationAddress);
        oracle = IIoTOracle(_oracleAddress);
    }

    // Created by backend when a deal is locked
    function registerDelivery(uint256 deliveryId, uint256 negotiationId, string memory sensorType, uint256 requiredValue) public onlyOwner {
        deliveries[deliveryId] = Delivery({
            negotiationId: negotiationId,
            expectedSensorType: sensorType,
            requiredValue: requiredValue,
            state: DeliveryState.Pending
        });
    }

    // Anyone can trigger this verification via the Oracle (or backend cron job)
    function confirmDeliveryByOracle(uint256 deliveryId) public {
        Delivery storage del = deliveries[deliveryId];
        require(del.state == DeliveryState.Pending, "Not pending");

        // 1. Fetch from Oracle
        uint256 actualValue = oracle.getLatestReading(deliveryId, del.expectedSensorType);

        // 2. Validate Physical Delivery Tolerance (e.g., 95% received is acceptable for demo)
        uint256 toleranceThreshold = (del.requiredValue * 95) / 100;
        
        require(actualValue >= toleranceThreshold, "Delivery criteria not met by Oracle");

        // 3. Update State
        del.state = DeliveryState.Verified;

        // 4. Trigger Atomic Swap Release in Negotiation Contract
        negotiationContract.executeSwap(del.negotiationId);

        emit DeliveryVerified(deliveryId, del.negotiationId);
    }

    // Fallback button if oracle integration breaks during hackathon demo
    function manualConfirmDelivery(uint256 deliveryId) public onlyOwner {
         Delivery storage del = deliveries[deliveryId];
         require(del.state == DeliveryState.Pending, "Not pending");
         del.state = DeliveryState.Verified;
         negotiationContract.executeSwap(del.negotiationId);
         emit DeliveryVerified(deliveryId, del.negotiationId);
    }

    function raiseDispute(uint256 deliveryId, string memory reason) public {
        // Simple dispute logic: Stop automated processing
        deliveries[deliveryId].state = DeliveryState.Disputed;
        emit DeliveryDisputed(deliveryId, reason);
    }
}
