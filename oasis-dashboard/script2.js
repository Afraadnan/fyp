let provider;
let signer;
let contract;
let walletConnected = false;
let inactivityInterval = null;
let lastHeartbeatTime = null;
let contractAddress = "0x048Fd327073AFB25DFb588a61d0AB6626e287775";  // Replace with your actual contract address
let abi = [
  {
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
    "inputs": [
      {
        "internalType": "address",
        "name": "_beneficiary",
        "type": "address"
      }
    ],
    "name": "getBeneficiaryAmount",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "_groth16VerifierAddress",
        "type": "address"
      }
    ],
    "name": "setGroth16Verifier",
    "outputs": [],
    "stateMutability": "nonpayable",
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

// Check if Sapphire is properly loaded
const hasSapphire = typeof window.sapphire !== 'undefined';
if (hasSapphire) {
  console.log("Sapphire SDK loaded successfully");
} else {
  console.warn("Sapphire SDK not detected, using standard Web3");
}

// Initialize a global event listener for MetaMask account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length === 0) {
            // User has disconnected their wallet
            resetConnection();
        } else {
            // User switched accounts
            connectWallet();
        }
    });
}

// Function to reset UI when wallet disconnects
function resetConnection() {
    walletConnected = false;
    document.getElementById("wallet").textContent = "Wallet: Not connected";
    document.getElementById("walletPill").textContent = "🔌 Not Connected";
    document.getElementById("owner").textContent = "Owner: Unknown";
    document.getElementById("balance").textContent = "Contract Balance: 0 ROSE";
    document.getElementById("lastPing").textContent = "Last Active: Unknown";
    
    // Disable buttons
    document.getElementById("heartbeatBtn").disabled = true;
    document.getElementById("verifyBtn").disabled = true;
    document.getElementById("zkVerifyBtn").disabled = true;
    document.getElementById("triggerBtn").disabled = true;
    document.getElementById("addBeneficiaryBtn").disabled = true;
    document.getElementById("depositBtn").disabled = true;

    updateStatus("Disconnected - Please connect your wallet", "warning");
    stopInactivityMonitoring();
}

// Helper function to update status display
function updateStatus(message, type = "info") {
    const statusEl = document.getElementById("status");
    if (!statusEl) return;
    
    // Reset all classes
    statusEl.classList.remove("info", "success", "warning", "error");
    
    // Add appropriate class
    statusEl.classList.add(type);
    
    // Add appropriate emoji
    let emoji = "✅"; // default
    if (type === "warning") emoji = "⚠️";
    if (type === "error") emoji = "❌";
    if (type === "success") emoji = "🎉";
    
    statusEl.innerHTML = `<span class="emoji">${emoji}</span> ${message}`;
}

// Helper function to check if proof files exist
function checkProofFiles() {
  return Promise.all([
      fetch('./proof.json'),
      fetch('./public.json'),
      fetch('./heart1.json'),
      fetch('./heart2.json')
  ]).then(([proofRes, publicRes, heart1Res, heart2Res]) => {
      document.getElementById("zkVerifyBtn").disabled = !(proofRes.ok && publicRes.ok);
      document.getElementById("zkHeartbeatBtn").disabled = !(heart1Res.ok && heart2Res.ok);
      
      if (proofRes.ok && publicRes.ok) {
          updateStatus("Inactivity proof files detected!", "info");
      }
      if (heart1Res.ok && heart2Res.ok) {
          updateStatus("Heartbeat proof files detected!", "info");
      }
      return true;
  }).catch(error => {
      console.log("Proof files check failed:", error);
      document.getElementById("zkVerifyBtn").disabled = true;
      document.getElementById("zkHeartbeatBtn").disabled = true;
      return false;
  });
}

