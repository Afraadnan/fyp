const hre = require("hardhat");

async function main() {
  const [deployer, ...signers] = await hre.ethers.getSigners();
  
  // Use available signers as beneficiaries (minimum 1, up to 3)
  const beneficiaries = signers.slice(0, Math.min(signers.length, 3));
  
  console.log("👤 Deployer:", deployer.address);
  beneficiaries.forEach((beneficiary, i) => {
    console.log(`🎯 Beneficiary ${i+1}:`, beneficiary.address);
  });

  const DeadManVault = await hre.ethers.getContractFactory("DeadManVault2");
  const timeout = 60; // 10s for testing

  const vault = await DeadManVault.deploy(timeout);
  await vault.waitForDeployment();

  console.log("✅ Vault deployed at:", await vault.getAddress());
  console.log("⏱ Timeout set to", timeout, "seconds");

  // Add beneficiaries after deployment
  console.log("👥 Adding beneficiaries...");
  for (const beneficiary of beneficiaries) {
    await vault.addBeneficiary(beneficiary.address);
  }
  console.log(`✅ ${beneficiaries.length} beneficiaries added`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});