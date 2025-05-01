// SIMPLIFIED APPROACH FOR BENE.JS

//import { ethers } from "ethers";

// Helper function to safely access DOM elements
function safeDOM(selector, operation, ...args) {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return null;
  }
  
  if (operation === 'get') return element;
  if (operation === 'html') element.innerHTML = args[0];
  if (operation === 'text') element.textContent = args[0];
  if (operation === 'prop') element[args[0]] = args[1];
  if (operation === 'class') element.classList.toggle(args[0], args[1]);
  if (operation === 'event') element.addEventListener(args[0], args[1]);
  return element;
}

// Initialize beneficiary UI
export async function initBeneficiaryUI() {
    if (!window.walletConnected || !window.contract) {
        console.log("Wallet not connected or contract not initialized");
        return;
    }

    try {
        const signer = window.provider.getSigner();
        const userAddress = await signer.getAddress();

        let ownerAddress;
        try {
            ownerAddress = await window.contract.getOwnerAddress();
        } catch (e) {
            try {
                ownerAddress = await window.contract.owner();
            } catch (e) {
                console.error("Could not fetch owner address", e);
                updateStatus("Error loading contract info", "error");
                return;
            }
        }

        const isOwner = (userAddress.toLowerCase() === ownerAddress.toLowerCase());

        // Owner controls - only show if element exists
        const ownerControls = safeDOM('#ownerBeneficiaryControls', 'get');
        if (ownerControls) {
            ownerControls.classList.toggle('hidden', !isOwner);
        }

        // Only interact with Add Beneficiary button if it exists
        const addBenBtn = safeDOM('#addBeneficiaryBtn', 'get');
        if (addBenBtn) {
            addBenBtn.disabled = !isOwner;
        }

        // Check if current user is a beneficiary
        await checkIfBeneficiary(userAddress);
    } catch (error) {
        console.error("Error initializing beneficiary UI:", error);
        updateStatus("Failed to load beneficiary info", "error");
    }
}

// Simplified beneficiary check without UI updates
export async function checkIfBeneficiary(userAddress) {
    try {
        const [amount, isInactive] = await Promise.all([
            window.contract.getBeneficiaryAmount(userAddress),

            window.contract.verifyInactivity()
        ]);

        const amountEth = ethers.utils.formatEther(amount);
        console.log(`User ${userAddress} is a beneficiary with ${amountEth} ETH allocated`);
        console.log(`Contract is ${isInactive ? 'INACTIVE' : 'ACTIVE'}`);

        // Update status element if it exists
        const statusEl = safeDOM('#contractStatus', 'get');
        if (statusEl) {
            statusEl.textContent = isInactive ?
                "INACTIVE - Funds can be claimed" :
                "ACTIVE - Owner is still active";
            
            statusEl.title = isInactive ?
                "Contract is inactive and funds can be distributed" :
                "Owner has been active within the inactivity period";
        }

        // Update UI based on beneficiary status
        updateBeneficiaryUI(amount.gt(0), amountEth, isInactive);
    } catch (error) {
        console.error("Error checking beneficiary status:", error);
    }
}

// Update UI based on beneficiary status
function updateBeneficiaryUI(isBeneficiary, amount, canClaim) {
    // Get the trigger switch button if it exists
    const triggerBtn = safeDOM('#triggerSwitchBtn', 'get');
    
    if (triggerBtn) {
        // Only enable the button if user is a beneficiary and contract is inactive
        triggerBtn.disabled = !(isBeneficiary && canClaim);
        
        // Update button text based on status
        triggerBtn.textContent = isBeneficiary ? 
            `Claim ${amount} ETH` : 
            "Trigger Switch";
    }
    
    // Optional: Update a status message
    const statusMsg = safeDOM('#beneficiaryStatus', 'get');
    if (statusMsg) {
        if (isBeneficiary) {
            statusMsg.textContent = canClaim ? 
                `You can claim ${amount} ETH` : 
                `You are a beneficiary for ${amount} ETH (owner still active)`;
        } else {
            statusMsg.textContent = "You are not registered as a beneficiary";
        }
    }
}