// Add event listener in DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners to buttons
  document.getElementById("connect").addEventListener("click", connectWallet);
  document.getElementById("heartbeatBtn").addEventListener("click", sendHeartbeat);
  document.getElementById("verifyBtn").addEventListener("click", verifyInactivity);
  document.getElementById("zkVerifyBtn").addEventListener("click", verifyZKInactivity);
  document.getElementById("triggerBtn").addEventListener("click", triggerSwitch);
  //document.getElementById("addBeneficiaryBtn").addEventListener("click", addBeneficiary);
  document.getElementById("depositBtn").addEventListener("click", depositFunds);
  document.getElementById("zkHeartbeatBtn").addEventListener("click", sendZKHeartbeat);
  
  
  if (typeof window.ethereum !== 'undefined') {
    updateStatus("Ready - Connect your wallet to begin", "info");
  } else {
    updateStatus("MetaMask is not installed. Please install it to use this app.", "error");
    document.getElementById("connect").disabled = true;
  }
});

async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
      updateStatus("Please install MetaMask to use this app", "error");
      return;
  }

  try {
      updateStatus("Connecting wallet...", "info");
      
      // Get the provider
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Check if Sapphire wrap is available
      if (typeof window.sapphire !== 'undefined' && typeof window.sapphire.wrap === 'function') {
          provider = window.sapphire.wrap(ethersProvider);
          console.log("Using Sapphire wrapped provider");
      } else {
          provider = ethersProvider;
          console.log("Using standard provider");
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
          throw new Error("No accounts available");
      }
      
      signer = provider.getSigner();
      const walletAddress = await signer.getAddress();
      
      document.getElementById("wallet").textContent = `Wallet: ${walletAddress}`;
      document.getElementById("walletPill").textContent = "🔌 Connected";
      walletConnected = true;

      // Set up the contract instance
      contract = new ethers.Contract(contractAddress, abi, signer);

      // Enable buttons
      document.getElementById("heartbeatBtn").disabled = false;
      document.getElementById("verifyBtn").disabled = false;
      document.getElementById("triggerBtn").disabled = true; // Enable only after verification
      //document.getElementById("addBeneficiaryBtn").disabled = false;
      document.getElementById("depositBtn").disabled = false;
      document.getElementById("zkVerifyBtn").disabled = true; // Enable only after proof check

      // Check for ZK proof files
      await checkProofFiles();

      // Update contract information
      await updateContractInfo();
      
      // Start monitoring without depending on last active time
      startInactivityMonitoring();
      
      updateStatus("Wallet connected successfully", "success");
  } catch (error) {
      console.error("Error connecting wallet:", error.message || error);
      updateStatus(`Connection failed: ${error.message || "Unknown error"}`, "error");
  }
}

async function updateContractInfo() {
  try {
    // Update owner
    const owner = await contract.owner();
    document.getElementById("owner").textContent = `Owner: ${owner}`;
    
    // Update contract balance
    const balance = await provider.getBalance(contractAddress);
    const balanceInEth = ethers.utils.formatEther(balance);
    document.getElementById("balance").textContent = `Contract Balance: ${balanceInEth} ROSE`;
    
    // Check if current user is the owner
    const currentAddress = await signer.getAddress();
    const isOwner = currentAddress.toLowerCase() === owner.toLowerCase();
    
    // Adjust UI for owner vs non-owner
    document.getElementById("heartbeatBtn").disabled = !isOwner;
    //document.getElementById("addBeneficiaryBtn").disabled = !isOwner;
    document.getElementById("depositBtn").disabled = !isOwner;
    
    if (isOwner) {
      updateStatus("Welcome back, owner! You can send heartbeats and manage beneficiaries.", "success");
    } else {
      updateStatus("Connected. You can verify inactivity and trigger the switch if conditions are met.", "info");
    }

    // Try to get last active time with better error handling
    try {
      // Try direct method first
      let lastActiveTime;
      try {
        lastActiveTime = await contract.getLastActive();
        const lastActiveTimestamp = typeof lastActiveTime === 'object' && lastActiveTime.toNumber ? 
          lastActiveTime.toNumber() : Number(lastActiveTime);
        document.getElementById("lastPing").textContent = `Last Active: ${new Date(lastActiveTimestamp * 1000).toLocaleString()}`;
      } catch (err) {
        console.log("Direct last active time unavailable:", err);
        
        // Fallback to inactivity period calculation
        const inactivityPeriod = await contract.inactivityPeriod();
        const periodValue = typeof inactivityPeriod === 'object' && inactivityPeriod.toNumber ? 
          inactivityPeriod.toNumber() : Number(inactivityPeriod);
          
        // If we have a stored time, use it
        if (lastHeartbeatTime) {
          document.getElementById("lastPing").textContent = `Last Active: ${new Date(lastHeartbeatTime * 1000).toLocaleString()}`;
        } else {
          // Otherwise show as just now
          document.getElementById("lastPing").textContent = `Last Active: ${new Date().toLocaleString()}`;
          // Store current time as last heartbeat
          lastHeartbeatTime = Math.floor(Date.now() / 1000);
        }
        
      }
    } catch (err) {
      console.log("Could not determine last active time:", err);
      document.getElementById("lastPing").textContent = `Last Active: Unknown`;
    } await loadBeneficiaries();
  } catch (error) {
    console.error("Error updating contract info:", error);
  }
}

