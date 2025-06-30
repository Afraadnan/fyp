const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Dead Man's Switch", function () {
  let deadMansSwitch, owner, beneficiary;
  const timeout = 60; // Timeout in seconds

  beforeEach(async function () {
    [owner, beneficiary] = await ethers.getSigners();

    const DeadMansSwitch = await ethers.getContractFactory("DeadManVault");
    deadMansSwitch = await DeadMansSwitch.deploy(beneficiary.address, timeout);
    await deadMansSwitch.waitForDeployment(); // For Ethers v6
  });

  it("should deploy the contract and set the correct initial values", async function () {
    const currentBeneficiary = await deadMansSwitch.beneficiary();
    const currentTimeout = await deadMansSwitch.timeout();
    const currentOwner = await deadMansSwitch.owner();

    expect(currentBeneficiary).to.equal(beneficiary.address);
    expect(currentTimeout).to.equal(timeout);
    expect(currentOwner).to.equal(owner.address);
  });

  it("should allow the owner to ping the contract", async function () {
    const tx = await deadMansSwitch.connect(owner).ping();
    await tx.wait();

    const lastPing = await deadMansSwitch.lastPing();
    const now = Math.floor(Date.now() / 1000);
    expect(Number(lastPing)).to.be.greaterThanOrEqual(now - 10);
  });

  it("should allow the beneficiary to claim after timeout", async function () {
    await deadMansSwitch.connect(owner).ping();

    // Simulate passage of time using Hardhat
    await ethers.provider.send("evm_increaseTime", [timeout + 1]);
    await ethers.provider.send("evm_mine");

    await deadMansSwitch.connect(beneficiary).trigger(); // Must trigger before claiming

    const tx = await deadMansSwitch.connect(beneficiary).claim();
    await tx.wait();

    expect(await deadMansSwitch.claimed()).to.be.true;
  });

  it("should reject claims before timeout", async function () {
    await deadMansSwitch.connect(owner).ping();
    await expect(
      deadMansSwitch.connect(beneficiary).claim()
    ).to.be.revertedWith("Not triggered yet");
  });

  it("should allow anyone to verify inactivity (with JS logic)", async function () {
    await deadMansSwitch.connect(owner).ping();

    // Simulate time passing on-chain
    await ethers.provider.send("evm_increaseTime", [timeout + 1]);
    await ethers.provider.send("evm_mine");

    // Simulated "off-chain" logic in JS
    const lastPing = Number(await deadMansSwitch.lastPing());
    const latestBlock = await ethers.provider.getBlock("latest");
    const now = latestBlock.timestamp;

    const shouldTrigger = now > lastPing + timeout;

    if (shouldTrigger) {
      await deadMansSwitch.connect(beneficiary).trigger();
    }

    const tx = await deadMansSwitch.connect(beneficiary).claim();
    await tx.wait();

    expect(await deadMansSwitch.claimed()).to.be.true;
  });
});
