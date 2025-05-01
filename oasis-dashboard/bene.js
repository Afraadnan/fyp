import shared from './connector.js';

function updateStatus(message, type = "info") {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;
  statusEl.className = type;
  let emoji = { success: "🎉", warning: "⚠️", error: "❌", info: "✅" }[type] || "✅";
  statusEl.innerHTML = `<span class="emoji">${emoji}</span> ${message}`;
}

export async function initBeneficiaryUI() {
  console.log("Initializing beneficiary UI...");
  if (!shared.walletConnected || !shared.contract) {
    console.log("Wallet not connected or contract not initialized");
    return;
  }

  try {
    const signer = shared.provider.getSigner();
    const userAddress = await signer.getAddress();
    const owner = await shared.contract.owner();
    const isOwner = userAddress.toLowerCase() === owner.toLowerCase();

    document.getElementById('ownerBeneficiaryControls').classList.toggle('hidden', !isOwner);
    document.getElementById('beneficiaryClaimControls').classList.add('hidden');
    document.getElementById('addBeneficiaryBtn').disabled = !isOwner;

    if (isOwner) {
      await loadBeneficiaries();
    } else {
      await checkIfBeneficiary(userAddress);
    }
  } catch (error) {
    console.error("Error initializing beneficiary UI:", error);
    updateStatus("Failed to load beneficiary info", "error");
  }
}