async function sendHeartbeat() {
  if (!walletConnected) {
      updateStatus("Please connect your wallet first", "warning");
      return;
  }

  try {
      updateStatus("Sending heartbeat...", "info");
      const tx = await contract.heartbeat();
      updateStatus("Heartbeat transaction sent, waiting for confirmation...", "info");
      
      await tx.wait();
    
      lastHeartbeatTime = Math.floor(Date.now() / 1000);
      updateActivityDisplay(); // Immediate update
      updateStatus("Heartbeat successfully recorded!", "success");
      
      // Update UI
      document.getElementById("lastPing").textContent = `Last Active: Just now`;
      await updateContractInfo();
  } catch (error) {
      console.error("Error sending heartbeat:", error);
      updateStatus(`Failed to send heartbeat: ${error.message}`, "error");
  }
}

// Missing function - Added verifyInactivity
async function verifyInactivity() {
  if (!walletConnected) {
      updateStatus("Please connect your wallet first", "warning");
      return;
  }

  try {
      updateStatus("Verifying inactivity status...", "info");
      const isInactive = await contract.verifyInactivity();
      
      if (isInactive) {
          updateStatus("✅ Owner is inactive! You can trigger the switch.", "success");
          document.getElementById("triggerBtn").disabled = false;
          document.getElementById("triggerBtn").classList.add("ready");
      } else {
          updateStatus("❌ Owner is still active. Cannot trigger switch yet.", "warning");
          document.getElementById("triggerBtn").disabled = true;
      }
      
      return isInactive;
  } catch (error) {
      console.error("Error verifying inactivity:", error);
      updateStatus(`Verification failed: ${error.message}`, "error");
      return false;
  }
}

async function sendZKHeartbeat() {
  if (!walletConnected) {
      updateStatus("Please connect your wallet first", "warning");
      return;
  }

  try {
      updateStatus("Loading ZK proof files...", "info");
      
      // Load both proof files
      const [heart1Res, heart2Res] = await Promise.all([
          fetch('./heart1.json'),
          fetch('./heart2.json')
      ]);

      if (!heart1Res.ok || !heart2Res.ok) {
          throw new Error("Missing heartbeat proof files");
      }

      const [proof, publicInputs] = await Promise.all([
          heart1Res.json(),
          heart2Res.json()
      ]);

      // Format proof for contract call
      const a = [proof.pi_a[0], proof.pi_a[1]];
      const b = [
          [proof.pi_b[0][1], proof.pi_b[0][0]], // Note: Swapped order to match verifier
          [proof.pi_b[1][1], proof.pi_b[1][0]]  // Note: Swapped order to match verifier
      ];
      const c = [proof.pi_c[0], proof.pi_c[1]];

      updateStatus("Sending ZK heartbeat...", "info");
      const tx = await contract.heartbeatWithProof(a, b, c, publicInputs);
      
      updateStatus("Transaction sent, waiting for confirmation...", "info");
      await tx.wait();

      lastHeartbeatTime = Math.floor(Date.now() / 1000);
      updateStatus("✅ ZK heartbeat accepted!", "success");
      document.getElementById("lastPing").textContent = "Last Active: Just now";
      
      // Update contract info
      await updateContractInfo();
  } catch (error) {
      console.error("ZK heartbeat failed:", error);
      updateStatus(`❌ ZK heartbeat failed: ${error.message}`, "error");
  }
}

