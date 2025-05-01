// Dead Man's Switch Backend API
// This server provides endpoints for beneficiaries to check and claim funds

const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const { sapphire } = require('@oasisprotocol/sapphire-paratime');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Contract configuration
const contractAddress = "0x621936D3b5EC46C56A1b8841AF30667ac34a692A"; // Match your frontend
const contractABI = [ {
    "inputs": [
      {
        "internalType": "address",
        "name": "_verifierAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "beneficiary",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "BeneficiaryAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "inactivityPeriod",
        "type": "uint32"
      }
    ],
    "name": "ContractDeployed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "FundsDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "beneficiary",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "FundsReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "hashValue",
        "type": "uint256"
      }
    ],
    "name": "HashComputed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "HeartbeatReceived",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "valid",
        "type": "bool"
      }
    ],
    "name": "InactivityVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "valid",
        "type": "bool"
      }
    ],
    "name": "ProofVerified",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_beneficiary",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "addBeneficiary",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "beneficiaries",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "beneficiaryList",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "lastActive",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ownerAsUint",
        "type": "uint256"
      }
    ],
    "name": "computePoseidonHash",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "depositFunds",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLastActive",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getOwnerAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "heartbeat",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[2]",
        "name": "a",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "b",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2]",
        "name": "c",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2]",
        "name": "input",
        "type": "uint256[2]"
      }
    ],
    "name": "heartbeatWithProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "inactivityPeriod",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "_inactivityPeriod",
        "type": "uint32"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "triggerSwitch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[2]",
        "name": "a",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "b",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2]",
        "name": "c",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[3]",
        "name": "input",
        "type": "uint256[3]"
      }
    ],
    "name": "triggerWithProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "verifier",
    "outputs": [
      {
        "internalType": "contract Verifier",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "verifier2",
    "outputs": [
      {
        "internalType": "contract Groth16Verifier",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "verifyInactivity",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
  
];

// Provider setup with Sapphire integration
let provider;
let contract;

function initializeProvider() {
  // Connect to the blockchain - adjust RPC URL for your target network
  const baseProvider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'https://sapphire.oasis.io');
  
  // Wrap with Sapphire if needed
  try {
    provider = sapphire.wrap(baseProvider);
    console.log("Provider initialized with Sapphire wrapper");
  } catch (error) {
    console.warn("Sapphire wrapper unavailable, using standard provider:", error.message);
    provider = baseProvider;
  }
  
  // Initialize contract
  contract = new ethers.Contract(contractAddress, contractABI, provider);
  console.log("Contract initialized at:", contractAddress);
}

// Initialize on startup
initializeProvider();

// Monitoring service - check for inactivity periodically
const monitorInactivity = async () => {
  try {
    if (!contract) {
      console.warn("Contract not initialized, skipping inactivity check");
      return;
    }
    
    const lastActive = await contract.getLastActive();
    const inactivityPeriod = await contract.inactivityPeriod();
    const currentTime = Math.floor(Date.now() / 1000);
    
    const lastActiveTime = lastActive.toNumber ? lastActive.toNumber() : Number(lastActive);
    const period = inactivityPeriod.toNumber ? inactivityPeriod.toNumber() : Number(inactivityPeriod);
    
    const isInactive = (lastActiveTime + period) < currentTime;
    
    console.log(`Inactivity check: Last active ${new Date(lastActiveTime * 1000).toLocaleString()}`);
    console.log(`Status: ${isInactive ? 'INACTIVE' : 'ACTIVE'}, ${currentTime - lastActiveTime} seconds since last activity`);
    
    // Could implement notifications to beneficiaries here when inactive
    if (isInactive) {
      console.log("⚠️ Owner is inactive! Beneficiaries can claim funds.");
      // Send notifications to registered beneficiaries via email/SMS/etc.
    }
  } catch (error) {
    console.error("Error monitoring inactivity:", error);
  }
};

// Run monitor every hour
setInterval(monitorInactivity, 60 * 60 * 1000);
// Initial check on startup
setTimeout(monitorInactivity, 5000);

// API Endpoints

// Check if a beneficiary can claim funds
app.get('/api/can-claim/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }
    
    const isInactive = await contract.verifyInactivity();
    const beneficiaryAmount = await contract.beneficiaries(address);
    const ownerAddress = await contract.getOwnerAddress();
    
    return res.json({
      address,
      canClaim: isInactive && !beneficiaryAmount.isZero(),
      amount: ethers.utils.formatEther(beneficiaryAmount),
      isInactive,
      owner: ownerAddress
    });
  } catch (error) {
    console.error("Error checking claim eligibility:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Get current inactivity status
app.get('/api/status', async (req, res) => {
  try {
    const lastActive = await contract.getLastActive();
    const inactivityPeriod = await contract.inactivityPeriod();
    const owner = await contract.getOwnerAddress();
    const currentTime = Math.floor(Date.now() / 1000);
    
    const lastActiveTime = lastActive.toNumber ? lastActive.toNumber() : Number(lastActive);
    const period = inactivityPeriod.toNumber ? inactivityPeriod.toNumber() : Number(inactivityPeriod);
    
    const timeRemaining = (lastActiveTime + period) - currentTime;
    const isInactive = timeRemaining <= 0;
    
    return res.json({
      lastActive: lastActiveTime,
      lastActiveFormatted: new Date(lastActiveTime * 1000).toLocaleString(),
      inactivityPeriod: period,
      currentTime,
      timeRemaining,
      isInactive,
      owner
    });
  } catch (error) {
    console.error("Error getting contract status:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Claim funds for a beneficiary
// Note: In a real implementation, this would typically be done client-side
// with the user's wallet, but we're providing an API example
app.post('/api/claim', async (req, res) => {
  try {
    const { address, privateKey } = req.body;
    
    if (!address || !privateKey) {
      return res.status(400).json({ error: "Address and private key are required" });
    }
    
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }
    
    // SECURITY WARNING: Handling private keys server-side is not recommended
    // This is for demonstration purposes only
    // In production, transactions should be signed by the user client-side
    
    // Check if inactivity period has passed
    const isInactive = await contract.verifyInactivity();
    if (!isInactive) {
      return res.status(403).json({ error: "Owner is still active, cannot claim funds yet" });
    }
    
    // Check if the address is a beneficiary
    const beneficiaryAmount = await contract.beneficiaries(address);
    if (beneficiaryAmount.isZero()) {
      return res.status(403).json({ error: "Address is not a registered beneficiary" });
    }
    
    // Execute the claim transaction
    const wallet = new ethers.Wallet(privateKey, provider);
    const connectedContract = contract.connect(wallet);
    
    // Submit transaction
    const tx = await connectedContract.triggerSwitch();
    const receipt = await tx.wait();
    
    return res.json({
      success: true, 
      message: "Funds claimed successfully",
      txHash: receipt.transactionHash
    });
  } catch (error) {
    console.error("Error processing claim:", error);
    return res.status(500).json({ error: error.message });
  }
});

// List beneficiaries for an owner
// Note: This is a simplified example and may not work depending on your contract structure
app.get('/api/beneficiaries/:owner', async (req, res) => {
  try {
    const { owner } = req.params;
    
    if (!ethers.utils.isAddress(owner)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }
    
    const contractOwner = await contract.getOwnerAddress();
    if (contractOwner.toLowerCase() !== owner.toLowerCase()) {
      return res.status(403).json({ error: "Address is not the contract owner" });
    }
    
    // Note: This is simplified and assumes your contract has a way to list beneficiaries
    // You may need to adapt this to your specific contract structure
    const beneficiaries = [];
    let index = 0;
    
    try {
      // This is a basic approach - your contract might have a better way to list beneficiaries
      while (true) {
        const beneficiary = await contract.beneficiaryList(index);
        if (beneficiary === ethers.constants.AddressZero) break;
        
        const amount = await contract.beneficiaries(beneficiary);
        beneficiaries.push({
          address: beneficiary,
          amount: ethers.utils.formatEther(amount)
        });
        
        index++;
      }
    } catch (error) {
      // Expected when we reach the end of the list or if contract doesn't support listing
      console.log("Finished listing beneficiaries or structure unsupported");
    }
    
    return res.json({ 
      owner: contractOwner,
      beneficiaries
    });
  } catch (error) {
    console.error("Error listing beneficiaries:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dead Man's Switch backend server running on port ${PORT}`);
});