// Trigger switch / claim funds
export async function triggerSwitch() {
    try {
        updateStatus("Preparing to trigger switch...", "info");

        const signer = window.provider.getSigner();
        const userAddress = await signer.getAddress();

        // Check if this user is a beneficiary
        const amount = await window.contract.getBeneficiaryAmount(userAddress);
        if (amount.gt(0)) {
            console.log(`User is a beneficiary with ${ethers.utils.formatEther(amount)} ETH allocated`);
        } else {
            console.log("User is not a beneficiary but is attempting to trigger switch");
        }

        // Check if contract is inactive
        const isInactive = await window.contract.verifyInactivity();
        if (!isInactive) {
            throw new Error("Contract is still active. Cannot trigger switch yet.");
        }

        updateStatus("Triggering switch...", "info");

        // Estimate gas with buffer for safety
        let gasEstimate;
        try {
            gasEstimate = await window.contract.estimateGas.triggerSwitch();
        } catch (gasError) {
            console.warn("Gas estimation failed, using default gas limit", gasError);
            gasEstimate = ethers.BigNumber.from(300000);
        }

        // Call the triggerSwitch function
        const tx = await window.contract.triggerSwitch({
            gasLimit: Math.ceil(gasEstimate.mul(120).div(100))
        });

        updateStatus(`Transaction submitted: ${tx.hash}`, "info");

        const receipt = await tx.wait();

        if (receipt.status === 1) {
            updateStatus("Switch triggered successfully!", "success");
            
            // Safely update UI elements if they exist
            safeDOM('#contractStatus', 'text', "TRIGGERED");
            
            // Update the trigger button if it exists
            const triggerBtn = safeDOM('#triggerSwitchBtn', 'get');
            if (triggerBtn) {
                triggerBtn.disabled = true;
                triggerBtn.textContent = "Switch Triggered";
            }
            
            // Add success message
            const infoArea = safeDOM('#contractInfo', 'get');
            if (infoArea) {
                const successMsg = document.createElement('p');
                successMsg.className = 'success-message';
                successMsg.innerHTML = '<span class="emoji">✅</span> Switch triggered successfully!';
                infoArea.appendChild(successMsg);
            }
        } else {
            throw new Error("Transaction failed");
        }
    } catch (error) {
        console.error("Detailed trigger error:", error);
        let errorMsg = error.message || "Unknown error";
        updateStatus(`Trigger failed: ${errorMsg}`, "error");
    }
}

// Add beneficiary function
export async function addBeneficiary() {
    const addressInput = safeDOM('#beneficiaryAddress', 'get');
    const amountInput = safeDOM('#beneficiaryAmount', 'get');
    
    if (!addressInput || !amountInput) {
        updateStatus("UI elements for adding beneficiaries not found", "error");
        return;
    }
    
    const address = addressInput.value;
    const amountEth = amountInput.value;

    if (!ethers.utils.isAddress(address)) {
        updateStatus("Invalid beneficiary address", "error");
        return;
    }

    const amount = parseFloat(amountEth);
    if (isNaN(amount) || amount <= 0) {
        updateStatus("Please enter a valid amount", "error");
        return;
    }

    try {
        const contractBalance = await window.provider.getBalance(window.contractAddress);
        const amountWei = ethers.utils.parseEther(amountEth);

        if (contractBalance.lt(amountWei)) {
            updateStatus(`Contract needs at least ${amountEth} ETH to cover this beneficiary`, "error");
            return;
        }

        updateStatus("Adding beneficiary...", "info");
        const tx = await window.contract.addBeneficiary(address, amountWei);
        const receipt = await monitorTransaction(tx);

        if (receipt.status === 1) {
            updateStatus(`Added beneficiary with ${amountEth} ETH`, "success");
            addressInput.value = "";
            amountInput.value = "";
        } else {
            updateStatus("Transaction reverted", "error");
        }
    } catch (error) {
        console.error("Error adding beneficiary:", error);
        updateStatus(`Failed: ${error.message}`, "error");
    }
}

// Update status helper
function updateStatus(message, type) {
    console.log(`[${type}] ${message}`);
    
    const statusEl = safeDOM('#statusMessages', 'get');
    if (!statusEl) return;
    
    const statusMsg = document.createElement('div');
    statusMsg.className = `status-message ${type}`;
    statusMsg.textContent = message;
    
    statusEl.appendChild(statusMsg);
    
    // Remove old messages if there are too many
    while (statusEl.children.length > 5) {
        statusEl.removeChild(statusEl.firstChild);
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

// Initialize on page load with error handling
document.addEventListener('DOMContentLoaded', function () {
    // Set up event listeners safely
    const addBenBtn = safeDOM('#addBeneficiaryBtn', 'get');
    if (addBenBtn) {
        addBenBtn.addEventListener('click', addBeneficiary);
    }
    
    const triggerBtn = safeDOM('#triggerSwitchBtn', 'get');
    if (triggerBtn) {
        triggerBtn.addEventListener('click', triggerSwitch);
    }
    
    // Listen for wallet connection
    document.addEventListener('walletConnected', initBeneficiaryUI);
    
    console.log("DOM fully loaded and event listeners applied");
});

// For backward compatibility - map claimFunds to triggerSwitch
export const claimFunds = triggerSwitch;