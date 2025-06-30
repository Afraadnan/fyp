const hre = require("hardhat");

async function main() {
  const VAULT_ADDRESS = "0xb255bF5BB649540449D60367aB300fb29F44A0ba"; 
  const beneficiaries = [
    "0x8851e63Eb101BeF4eBecD2294e598bD03388599a", 
   
  ];

  const vault = await hre.ethers.getContractAt("DeadManVault2", VAULT_ADDRESS);
  
  for (const addr of beneficiaries) {
    if (addr && addr.length === 42) {
      const tx = await vault.addBeneficiary(addr);
      await tx.wait();
      console.log(`✅ Added beneficiary: ${addr}`);
    }
  }
}

main().catch(console.error);