// Same thing in other functions:
async function loadBeneficiaries() {
  const tableBody = document.querySelector("#beneficiaryTable tbody");
  const loadingEl = document.getElementById("loadingBeneficiaries");
  if (!tableBody || !loadingEl) return;

  try {
    const signer = shared.provider.getSigner();
    const user = await signer.getAddress();
    const owner = await shared.contract.owner();

    if (user.toLowerCase() !== owner.toLowerCase()) {
      loadingEl.textContent = "Only owner can view beneficiaries";
      return;
    }

    let index = 0;
    const beneficiaries = [];

    while (true) {
      try {
        const addr = await shared.contract.beneficiaryList(index);
        if (addr === ethers.constants.AddressZero) break;
        const amount = await shared.contract.beneficiaries(addr);
        beneficiaries.push({ address: addr, amount: ethers.utils.formatEther(amount) });
        index++;
      } catch {
        break;
      }
    }

    tableBody.innerHTML = "";
    beneficiaries.forEach(b => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${b.address}</td><td>${b.amount} ROSE</td>`;
      tableBody.appendChild(row);
    });

    loadingEl.classList.add("hidden");
    document.getElementById("beneficiaryTable").classList.remove("hidden");
  } catch (err) {
    console.error("Error loading beneficiaries", err);
    loadingEl.textContent = "Failed to load";
  }
}


export async function checkIfBeneficiary(userAddress) {
    try {
        const [amount, isInactive] = await Promise.all([
            shared.contract.beneficiaries(userAddress),
            shared.contract.verifyInactivity()
        ]);

        const amountEth = ethers.utils.formatEther(amount);
        const claimSection = document.getElementById("beneficiaryClaimControls");

        if (amount.gt(0)) {
            claimSection.classList.remove("hidden");
            document.getElementById("beneficiaryClaimAmount").textContent = amountEth;

            const statusEl = document.getElementById("contractStatus");
            statusEl.textContent = isInactive ?
                "INACTIVE - Funds can be claimed" :
                "ACTIVE - Owner is still active";

            document.getElementById("claimFundsBtn").disabled = !isInactive;

            statusEl.title = isInactive ?
                "Contract is inactive and funds can be distributed" :
                "Owner has been active within the inactivity period";
        } else {
            claimSection.classList.add("hidden");
        }
    } catch (error) {
        console.error("Error checking beneficiary status:", error);
    }
}
export async function addBeneficiary() {
    console.log("addBeneficiary function called");
    if (!shared.walletConnected || !shared.contract) {
        updateStatus("Please connect your wallet first", "warning");
        return;
    }

    const address = document.getElementById("beneficiaryAddress").value;
    const amountEth = document.getElementById("beneficiaryAmount").value;

    console.log("Adding beneficiary:", address, "Amount:", amountEth);

    // Validate inputs
    if (!ethers.utils.isAddress(address)) {
        updateStatus("Invalid beneficiary address", "error");
        return;
    }

    if (!amountEth || isNaN(parseFloat(amountEth)) || parseFloat(amountEth) <= 0) {
        updateStatus("Please enter a valid amount (greater than 0)", "error");
        return;
    }

    try {
        updateStatus("Adding beneficiary...", "info");
        
        // Convert amount to wei
        const amountWei = ethers.utils.parseEther(amountEth);
        
        // Get current user address
        const signer = shared.provider.getSigner();
        const userAddress = await shared.signer.getAddress();
        
        // Check if user is owner
        const owner = await shared.contract.owner();
        if (userAddress.toLowerCase() !== owner.toLowerCase()) {
            updateStatus("Only contract owner can add beneficiaries", "error");
            return;
        }

        // Estimate gas
        let gasEstimate;
        try {
            gasEstimate = await shared.contract.estimateGas.addBeneficiary(address, amountWei);
        } catch (estimateError) {
            console.warn("Gas estimation failed, using default", estimateError);
            gasEstimate = ethers.BigNumber.from(200000); // Default gas limit
        }

        // Send transaction with 20% gas buffer
        const tx = await shared.contract.addBeneficiary(address, amountWei, {
            gasLimit: gasEstimate.mul(120).div(100)
        });

        updateStatus("Transaction sent, waiting for confirmation...", "info");
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            updateStatus(`Successfully added beneficiary: ${address} with ${amountEth} ROSE`, "success");
            
            // Clear form fields
            document.getElementById("beneficiaryAddress").value = "";
            document.getElementById("beneficiaryAmount").value = "";
            
            // Refresh beneficiary list
            await loadBeneficiaries();
        } else {
            updateStatus("Transaction reverted", "error");
        }
    } catch (error) {
        console.error("Error adding beneficiary:", error);
        
        let errorMsg = "Failed to add beneficiary";
        if (error.code === 4001) {
            errorMsg = "Transaction rejected by user";
        } else if (error.data?.message) {
            errorMsg = error.data.message;
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        updateStatus(errorMsg, "error");
    }
}

export async function claimFunds() {
    try {
        updateStatus("Preparing to claim funds...", "info");

        const signer = shared.provider.getSigner();
        const userAddress = await shared.signer.getAddress();

        const [isInactive, amount, contractBalance] = await Promise.all([
            shared.contract.verifyInactivity(),
            shared.contract.beneficiaries(userAddress),
            shared.provider.getBalance(contract.address)
        ]);

        console.log("Claim pre-check:", {
            isInactive,
            userAddress,
            beneficiaryAmount: ethers.utils.formatEther(amount),
            contractBalance: ethers.utils.formatEther(contractBalance)
        });

        if (!isInactive) throw new Error("Contract is still active. Cannot claim funds yet.");
        if (amount.lte(0)) throw new Error("No funds allocated to this beneficiary");
        if (contractBalance.lt(amount)) throw new Error("Contract has insufficient funds");

        updateStatus("Claiming funds...", "info");

        let gasEstimate;
        try {
            gasEstimate = await shared.contract.estimateGas.triggerSwitch();
        } catch (gasError) {
            console.warn("Gas estimation failed, using default gas limit", gasError);
            gasEstimate = ethers.BigNumber.from(300000);
        }

        const tx = await shared.contract.triggerSwitch({
            gasLimit: Math.ceil(gasEstimate.mul(120).div(100))
        });

        updateStatus(`Transaction submitted: ${tx.hash}`, "info");

        const receipt = await tx.wait();

        if (receipt.status === 1) {
            updateStatus("Funds claimed successfully!", "success");
            document.getElementById("contractStatus").textContent = "CLAIMED";

            document.getElementById("beneficiaryInfo").innerHTML += `
                <p class="success-message">
                    <span class="emoji">✅</span> 
                    Your funds have been transferred to your wallet!
                </p>
            `;
        } else {
            throw new Error("Transaction failed");
        }
    } catch (error) {
        console.error("Detailed claim error:", error);
        let errorMsg = error.message || "Unknown error";

        if (errorMsg.includes("user rejected")) {
            errorMsg = "Transaction was rejected in your wallet";
        } else if (error.data && error.data.message) {
            errorMsg = error.data.message;
        } else if (error.error && error.error.message) {
            errorMsg = error.error.message;
        } else if (errorMsg.includes("Internal JSON-RPC error")) {
            try {
                const rpcError = JSON.parse(error.stack.split("Internal JSON-RPC error.")[1].trim());
                errorMsg = rpcError.message || "Contract execution failed";
            } catch (e) {
                errorMsg = "Contract execution failed";
            }
        }

        updateStatus(`Claim failed: ${errorMsg}`, "error");
    }
}

// Transaction monitoring helper
export async function monitorTransaction(tx) {
    updateStatus("Waiting for confirmation...", "info");
    try {
        const receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);
        return receipt;
    } catch (error) {
        console.error("Transaction failed:", {
            txHash: tx.hash,
            error
        });
        throw error;
    }
}

// Handle click on the add beneficiary button directly
function handleAddBeneficiaryClick() {
    console.log("Add beneficiary button clicked");
    addBeneficiary();
}
// Don't forget to bind click handlers on DOM load
document.addEventListener('DOMContentLoaded', function () {
  const addBtn = document.getElementById("addBeneficiaryBtn");
  if (addBtn) {
    addBtn.addEventListener('click', addBeneficiary);
  }
});
