import shared from './connector.js';
import { initBeneficiaryUI } from './bene.js';

let abi = [   {
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
} ];
let lastHeartbeatTime = null;
let inactivityInterval = null;

// Utility to update status display
function updateStatus(message, type = "info") {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;

  statusEl.className = type;
  let emoji = { info: "✅", success: "🎉", warning: "⚠️", error: "❌" }[type] || "✅";
  statusEl.innerHTML = `<span class="emoji">${emoji}</span> ${message}`;
}

async function connectWallet() {
  if (!window.ethereum) {
    updateStatus("MetaMask not detected", "error");
    return;
  }

  try {
    updateStatus("Connecting wallet...", "info");

    const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
    shared.provider = (window.sapphire?.wrap) ? window.sapphire.wrap(ethersProvider) : ethersProvider;

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    shared.signer = shared.provider.getSigner();
    const walletAddress = await shared.signer.getAddress();

    document.getElementById("wallet").textContent = `Wallet: ${walletAddress}`;
    document.getElementById("walletPill").textContent = "🔌 Connected";
    document.getElementById("connect").textContent = "Connected";

    shared.walletConnected = true;

    shared.contract = new ethers.Contract(shared.contractAddress, abi, shared.signer);

    document.getElementById("heartbeatBtn").disabled = false;
    document.getElementById("verifyBtn").disabled = false;
    document.getElementById("depositBtn").disabled = false;

    await checkProofFiles();
    await updateContractInfo();
    startInactivityMonitoring();

    updateStatus("Wallet connected successfully", "success");

    // 🔄 Initialize beneficiary UI
    initBeneficiaryUI();
  } catch (err) {
    console.error("Error connecting wallet:", err);
    updateStatus(`Connection failed: ${err.message}`, "error");
  }
}

