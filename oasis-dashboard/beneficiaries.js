// Dead Man's Switch Backend API - Improved Version
import express from 'express';
const app = express();
import cors from 'cors';
import ethers from 'ethers';
const { providers, Contract, Wallet, utils, constants } = ethers;

// Enable CORS for API requests
app.use(cors());
app.use(express.json());

// Replace with your actual deployed contract address
const contractAddress = "0x621936D3b5EC46C56A1b8841AF30667ac34a692A";

// ✅ ABI from your Solidity contract
const contractABI = [
  {
    inputs: [],
    name: "getLastActive",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "inactivityPeriod",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getOwnerAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "verifyInactivity",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "heartbeat",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "triggerSwitch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "beneficiaries",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "beneficiaryList",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
];

// 🌐 Provider and Contract Initialization
let provider;
let contract;
let isContractReady = false;

export async function initializeProvider() {
    const rpcUrls = [
      process.env.RPC_URL,
      "https://testnet.sapphire.oasis.dev",
      "https://sapphire.oasis.io",
      "https://sapphire.oasis.dev"
    ].filter(Boolean);
  
    for (const rpcUrl of rpcUrls) {
      try {
        const baseProvider = new providers.JsonRpcProvider(rpcUrl);
        await baseProvider.getNetwork();  // Just test the connection
        provider = baseProvider;  // ✅ Don't wrap it
        contract = new Contract(contractAddress, contractABI, provider);
        
        const code = await provider.getCode(contractAddress);
        if (code === "0x" || code === "0x0") throw new Error("Contract not deployed");
  
        isContractReady = true;
        console.log(`Connected to ${rpcUrl}`);
        break;
      } catch (err) {
        console.warn(`RPC failed: ${rpcUrl}`, err.message);
      }
    }
  
    if (!isContractReady) console.error("❌ Could not connect to any RPC.");
}

// Initialize provider on startup
initializeProvider();

// 🩺 Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    server: 'up',
    contractReady: isContractReady,
    contractAddress
  });
});

// 📡 Check if address can claim funds
app.get('/api/can-claim/:address', async (req, res) => {
  const address = req.params.address;

  if (!utils.isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  if (!isContractReady) {
    return res.status(503).json({ error: "Contract not ready" });
  }

  try {
    const [isInactive, amount] = await Promise.all([
      contract.verifyInactivity(),
      contract.beneficiaries(address)
    ]);

    res.json({
      address,
      isInactive,
      canClaim: isInactive && amount.gt(0),
      amount: utils.formatEther(amount)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⏱️ Status info
app.get('/api/status', async (_, res) => {
  if (!isContractReady) return res.status(503).json({ error: "Contract not ready" });

  try {
    const [lastActive, period, isInactive, owner] = await Promise.all([
      contract.getLastActive(),
      contract.inactivityPeriod(),
      contract.verifyInactivity(),
      contract.getOwnerAddress().catch(() => contract.owner())
    ]);

    const now = Math.floor(Date.now() / 1000);
    const remaining = (lastActive.toNumber() + period.toNumber()) - now;

    res.json({
      lastActive: lastActive.toNumber(),
      lastActiveFormatted: new Date(lastActive.toNumber() * 1000).toLocaleString(),
      inactivityPeriod: period.toNumber(),
      currentTime: now,
      timeRemaining: remaining,
      isInactive,
      owner
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 💸 Claim funds (requires private key - for demo only!)
app.post('/api/claim', async (req, res) => {
  const { address, privateKey } = req.body;

  if (!utils.isAddress(address) || !privateKey) {
    return res.status(400).json({ error: "Address and privateKey required" });
  }

  if (!isContractReady) return res.status(503).json({ error: "Contract not ready" });

  try {
    const [inactive, amount] = await Promise.all([
      contract.verifyInactivity(),
      contract.beneficiaries(address)
    ]);

    if (!inactive || amount.isZero()) {
      return res.status(403).json({ error: "Cannot claim now" });
    }

    const wallet = new Wallet(privateKey, provider);
    const connected = contract.connect(wallet);

    const gas = await connected.estimateGas.triggerSwitch();
    const gasPrice = await provider.getGasPrice();

    const tx = await connected.triggerSwitch({
      gasLimit: gas.mul(12).div(10),
      gasPrice
    });

    const receipt = await tx.wait();
    res.json({ success: true, txHash: receipt.transactionHash });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ❤️ Heartbeat from owner
app.post('/api/heartbeat', async (req, res) => {
  const { privateKey } = req.body;
  if (!privateKey) return res.status(400).json({ error: "Private key required" });

  try {
    const wallet = new Wallet(privateKey, provider);
    const connected = contract.connect(wallet);

    const contractOwner = await contract.getOwnerAddress().catch(() => contract.owner());
    if (wallet.address.toLowerCase() !== contractOwner.toLowerCase()) {
      return res.status(403).json({ error: "Only owner can send heartbeat" });
    }

    const gas = await connected.estimateGas.heartbeat();
    const gasPrice = await provider.getGasPrice();

    const tx = await connected.heartbeat({ gasLimit: gas.mul(12).div(10), gasPrice });
    const receipt = await tx.wait();

    res.json({ success: true, txHash: receipt.transactionHash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 👥 List all beneficiaries
app.get('/api/beneficiaries/:owner', async (req, res) => {
  const owner = req.params.owner;
  if (!utils.isAddress(owner)) return res.status(400).json({ error: "Invalid owner address" });

  try {
    const contractOwner = await contract.getOwnerAddress().catch(() => contract.owner());
    if (owner.toLowerCase() !== contractOwner.toLowerCase()) {
      return res.status(403).json({ error: "Not contract owner" });
    }

    const beneficiaries = [];
    for (let i = 0; i < 100; i++) {
      try {
        const addr = await contract.beneficiaryList(i);
        if (addr === constants.AddressZero) break;

        const amount = await contract.beneficiaries(addr);
        beneficiaries.push({ address: addr, amount: utils.formatEther(amount) });
      } catch (err) {
        break;
      }
    }

    res.json({ owner: contractOwner, beneficiaries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});