// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "node_modules/@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./Groth16Verifier.sol";

contract SmartContract2 {
    Groth16Verifier public verifier;
    address public owner;
    bool private initialized;

    uint32 public inactivityPeriod; // in seconds
    bytes private lastActiveEncrypted;
    bytes32 private encryptionKey;
    bytes32 private nonce;

    mapping(address => uint256) public beneficiaries;
    address[] public beneficiaryList;

    event ContractDeployed(address indexed owner, uint32 inactivityPeriod);
    event HeartbeatReceived(address indexed owner);
    event InactivityVerified(bool valid);
    event BeneficiaryAdded(address indexed beneficiary, uint256 amount);
    event FundsDeposited(address indexed sender, uint256 amount);
    event FundsReleased(address indexed beneficiary, uint256 amount);
    event ProofVerified(bool valid);
    event HashComputed(uint256 hashValue);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(address _verifierAddress) {
        verifier = Groth16Verifier(_verifierAddress);
    }

    function initialize(uint32 _inactivityPeriod) external {
        require(!initialized, "Already initialized");
        owner = msg.sender;
        inactivityPeriod = _inactivityPeriod;

        encryptionKey = bytes32(Sapphire.randomBytes(32, "encryptionKey"));
        nonce = bytes32(Sapphire.randomBytes(32, "nonce"));

        lastActiveEncrypted = Sapphire.encrypt(
            encryptionKey,
            nonce,
            abi.encode(uint32(block.timestamp)),
            abi.encode(owner)
        );

        initialized = true;
        emit ContractDeployed(owner, _inactivityPeriod);
    }

    function heartbeat() external onlyOwner {
        lastActiveEncrypted = Sapphire.encrypt(
            encryptionKey,
            nonce,
            abi.encode(uint32(block.timestamp)),
            abi.encode(owner)
        );
        emit HeartbeatReceived(owner);
    }

    function addBeneficiary(address _beneficiary, uint256 _amount) external onlyOwner {
        require(_beneficiary != address(0), "Invalid address");
        require(_amount > 0, "Amount must be greater than 0");
        if (beneficiaries[_beneficiary] == 0) {
            beneficiaryList.push(_beneficiary);
        }
        beneficiaries[_beneficiary] = _amount;
        emit BeneficiaryAdded(_beneficiary, _amount);
    }

    function depositFunds() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
        emit FundsDeposited(msg.sender, msg.value);
    }

    function verifyInactivity() public view returns (bool) {
        uint32 currentTime = uint32(block.timestamp);
        uint32 inactiveThreshold = currentTime - inactivityPeriod;

        bytes memory decrypted = Sapphire.decrypt(
            encryptionKey,
            nonce,
            lastActiveEncrypted,
            abi.encode(owner)
        );

        uint32 lastActive = abi.decode(decrypted, (uint32));
        return lastActive < inactiveThreshold;
    }

    function getLastActive() public view returns (uint32) {
        bytes memory decrypted = Sapphire.decrypt(
            encryptionKey,
            nonce,
            lastActiveEncrypted,
            abi.encode(owner)
        );
        return abi.decode(decrypted, (uint32));
    }

    function getOwnerAddress() public view returns (address) {
        return owner;
    }

    // This is a mock function for testing, in production use a proper Poseidon implementation
    function computePoseidonHash(uint256 lastActive, uint256 ownerAsUint) external pure returns (uint256) {
        // Important: This should match your circom implementation of Poseidon
        // This is just a placeholder and won't match your actual circuit
        return uint256(keccak256(abi.encodePacked(lastActive, ownerAsUint))) % 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    }

    function triggerWithProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[3] calldata input // [hash, inactivityPeriod, currentTime]
    ) external {
        // 1. Decrypt last active timestamp
        bytes memory decrypted = Sapphire.decrypt(
            encryptionKey,
            nonce,
            lastActiveEncrypted,
            abi.encode(owner)
        );
        uint32 lastActive = abi.decode(decrypted, (uint32));

        // For debugging
        emit HashComputed(input[0]);

        // 2. Verify inputs against circuit requirements
        require(input[1] == inactivityPeriod, "Inactivity period mismatch");
        
        // 3. Verify the proof directly using the external verifier
        bool isValidProof = verifier.verifyProof(a, b, c, input);
        require(isValidProof, "Invalid ZK proof");
        emit ProofVerified(true);

        // 4. Validate time conditions
        require(input[2] <= block.timestamp, "Future timestamp");
        require(
            input[2] >= lastActive + inactivityPeriod,
            "Inactivity period not met"
        );

        _releaseFunds();
    }

    function triggerSwitch() external {
        require(verifyInactivity(), "Owner is still active");
        emit InactivityVerified(true);
        _releaseFunds();
    }

    function _releaseFunds() private {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds available");

        for (uint256 i = 0; i < beneficiaryList.length; i++) {
            address beneficiary = beneficiaryList[i];
            uint256 amount = beneficiaries[beneficiary];
            if (amount > 0 && balance >= amount) {
                payable(beneficiary).transfer(amount);
                emit FundsReleased(beneficiary, amount);
                balance -= amount;
            }
        }
    }
}