async function verifyZKInactivity() {
  if (!walletConnected) {
    updateStatus("Please connect your wallet first", "warning");
    return;
  }

  try {
    updateStatus("Starting ZK verification...", "info");
    
    // 1. First verify inactivity on-chain
    updateStatus("Checking inactivity status...", "info");
    const isInactive = await contract.verifyInactivity();
    
    if (!isInactive) {
      updateStatus("❌ Owner is still active - ZK verification aborted", "error");
      document.getElementById("triggerBtn").disabled = true;
      return false;
    }

    // 2. Load proof files
    updateStatus("Loading ZK proof files...", "info");
    try {
      const [proofRes, publicRes] = await Promise.all([
        fetch('./proof.json'),
        fetch('./public.json')
      ]);

      if (!proofRes.ok || !publicRes.ok) {
        throw new Error("Required proof files are missing");
      }

      const proof = await proofRes.json();
      const publicInputs = await publicRes.json();

      // 3. Validate proof format - specific to your format
      if (!proof.pi_a || !proof.pi_b || !proof.pi_c || !Array.isArray(publicInputs)) {
        throw new Error("Invalid proof format");
      }

      // 4. Format the proof data for display
      const formattedProofForDisplay = {
        pi_a: proof.pi_a,
        pi_b: proof.pi_b,
        pi_c: proof.pi_c,
        public_inputs: publicInputs
      };

      // Create a human-readable timestamp from the public input
      const inactivityPeriod = publicInputs[1];
      const lastActiveTimestamp = publicInputs[2];
      const lastActiveDate = new Date(lastActiveTimestamp * 1000).toLocaleString();

      // Display the proof validation result
      document.getElementById("zkProofStatus").innerHTML = `
        <div class="proof-details">
          <span class="emoji">✅</span> <strong>ZK proof validated!</strong>
          <div>Last Active: ${lastActiveDate}</div>
          <div>Inactivity Period: ${inactivityPeriod} seconds (${inactivityPeriod/86400} days)</div>
          <details>
            <summary>Show technical proof details</summary>
            <pre>${JSON.stringify(formattedProofForDisplay, null, 2)}</pre>
          </details>
        </div>
      `;
      
      // Enable trigger button after successful verification
      document.getElementById("triggerBtn").disabled = false;
      document.getElementById("triggerBtn").classList.add("ready");
      
      updateStatus("✅ ZK proof verified successfully! You can now trigger the switch.", "success");
      return true;

    } catch (error) {
      console.error("Proof validation error:", error);
      updateStatus(`❌ ZK proof validation failed: ${error.message}`, "error");
      document.getElementById("triggerBtn").disabled = true;
      return false;
    }

  } catch (error) {
    console.error("ZK verification error:", error);
    updateStatus(`❌ Verification failed: ${error.message}`, "error");
    document.getElementById("triggerBtn").disabled = true;
    return false;
  }
}

async function getLastActiveTime() {
  try {
    // Try to get directly from contract if function exists
    try {
      const lastActive = await contract.getLastActive();
      if (lastActive) {
        return typeof lastActive === 'object' && lastActive.toNumber ? 
          lastActive.toNumber() : Number(lastActive);
      }
    } catch (directError) {
      console.log("Direct method unavailable, using fallback");
    }
    
    // Fallback: Estimate based on inactivity period
    const inactivityPeriod = await contract.inactivityPeriod();
    const periodValue = typeof inactivityPeriod === 'object' && inactivityPeriod.toNumber ? 
      inactivityPeriod.toNumber() : Number(inactivityPeriod);
    
    // If we have a stored heartbeat time, use that
    if (lastHeartbeatTime) {
      return lastHeartbeatTime;
    }
    
    // Final fallback: current time (simulates just active)
    return Math.floor(Date.now() / 1000);
    
  } catch (error) {
    console.error("Error getting last active time:", error);
    return Math.floor(Date.now() / 1000); // Default to current time
  }
}