// Used by updateActivityDisplay
function formatTimespan(seconds) {
  if (seconds < 60) return `${seconds} sec`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr`;
  return `${Math.floor(seconds / 86400)} days`;
}

async function updateContractInfo() {
  try {
    const owner = await shared.contract.owner();
    document.getElementById("owner").textContent = `Owner: ${owner}`;

    const balance = await shared.provider.getBalance(shared.contractAddress);
    const eth = ethers.utils.formatEther(balance);
    document.getElementById("balance").textContent = `Contract Balance: ${eth} ROSE`;

    const user = await shared.signer.getAddress();
    const isOwner = owner.toLowerCase() === user.toLowerCase();

    document.getElementById("heartbeatBtn").disabled = !isOwner;
    document.getElementById("depositBtn").disabled = !isOwner;

    updateStatus(isOwner ? "Welcome back, owner!" : "Connected as user", isOwner ? "success" : "info");

    try {
      const lastActive = await shared.contract.getLastActive();
      const ts = (typeof lastActive === 'object' && lastActive.toNumber)
        ? lastActive.toNumber()
        : Number(lastActive);
      document.getElementById("lastPing").textContent = `Last Active: ${new Date(ts * 1000).toLocaleString()}`;
    } catch {
      document.getElementById("lastPing").textContent = `Last Active: Unknown`;
    }
  } catch (e) {
    console.error("Contract info error:", e);
  }
}

async function checkProofFiles() {
  try {
    const [proofRes, publicRes] = await Promise.all([
      fetch('./proof.json'),
      fetch('./public.json'),
    ]);

    const zkReady = proofRes.ok && publicRes.ok;
    document.getElementById("zkVerifyBtn").disabled = !zkReady;
    if (zkReady) updateStatus("ZK proof files ready", "info");
  } catch (err) {
    console.log("Proof file check failed", err);
    document.getElementById("zkVerifyBtn").disabled = true;
  }
}

function startInactivityMonitoring() {
  if (inactivityInterval) clearInterval(inactivityInterval);
  updateActivityDisplay();
  inactivityInterval = setInterval(updateActivityDisplay, 60000); // every 60s
}

async function getLastActiveTime() {
  try {
    const last = await shared.contract.getLastActive();
    return typeof last === 'object' && last.toNumber ? last.toNumber() : Number(last);
  } catch (e) {
    console.log("Fallback to now for last active time");
    return Math.floor(Date.now() / 1000);
  }
}

async function updateActivityDisplay() {
  if (!shared.walletConnected || !shared.contract) return;

  try {
    const lastActive = await getLastActiveTime();
    const inactivityPeriod = await shared.contract.inactivityPeriod();
    const seconds = typeof inactivityPeriod === 'object' && inactivityPeriod.toNumber
      ? inactivityPeriod.toNumber()
      : Number(inactivityPeriod);
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - lastActive;
    const remaining = seconds - elapsed;

    const el = document.getElementById("activityStatus");
    if (el) {
      if (remaining <= 0) {
        el.innerHTML = `<span class="inactive">❌ Owner is INACTIVE (${formatTimespan(elapsed)} since last activity)</span>`;
        el.classList.add("inactive");
        el.classList.remove("active");

        const inactive = await shared.contract.verifyInactivity();
        if (inactive) {
          document.getElementById("triggerBtn").disabled = false;
          document.getElementById("triggerBtn").classList.add("ready");
          updateStatus("Owner is inactive! You can trigger the switch.", "warning");
        }
      } else {
        el.innerHTML = `<span class="active">✅ Owner is ACTIVE (${formatTimespan(remaining)} until inactivity)</span>`;
        el.classList.add("active");
        el.classList.remove("inactive");
        document.getElementById("triggerBtn").disabled = true;
        document.getElementById("triggerBtn").classList.remove("ready");
      }
    }

    document.getElementById("lastPing").textContent = `Last Active: ${new Date(lastActive * 1000).toLocaleString()}`;
  } catch (e) {
    console.error("Activity display error", e);
  }
}

async function depositFunds() {
  if (!shared.walletConnected) {
    updateStatus("Connect your wallet first", "warning");
    return;
  }

  const input = document.getElementById("depositAmount").value;
  if (!input || isNaN(parseFloat(input)) || parseFloat(input) <= 0) {
    updateStatus("Invalid deposit amount", "error");
    return;
  }

  try {
    const wei = ethers.utils.parseEther(input);
    const tx = await shared.contract.depositFunds({ value: wei });
    await tx.wait();

    updateStatus(`Deposited ${input} ROSE`, "success");
    document.getElementById("depositAmount").value = "";
    await updateContractInfo();
  } catch (e) {
    console.error("Deposit error", e);
    updateStatus("Deposit failed", "error");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("connect").addEventListener("click", connectWallet);
  document.getElementById("heartbeatBtn").addEventListener("click", sendHeartbeat);
  document.getElementById("depositBtn").addEventListener("click", depositFunds);
  document.getElementById("verifyBtn").addEventListener("click", verifyInactivity);
});

// Basic heartbeat button
async function sendHeartbeat() {
  if (!shared.walletConnected) {
    updateStatus("Connect your wallet first", "warning");
    return;
  }

  try {
    const tx = await shared.contract.heartbeat();
    await tx.wait();
    lastHeartbeatTime = Math.floor(Date.now() / 1000);
    updateStatus("Heartbeat sent!", "success");
    await updateContractInfo();
  } catch (err) {
    console.error("Heartbeat error:", err);
    updateStatus("Heartbeat failed", "error");
  }
}

// Verifies inactivity on-chain
async function verifyInactivity() {
  if (!shared.walletConnected) {
    updateStatus("Connect your wallet first", "warning");
    return;
  }

  try {
    updateStatus("Verifying inactivity...", "info");
    const isInactive = await shared.contract.verifyInactivity();

    if (isInactive) {
      updateStatus("Owner is INACTIVE – you may trigger", "success");
      document.getElementById("triggerBtn").disabled = false;
      document.getElementById("triggerBtn").classList.add("ready");
    } else {
      updateStatus("Owner is still active", "warning");
    }
  } catch (err) {
    console.error("Inactivity verify error:", err);
    updateStatus("Inactivity check failed", "error");
  }
}
