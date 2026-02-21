const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy Symbiosis Token (SYM)
  const Token = await hre.ethers.getContractFactory("SymbiosisToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("SymbiosisToken deployed to:", tokenAddress);

  // 2. Deploy Negotiation Contract (needs Token Address)
  const Negotiation = await hre.ethers.getContractFactory("NegotiationContract");
  const negotiation = await Negotiation.deploy(tokenAddress);
  await negotiation.waitForDeployment();
  const negotiationAddress = await negotiation.getAddress();
  console.log("NegotiationContract deployed to:", negotiationAddress);

  // 3. Deploy IoT Oracle
  const Oracle = await hre.ethers.getContractFactory("IoTOracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("IoTOracle deployed to:", oracleAddress);

  // 4. Deploy Delivery Contract (needs Negotiation + Oracle)
  const Delivery = await hre.ethers.getContractFactory("DeliveryContract");
  const delivery = await Delivery.deploy(negotiationAddress, oracleAddress);
  await delivery.waitForDeployment();
  const deliveryAddress = await delivery.getAddress();
  console.log("DeliveryContract deployed to:", deliveryAddress);

  // 5. Deploy Reputation Contract (Soulbound Tokens)
  const Reputation = await hre.ethers.getContractFactory("ReputationContract");
  const reputation = await Reputation.deploy();
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log("ReputationContract deployed to:", reputationAddress);

  // Setup: Authorize DeliveryContract to update Reputation Scores
  await reputation.setAuthorizedUpdater(deliveryAddress, true);
  console.log("DeliveryContract authorized to update reputation scores");

  // Save all addresses
  const addresses = {
    SymbiosisToken: tokenAddress,
    NegotiationContract: negotiationAddress,
    IoTOracle: oracleAddress,
    DeliveryContract: deliveryAddress,
    ReputationContract: reputationAddress
  };

  const outPath = path.join(__dirname, "deployed-addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
