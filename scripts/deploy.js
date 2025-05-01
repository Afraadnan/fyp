const hre = require("hardhat");

async function main() {
  const INACTIVITY_PERIOD = 3600; // 1 hour
  const GAS_LIMIT_BUFFER = 1.2;

  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ROSE");

  async function deployContract(name, args = [], options = {}) {
    try {
      console.log(`\nDeploying ${name}...`);
      const factory = await hre.ethers.getContractFactory(name);
      
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

  // Deploy verifiers
  let groth16Verifier, heartbeatVerifier;
  try {
    console.log("\n=========== DEPLOYING VERIFIERS ===========");
    groth16Verifier = await deployContract("Groth16Verifier");
    heartbeatVerifier = await deployContract("Verifier");
  } catch (error) {
    console.error("Failed to deploy verifiers. Aborting.");
    process.exit(1);
  }

  // Deploy main contracts
  let contract, contract2;
  try {
    console.log("\n=========== DEPLOYING MAIN CONTRACTS ===========");
    contract = await deployContract("SmartContract", [await heartbeatVerifier.getAddress()]);
    contract2 = await deployContract("PrivateSmartContract", [await heartbeatVerifier.getAddress()]);
  } catch (error) {
    console.error("Failed to deploy main contracts. Aborting.");
    process.exit(1);
  }

  // Initialize SmartContract
  try {
    console.log("\n=========== INITIALIZING SMARTCONTRACT ===========");
    // Check if already initialized
    let alreadyInitialized = false;
    try {
      const owner = await contract.owner();
      if (owner !== "0x0000000000000000000000000000000000000000") {
        console.log("Contract appears to be already initialized with owner:", owner);
        alreadyInitialized = true;
      }
    } catch (error) {
      console.log("Owner check failed, proceeding with initialization");
    }

    if (!alreadyInitialized) {
      // Initialize with high gas limit to avoid issues
      console.log("Initializing contract with inactivity period:", INACTIVITY_PERIOD);
      const tx = await contract.initialize(INACTIVITY_PERIOD, { gasLimit: 500000 });
      console.log("Initialization transaction hash:", tx.hash);
      await tx.wait();
      console.log("✅ Initialization complete");
    } else {
      console.log("Skipping initialization as contract is already initialized");
    }
  } catch (error) {
    console.error("Initialization failed:", error.message);
    process.exit(1);
  }

  // Initialize PrivateSmartContract
  try {
    console.log("\n=========== INITIALIZING PRIVATESMARTCONTRACT ===========");
    // Check if already initialized
    let alreadyInitialized = false;
    try {
      const owner = await contract2.owner();
      if (owner !== "0x0000000000000000000000000000000000000000") {
        console.log("PrivateSmartContract appears to be already initialized with owner:", owner);
        alreadyInitialized = true;
      }
    } catch (error) {
      console.log("Owner check failed for PrivateSmartContract, proceeding with initialization");
    }

    if (!alreadyInitialized) {
      // Initialize with high gas limit to avoid issues
      console.log("Initializing PrivateSmartContract with inactivity period:", INACTIVITY_PERIOD);
      const tx = await contract2.initialize(INACTIVITY_PERIOD, { gasLimit: 500000 });
      console.log("PrivateSmartContract initialization transaction hash:", tx.hash);
      await tx.wait();
      console.log("✅ PrivateSmartContract initialization complete");
    } else {
      console.log("Skipping initialization as PrivateSmartContract is already initialized");
    }
  } catch (error) {
    console.error("PrivateSmartContract initialization failed:", error.message);
    process.exit(1);
  }

  // Test contract state after initialization
  try {
    console.log("\n=========== VERIFYING CONTRACT STATE ===========");
    const owner = await contract.owner();
    console.log("Contract owner:", owner);
    const inactivityPeriod = await contract.inactivityPeriod();
    console.log("Inactivity period:", inactivityPeriod.toString());
    const verifier1 = await contract.verifier();
    console.log("Heartbeat verifier:", verifier1);
    
    try {
      const verifier2 = await contract.verifier2();
      console.log("Current Groth16 verifier:", verifier2);
    } catch (error) {
      console.log("Could not read verifier2 - may not be set yet");
    }
  } catch (error) {
    console.error("Contract state verification failed:", error.message);
  }

  // Try a hardcoded address approach for SmartContract
  try {
    console.log("\n=========== SETTING GROTH16 VERIFIER (APPROACH 1) ===========");
    const verifierAddress = await groth16Verifier.getAddress();
    console.log("Setting Groth16 verifier address to:", verifierAddress);
    
    // Try to set the verifier with high gas limit
    const tx = await contract.setGroth16Verifier(verifierAddress, { 
      gasLimit: 500000 
    });
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction status:", receipt.status);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Verify it was set
    const setVerifier = await contract.verifier2();
    console.log("Updated verifier2:", setVerifier);
    console.log("✅ Verifier set successfully for SmartContract");
  } catch (error) {
    console.error("Failed to set verifier for SmartContract:", error.message);
    
    // Try an alternative method if available
    try {
      console.log("\nAttempting alternative method to set verifier...");
      // You can implement an alternative approach here if needed
    } catch (altError) {
      console.error("Alternative method also failed:", altError.message);
    }
  }

  // Try approach for PrivateSmartContract - using a simpler method
  try {
    console.log("\n=========== SETTING GROTH16 VERIFIER FOR PRIVATESMARTCONTRACT ===========");
    const verifierAddress = await groth16Verifier.getAddress();
    console.log("Setting Groth16 verifier address for PrivateSmartContract to:", verifierAddress);
    
    try {
      // First verify that PrivateSmartContract was properly initialized by checking owner
      const privateContractOwner = await contract2.owner();
      console.log("PrivateSmartContract owner:", privateContractOwner);
      
      const tx = await contract2.setGroth16Verifier(verifierAddress, { 
        gasLimit: 500000 
      });
      console.log("Transaction hash:", tx.hash);
      await tx.wait();
      
      const setVerifier = await contract2.verifier2();
      console.log("Updated PrivateSmartContract verifier2:", setVerifier);
      console.log("✅ Verifier set successfully for PrivateSmartContract");
    } catch (err) {
      console.error("Detailed error:", err);
      throw new Error("Transaction to set verifier for PrivateSmartContract failed");
    }
  } catch (error) {
    console.error("Failed to set verifier for PrivateSmartContract:", error.message);
  }

  // Final verification
  console.log("\n=========== FINAL VERIFICATION ===========");
  try {
    console.log("SmartContract owner:", await contract.owner());
    console.log("SmartContract inactivity period:", await contract.inactivityPeriod());
    console.log("SmartContract heartbeat verifier:", await contract.verifier());
    try {
      console.log("SmartContract Groth16 verifier:", await contract.verifier2());
    } catch {
      console.log("Could not read SmartContract verifier2");
    }
    
    try {
      const privateContractOwner = await contract2.owner();
      console.log("PrivateSmartContract owner:", privateContractOwner);
      console.log("PrivateSmartContract inactivity period:", await contract2.inactivityPeriod());
      console.log("PrivateSmartContract heartbeat verifier:", await contract2.verifier());
      console.log("PrivateSmartContract Groth16 verifier:", await contract2.verifier2());
    } catch (err) {
      console.log("Could not read PrivateSmartContract data:", err.message);
    }
  } catch (error) {
    console.error("Final verification failed:", error.message);
  }

  console.log("\n✅ Deployment process completed");
  console.log("====================");
  console.log("SmartContract:           ", await contract.getAddress());
  console.log("PrivateSmartContract:    ", await contract2.getAddress());
  console.log("Heartbeat Verifier:      ", await heartbeatVerifier.getAddress());
  console.log("Groth16 Verifier:        ", await groth16Verifier.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed:", error.message);
    process.exit(1);
  });