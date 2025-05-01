const circomlibjs = require("circomlibjs");

async function calculatePoseidonHash() {
  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;

  const lastActive = BigInt("1713961200");
  const owner = BigInt("123456789");

  // Ensure inputs are within field limits
  const input = [lastActive, owner].map(F.e);

  const hash = poseidon(input);
  const hashStr = F.toString(hash);  // Output as decimal string

  console.log("Poseidon Hash:", hashStr);

  const inputJson = {
    hash: hashStr,
    inactivityPeriod: "86400",
    currentTime: "1714051200",
    lastActive: lastActive.toString(),
    owner: owner.toString()
  };

  console.log("\nFull input.json:");
  console.log(JSON.stringify(inputJson, null, 2));
}

calculatePoseidonHash().catch(console.error);
