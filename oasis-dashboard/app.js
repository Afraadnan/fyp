let provider;
let signer;
let contract;
let walletConnected = false;
let inactivityInterval = null;
let lastHeartbeatTime = null;
let contractAddress = "0x9071eE8381ab7f69a3559b526f3016Aba56703A9";  // Replace with your actual contract address
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
async function checkProofFiles() {
    try {
        // Use fetch to check if proof file exists in the directory
        const response = await fetch('./proof.json');
        if (response.ok) {
            document.getElementById("zkVerifyBtn").disabled = false;
            updateStatus("ZK proof files detected! You can verify inactivity using zero-knowledge proofs.", "info");
            return true;
        } else {
            document.getElementById("zkVerifyBtn").disabled = true;
            return false;
        }
    } catch (error) {
        console.log("No proof files found:", error);
        document.getElementById("zkVerifyBtn").disabled = true;
        return false;
    }
}

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
      document.getElementById("addBeneficiaryBtn").disabled = false;
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
    document.getElementById("addBeneficiaryBtn").disabled = !isOwner;
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
    }
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

async function verifyInactivity() {
  if (!walletConnected) {
    updateStatus("Please connect your wallet first", "warning");
    return;
  }

  try {
    updateStatus("Verifying inactivity...", "info");
    const isInactive = await contract.verifyInactivity();
    
    if (isInactive) {
      updateStatus("✅ Owner is inactive! Contract can be triggered.", "success");
      document.getElementById("triggerBtn").disabled = false;
    } else {
      updateStatus("❌ Owner is still active.", "warning");
      document.getElementById("triggerBtn").disabled = true;
    }
    
    return isInactive;
  } catch (error) {
    console.error("Error verifying inactivity:", error);
    updateStatus(`Verification failed: ${error.message}`, "error");
    return false;
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
      // First verify inactivity again (security check)
      const isInactive = await contract.verifyInactivity();
      if (!isInactive) {
          updateStatus("Cannot trigger switch: Owner is still active", "error");
          return;
      }
      
      // Check if we have ZK proofs available
      updateStatus("Checking for ZK proof availability...", "info");
      let useZkProof = false;
      let proof = null;
      let publicInputs = null;
      
      try {
          const [proofRes, publicRes] = await Promise.all([
              fetch('./proof.json'),
              fetch('./public.json')
          ]);
          
          if (proofRes.ok && publicRes.ok) {
              proof = await proofRes.json();
              publicInputs = await publicRes.json();
              useZkProof = true;
              updateStatus("Using ZK proof for triggering switch...", "info");
          }
      } catch (error) {
          console.log("ZK proof files not available, using standard trigger");
          useZkProof = false;
      }
      
      let tx;
      if (useZkProof && proof && publicInputs) {
          // Format proof according to your contract's expected format
          // Based on your solidity contract's triggerWithProof function signature
          const a = [
              proof.pi_a[0],
              proof.pi_a[1]
          ];
          
          // Your pi_b is in reverse order compared to what Solidity expects
          const b = [
              [proof.pi_b[0][0], proof.pi_b[0][1]],
              [proof.pi_b[1][0], proof.pi_b[1][1]]
          ];
          
          const c = [
              proof.pi_c[0],
              proof.pi_c[1]
          ];
          
          const input = publicInputs;
          
          updateStatus("Triggering switch with ZK proof...", "info");
          tx = await contract.triggerWithProof(a, b, c, input);
      } else {
          updateStatus("Triggering switch with standard method...", "info");
          tx = await contract.triggerSwitch();
      }
      
      updateStatus("Transaction sent, waiting for confirmation...", "info");
      await tx.wait();
      
      updateStatus("🎉 Switch triggered! Funds have been distributed to beneficiaries.", "success");
      
      // Update contract info
      await updateContractInfo();
  } catch (error) {
      console.error("Error triggering switch:", error);
      updateStatus(`Failed to trigger switch: ${error.message}`, "error");
  }
}

async function addBeneficiary() {
    if (!walletConnected) {
        updateStatus("Please connect your wallet first", "warning");
        return;
    }

    const address = document.getElementById("beneficiaryAddress").value;
    const sharePercent = document.getElementById("beneficiaryShare").value;
    
    if (!ethers.utils.isAddress(address)) {
        updateStatus("Invalid beneficiary address", "error");
        return;
    }
    
    if (sharePercent <= 0 || sharePercent > 100) {
        updateStatus("Share must be between 1 and 100", "error");
        return;
    }

    try {
        // Convert percentage to actual amount
        // For example, if contract has 1 ETH and share is 50%, amount would be 0.5 ETH
        const contractBalance = await provider.getBalance(contractAddress);
        const amount = contractBalance.mul(ethers.BigNumber.from(sharePercent)).div(ethers.BigNumber.from(100));
        
        updateStatus("Adding beneficiary...", "info");
        const tx = await contract.addBeneficiary(address, amount);
        await tx.wait();
        
        updateStatus(`Beneficiary added successfully with ${sharePercent}% share!`, "success");
        
        // Clear input fields
        document.getElementById("beneficiaryAddress").value = "";
        document.getElementById("beneficiaryShare").value = "";
    } catch (error) {
        console.error("Error adding beneficiary:", error);
        updateStatus(`Failed to add beneficiary: ${error.message}`, "error");
    }
}