async function triggerSwitch() {
  if (!walletConnected) {
      updateStatus("Please connect your wallet first", "warning");
      return;
  }

  try {
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Verify inactivity first
      const isInactive = await contract.verifyInactivity();
      if (!isInactive) {
          updateStatus("Cannot trigger: Owner is still active", "error");
          return;
      }

      // Check if caller is a beneficiary
      const amount = await contract.getBeneficiaryAmount(userAddress);
      
      if (beneficiaryAmount.gt(0)) {
          // Handle as beneficiary claim
          await claimFunds();
          return;
      }

      // Standard trigger flow
      updateStatus("Triggering switch...", "info");
      
      // Check for ZK proofs
      let useZkProof = false;
      let proofData = null;
      
      try {
          const [proofRes, publicRes] = await Promise.all([
              fetch('./proof.json'),
              fetch('./public.json')
          ]);
          
          if (proofRes.ok && publicRes.ok) {
              proofData = {
                  proof: await proofRes.json(),
                  publicInputs: await publicRes.json()
              };
              useZkProof = true;
          }
      } catch (e) {
          console.log("ZK proof files not available, using standard trigger");
      }

      let tx;
      if (useZkProof && proofData) {
          const { proof, publicInputs } = proofData;
          // Format proof for contract
          const a = [proof.pi_a[0], proof.pi_a[1]];
          const b = [
              [proof.pi_b[0][1], proof.pi_b[0][0]],
              [proof.pi_b[1][1], proof.pi_b[1][0]]
          ];
          const c = [proof.pi_c[0], proof.pi_c[1]];
          
          updateStatus("Using ZK proof to trigger...", "info");
          tx = await contract.triggerWithProof(a, b, c, publicInputs);
      } else {
          tx = await contract.triggerSwitch();
      }

      const receipt = await monitorTransaction(tx);
      
      if (receipt.status === 1) {
          updateStatus("Switch triggered successfully!", "success");
          await updateContractInfo();
      } else {
          updateStatus("Trigger transaction reverted", "error");
      }
  } catch (error) {
      console.error("Trigger error:", {
          error,
          message: error.message,
          data: error.data
      });
      updateStatus(`Trigger failed: ${error.message}`, "error");
  }
}

// Fix for loadBeneficiaries function to ensure it's properly called
async function loadBeneficiaries() {
  try {
      // Get owner address
      const ownerAddress = await contract.getOwnerAddress().catch(() => contract.owner());
      
      // Check if we have the required elements
      const loadingElement = document.getElementById("loadingBeneficiaries");
      const tableElement = document.getElementById("beneficiaryTable");
      
      if (!loadingElement || !tableElement) {
          console.warn("Missing UI elements for beneficiary display");
          return;
      }

      loadingElement.textContent = "Loading beneficiaries...";
      tableElement.classList.add("hidden");
      
      const beneficiaries = [];
      let index = 0;
      
      // Loop through beneficiaryList (max 100 for safety)
      while (index < 100) {
          try {
              const beneficiaryAddr = await contract.beneficiaryList(index);
              if (beneficiaryAddr === ethers.constants.AddressZero) break; // Exit if no more beneficiaries
              
              const amount = await contract.beneficiaries(beneficiaryAddr);
              beneficiaries.push({
                  address: beneficiaryAddr,
                  amount: ethers.utils.formatEther(amount)
              });
              index++;
          } catch (e) {
              console.log(`Error at index ${index}:`, e.message);
              break; // Exit on error
          }
      }

      // Update UI
      const tableBody = tableElement.querySelector("tbody");
      if (!tableBody) {
          console.warn("Missing table body element");
          return;
      }
      
      tableBody.innerHTML = "";
      
      if (beneficiaries.length > 0) {
          beneficiaries.forEach(beneficiary => {
              const row = document.createElement("tr");
              const addrCell = document.createElement("td");
              addrCell.textContent = `${beneficiary.address.substring(0, 6)}...${beneficiary.address.substring(38)}`;
              addrCell.title = beneficiary.address;
              
              const amountCell = document.createElement("td");
              amountCell.textContent = `${beneficiary.amount} ROSE`;
              
              row.appendChild(addrCell);
              row.appendChild(amountCell);
              tableBody.appendChild(row);
          });
          
          loadingElement.classList.add("hidden");
          tableElement.classList.remove("hidden");
          
          console.log(`Loaded ${beneficiaries.length} beneficiaries`);
      } else {
          loadingElement.textContent = "No beneficiaries found";
      }
  } catch (error) {
      console.error("Error loading beneficiaries:", error);
      const loadingElement = document.getElementById("loadingBeneficiaries");
      if (loadingElement) {
          loadingElement.textContent = "Failed to load beneficiaries";
      }
  }
}

