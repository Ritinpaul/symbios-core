// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract IoTOracle is Ownable {
    // Nested mapping: DeliveryID => SensorType => ReadingValue
    mapping(uint256 => mapping(string => uint256)) private readings;
    
    // Who is allowed to write sensor data? (e.g., specific hardware wallets or our Python Backend for demo)
    mapping(address => bool) public authorizedSensors;

    event ReadingUpdated(uint256 indexed deliveryId, string sensorType, uint256 value);

    constructor() Ownable(msg.sender) {
        // By default, deployer can submit simulator readings
        authorizedSensors[msg.sender] = true;
    }

    function authorizeSensor(address _sensor) public onlyOwner {
        authorizedSensors[_sensor] = true;
    }

    function revokeSensor(address _sensor) public onlyOwner {
        authorizedSensors[_sensor] = false;
    }

    // Backend Python simulation engine hits this endpoint to mock physical asset movement
    function submitReading(uint256 _deliveryId, string memory _sensorType, uint256 _value) public {
        require(authorizedSensors[msg.sender], "Unauthorized sensor network");
        readings[_deliveryId][_sensorType] = _value;
        emit ReadingUpdated(_deliveryId, _sensorType, _value);
    }

    function getLatestReading(uint256 _deliveryId, string memory _sensorType) public view returns (uint256) {
        return readings[_deliveryId][_sensorType];
    }
}
