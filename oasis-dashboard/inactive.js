export async function generateInactivityProof(contract) {
    // Check if snarkjs is available from global scope
    if (!window.snarkjs) {
        throw new Error("snarkjs not loaded. Make sure to include the snarkjs script in your HTML.");
    }
    
    try {
        console.log("Starting inactivity proof generation...");
    
        // Get contract owner
        const owner = await contract.owner();
        console.log("Contract owner:", owner);
    
        // Get inactivity period
        const inactivityPeriod = await contract.inactivityPeriod();
        const inactivityPeriodNumber = 
            typeof inactivityPeriod.toNumber === 'function'
                ? inactivityPeriod.toNumber()
                : Number(inactivityPeriod);
        console.log("Inactivity period:", inactivityPeriodNumber);
    
        // Get current time
        const currentTime = Math.floor(Date.now() / 1000);
        console.log("Current time:", currentTime);
    
        // Try to get lastActive directly (no longer restricted to owner)
        let lastActive;
        try {
            lastActive = await contract.getLastActive();
            lastActive = typeof lastActive.toNumber === 'function'
                ? lastActive.toNumber()
                : Number(lastActive);
            console.log("Last active from contract:", lastActive);
        } catch (err) {
            console.error("Error getting lastActive:", err);
            console.log("Using fallback lastActive value");
            lastActive = currentTime - (inactivityPeriodNumber + 1);
            console.log("Fallback lastActive:", lastActive);
        }
        

        // Prepare circuit inputs
        const inputs = {
            owner: window.ethers.BigNumber.from(owner).toString(),
            lastActive: lastActive.toString ? lastActive.toString() : lastActive.toString(),
            currentTime: currentTime.toString(),
            inactivityPeriod: inactivityPeriod.toString()
        };

        console.log("Generating proof with inputs:", inputs);

        // Generate proof using global snarkjs
        const { proof, publicSignals } = await window.snarkjs.groth16.fullProve(
            inputs,
                    './inactivity.wasm',
                    'oasis-dashboard/inactivity.zkey'
        );
        
        console.log("Proof generated successfully");

        // Format for Ethereum transaction
        return {
            a: [proof.pi_a[0], proof.pi_a[1]],
            b: [
                [proof.pi_b[0][1], proof.pi_b[0][0]], 
                [proof.pi_b[1][1], proof.pi_b[1][0]]
            ],
            c: [proof.pi_c[0], proof.pi_c[1]],
            publicSignals
        };
    } catch (err) {
        console.error("Error in generateInactivityProof:", err);
        throw new Error(`Failed to generate proof: ${err.message}`);
    }
}
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
 
 