// Make sure this gets called at the right time in updateContractInfo
// Place this at the end of updateContractInfo() function:
/*

*/

  
  async function depositFunds() {
    if (!walletConnected) {
        updateStatus("Please connect your wallet first", "warning");
        return;
    }
  
    const amount = document.getElementById("depositAmount").value;
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        updateStatus("Please enter a valid amount", "error");
        return;
    }
  
    try {
        const amountInWei = ethers.utils.parseEther(amount);
        
        updateStatus(`Depositing ${amount} ROSE to contract...`, "info");
        const tx = await contract.depositFunds({ value: amountInWei });
        
        updateStatus("Transaction sent, waiting for confirmation...", "info");
        await tx.wait();
        
        updateStatus(`Successfully deposited ${amount} ROSE to the contract!`, "success");
        
        // Clear input field
        document.getElementById("depositAmount").value = "";
        
        // Update contract info
        await updateContractInfo();
    } catch (error) {
        console.error("Error depositing funds:", error);
        updateStatus(`Failed to deposit funds: ${error.message || "Unknown error"}`, "error");
    }
  }
  
  function startInactivityMonitoring() {
    if (inactivityInterval) {
      clearInterval(inactivityInterval);
    }
    
    // Update display immediately
    updateActivityDisplay();
    
    // Then set interval to update every minute
    inactivityInterval = setInterval(updateActivityDisplay, 60 * 1000);
  }
  
  function stopInactivityMonitoring() {
    if (inactivityInterval) {
      clearInterval(inactivityInterval);
      inactivityInterval = null;
    }
  }
  
  async function updateActivityDisplay() {
    if (!walletConnected || !contract) return;
    
    try {
      // Get the last active time
      const lastActiveTime = await getLastActiveTime();
      
      // Get inactivity period
      const inactivityPeriod = await contract.inactivityPeriod();
      const periodInSeconds = typeof inactivityPeriod === 'object' && inactivityPeriod.toNumber ? 
        inactivityPeriod.toNumber() : Number(inactivityPeriod);
      
      // Current time
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Time elapsed since last activity
      const elapsedTime = currentTime - lastActiveTime;
      
      // Time remaining until inactivity triggers
      const remainingTime = periodInSeconds - elapsedTime;
      
      // Update display element
      const activityEl = document.getElementById('activityStatus');
      if (activityEl) {
        if (remainingTime <= 0) {
          activityEl.innerHTML = `<span class="inactive">❌ Owner is INACTIVE (${formatTimespan(elapsedTime)} since last activity)</span>`;
          activityEl.classList.add('inactive');
          activityEl.classList.remove('active');
          
          // Auto-verify inactivity
          const isInactive = await contract.verifyInactivity();
          if (isInactive) {
            document.getElementById("triggerBtn").disabled = false;
            document.getElementById("triggerBtn").classList.add("ready");
            updateStatus("Owner is inactive! You can trigger the switch.", "warning");
          }
        } else {
          activityEl.innerHTML = `<span class="active">✅ Owner is ACTIVE (${formatTimespan(remainingTime)} until inactivity triggers)</span>`;
          activityEl.classList.add('active');
          activityEl.classList.remove('inactive');
          document.getElementById("triggerBtn").disabled = true;
          document.getElementById("triggerBtn").classList.remove("ready");
        }
      }
      
      // Update last ping display
      document.getElementById("lastPing").textContent = `Last Active: ${new Date(lastActiveTime * 1000).toLocaleString()}`;
      
    } catch (error) {
      console.error("Error updating activity display:", error);
    }
  }
  
  // Helper function to format timespan in a human-readable way
  function formatTimespan(seconds) {
    if (seconds < 60) {
      return `${seconds} sec`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} min ${seconds % 60} sec`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours} hr ${mins} min`;
    } else {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      return `${days} days ${hours} hr`;
    }
  } 