const hre = require("hardhat");

async function main() {
  // Configuration
  const INACTIVITY_PERIOD = 86400; // 24 hours in seconds
  const GAS_LIMIT_BUFFER = 1.2; // 20% buffer

  // Get deployer info
  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deployment function with error handling
  async function deployContract(name, args = [], options = {}) {
    try {
      console.log(`\nDeploying ${name}...`);
      const factory = await hre.ethers.getContractFactory(name);
      
      // Estimate gas if possible
      let gasLimit;
      try {
        const deploymentGas = await factory.getDeployTransaction(...args).estimateGas();
        gasLimit = Math.floor(deploymentGas * GAS_LIMIT_BUFFER);
        console.log(`Estimated gas: ${deploymentGas}`);
        console.log(`Using gas limit: ${gasLimit}`);
      } catch (error) {
        console.warn(`Could not estimate gas: ${error.message}`);
        console.log("Using default gas estimation from Hardhat");
      }
      
      // Deploy with gas limit if available
      const deployOptions = gasLimit ? { gasLimit, ...options } : options;
      const contract = await factory.deploy(...args, deployOptions);
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      
      console.log(`${name} deployed at: ${address}`);
      return contract;
    } catch (error) {
      console.error(`Error deploying ${name}:`, error.message);
      throw error;
    }
  }

  // Deploy Verifier first
  let verifier;
  try {
    verifier = await deployContract("Groth16Verifier");
    console.log("Verifier address:", await verifier.getAddress());
  } catch (error) {
    console.error("Failed to deploy verifier. Aborting.");
    process.exit(1);
  }

  // Deploy Main Contract with verifier address
  let contract;
  try {
    // Pass the verifier address to the constructor
    const verifierAddress = await verifier.getAddress();
    contract = await deployContract("SmartContract2", [verifierAddress]);
  } catch (error) {
    console.error("Failed to deploy main contract. Aborting.");
    process.exit(1);
  }

  // Initialize Contract
  try {
    console.log("\nInitializing contract...");
    const initTx = await contract.initialize(INACTIVITY_PERIOD);
    await initTx.wait();
    
    // Verification
    console.log("\nVerifying deployment:");
    console.log("- Owner:", await contract.owner());
    console.log("- Inactivity Period:", await contract.inactivityPeriod(), "seconds");
    
    // Get the verifier address from the contract and verify it matches
    const contractVerifierAddress = await contract.verifier();
    const expectedVerifierAddress = await verifier.getAddress();
    console.log("- Verifier Address:", contractVerifierAddress);
    
    if (contractVerifierAddress.toLowerCase() !== expectedVerifierAddress.toLowerCase()) {
      console.warn("⚠️ Verifier address mismatch!");
      console.warn(`Contract shows: ${contractVerifierAddress}`);
      console.warn(`Expected: ${expectedVerifierAddress}`);
    } else {
      console.log("✅ Verifier address verified");
    }
    
    // Verify bytecode
    const code = await deployer.provider.getCode(await contract.getAddress());
    if (code === "0x") {
      throw new Error("Contract deployment failed - no bytecode");
    }
    console.log("✅ Bytecode verification passed");
  } catch (error) {
    console.error("Initialization failed:", error.message);
    process.exit(1);
  }

  // Final report
  console.log("\n✅ Deployment Complete");
  console.log("====================");
  console.log("SmartContract2:", await contract.getAddress());
  console.log("Groth16Verifier:", await verifier.getAddress());
  console.log("Owner:", await contract.owner());
  console.log("Inactivity Period:", await contract.inactivityPeriod(), "seconds");
  
  // Log helpful info for testing ZK proofs
  const lastActive = await contract.getLastActive().catch(() => "Error getting lastActive");
  const ownerAddress = await contract.getOwnerAddress();
  
  console.log("\nZK Proof Testing Info:");
  console.log("---------------------");
  console.log("Owner Address:", ownerAddress);
  console.log("Last Active Timestamp:", lastActive.toString());
  console.log(`Inactivity Period: ${INACTIVITY_PERIOD} seconds`);
}

// Execute and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed:", error.message);
    process.exit(1);
  });