async function depositFunds() {
    if (!walletConnected) {
        updateStatus("Please connect your wallet first", "warning");
        return;
    }

    const amount = document.getElementById("depositAmount").value;
    
    if (isNaN(amount) || parseFloat(amount) <= 0) {
        updateStatus("Please enter a valid amount to deposit", "error");
        return;
    }

    try {
        updateStatus(`Depositing ${amount} ROSE...`, "info");
        const amountWei = ethers.utils.parseEther(amount);
        const tx = await contract.depositFunds({ value: amountWei });
        await tx.wait();
        
        updateStatus(`Successfully deposited ${amount} ROSE!`, "success");
        
        // Clear input field
        document.getElementById("depositAmount").value = "";
        
        // Update contract balance
        await updateContractInfo();
    } catch (error) {
        console.error("Error depositing funds:", error);
        updateStatus(`Failed to deposit funds: ${error.message}`, "error");
    }
}

function startInactivityMonitoring() {
  // Clear existing interval
  if (inactivityInterval) {
    clearInterval(inactivityInterval);
  }
  
  // Set up new interval with error handling
  inactivityInterval = setInterval(async () => {
    try {
      await updateActivityDisplay();
    } catch (error) {
      console.error("Monitoring error:", error);
      // Continue running but log errors
    }
  }, 10000); // Update every 10 seconds instead of 5
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
    // Get contract state - with error handling
    let inactivityPeriod;
    try {
      inactivityPeriod = await contract.inactivityPeriod();
      inactivityPeriod = typeof inactivityPeriod === 'object' && inactivityPeriod.toNumber ? 
        inactivityPeriod.toNumber() : Number(inactivityPeriod);
    } catch (error) {
      console.log("Could not get inactivity period:", error);
      inactivityPeriod = 86400; // Default to 24 hours
    }
    
    let isInactive = false;
    try {
      isInactive = await contract.verifyInactivity();
    } catch (error) {
      console.log("Could not verify inactivity:", error);
    }
    
    // Calculate times
    const now = Math.floor(Date.now() / 1000);
    
    // Get last active time with fallback
    let lastActive;
    try {
      lastActive = await getLastActiveTime();
    } catch (error) {
      console.log("Error getting last active, using fallback:", error);
      lastActive = lastHeartbeatTime || (now - Math.floor(inactivityPeriod / 2)); // Show as halfway through
    }
    
    const elapsed = now - lastActive;
    const remaining = Math.max(0, inactivityPeriod - elapsed);

    // Update UI safely
    try {
      const lastActiveElement = document.getElementById('lastActiveDisplay');
      if (lastActiveElement) {
        lastActiveElement.textContent = new Date(lastActive * 1000).toLocaleString();
      }
    } catch (e) {
      console.log("Could not update lastActiveDisplay");
    }
    
    try {
      const timeRemainingElement = document.getElementById('timeRemaining');
      if (timeRemainingElement) {
        timeRemainingElement.textContent = isInactive ? 
          "Ready to trigger" : formatTime(remaining);
      }
    } catch (e) {
      console.log("Could not update timeRemaining");
    }
    
    // Update progress bar
    try {
      updateProgressBar(elapsed, inactivityPeriod);
    } catch (e) {
      console.log("Could not update progress bar");
    }
    
  } catch (error) {
    console.error("Activity update error:", error);
  }
}

// Helper functions
function updateElementText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  } else {
    console.warn(`Element with id '${id}' not found in DOM`);
  }
}

function updateProgressBar(elapsed, period) {
  const progressBar = document.getElementById('inactivityProgress');
  if (progressBar) {
    const percent = Math.min(100, (elapsed / period) * 100);
    progressBar.value = percent;
    progressBar.style.backgroundColor = percent >= 100 ? '#f44336' : '#4CAF50';
  }
}

function formatTime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
  if (typeof window.ethereum !== 'undefined') {
    document.getElementById("connect").addEventListener("click", connectWallet);
    document.getElementById("zkVerifyBtn").addEventListener("click", verifyZKInactivity);
    updateStatus("Ready - Connect your wallet to begin", "info");
  } else {
    updateStatus("MetaMask is not installed. Please install it to use this app.", "error");
    document.getElementById("connect").disabled = true;
  }
});