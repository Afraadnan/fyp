// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "node_modules/@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
// Import Zero-Knowledge Verifiers
import "./HeartbeatVerifier.sol";
import "./Groth16Verifier.sol";

contract SmartContract {
 Verifier public verifier;           // ZK verifier for heartbeat (simple proofs)
 Groth16Verifier public verifier2;   // zk-SNARK verifier for trigger logic (Groth16 circuit)
    address public owner;
    bool private initialized;

    uint32 public inactivityPeriod;     // Duration after which owner is considered inactive
    bytes private lastActiveEncrypted;  // Encrypted timestamp of last activity
    bytes32 private encryptionKey;      // Symmetric encryption key (Sapphire-specific)
    bytes32 private nonce;              // Nonce for encryption

// Beneficiary logic
    mapping(address => uint256) public beneficiaries;
    address[] public beneficiaryList;

    
    // Event logs for tracing actions
    event ContractDeployed(address indexed owner, uint32 inactivityPeriod);
    event HeartbeatReceived(address indexed owner);
    event InactivityVerified(bool valid);
    event BeneficiaryAdded(address indexed beneficiary, uint256 amount);
    event FundsDeposited(address indexed sender, uint256 amount);
    event FundsReleased(address indexed beneficiary, uint256 amount);
    event ProofVerified(bool valid);
    event HashComputed(uint256 hashValue);

 // Ensures only contract owner can execute certain functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

// Contract constructor - initializes only the heartbeat verifier
    constructor(address _verifierAddress) {
        verifier = Verifier(_verifierAddress);
    }
// Initializes the contract with an inactivity timeout and generates a secure encryption key
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

// Owner updates their last active timestamp
    function heartbeat() external onlyOwner {
        lastActiveEncrypted = Sapphire.encrypt(
            encryptionKey,
            nonce,
            abi.encode(uint32(block.timestamp)),
            abi.encode(owner)
        );
        emit HeartbeatReceived(owner);
    }

 // Owner can add or update beneficiaries who will receive funds after trigger
    function addBeneficiary(address _beneficiary, uint256 _amount) external onlyOwner {
        require(_beneficiary != address(0), "Invalid address");
        require(_amount > 0, "Amount must be greater than 0");
        if (beneficiaries[_beneficiary] == 0) {
            beneficiaryList.push(_beneficiary);
        }
        beneficiaries[_beneficiary] = _amount;
        emit BeneficiaryAdded(_beneficiary, _amount);
    }

// Accept ROSE from owner to fund the switch
    function depositFunds() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
        emit FundsDeposited(msg.sender, msg.value);
    }

// Checks if current time has surpassed the inactivity threshold
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

    // Mock Poseidon hash logic (used for ZK input hash generation)
    function computePoseidonHash(uint256 lastActive, uint256 ownerAsUint) external pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(lastActive, ownerAsUint))) % 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    }

// ZK-triggered fund release logic (Groth16-based)
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
        bool isValidProof = verifier2.verifyProof(a, b, c, input);
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

// Fallback method for directly checking inactivity on-chain
    function triggerSwitch() external {
        require(verifyInactivity(), "Owner is still active");
        emit InactivityVerified(true);
        _releaseFunds();
    }

// ZK heartbeat with time-bound proof validation (uses HeartbeatVerifier)
function heartbeatWithProof(
    uint256[2] calldata a,
    uint256[2][2] calldata b,
    uint256[2] calldata c,
    uint256[2] calldata input // [0, currentTimestamp] - matches heart2.json
) external onlyOwner {
    // 1. Verify the proof using the verifier contract
    uint256[2] memory publicSignals;
    publicSignals[0] = input[0];
    publicSignals[1] = input[1];
    
    bool isValidProof = verifier.verifyProof(
        [a[0], a[1]],      // Explicit conversion
        [[b[0][0], b[0][1]], [b[1][0], b[1][1]]], // Explicit conversion
        [c[0], c[1]],      // Explicit conversion
        publicSignals
    );
    require(isValidProof, "Invalid ZK proof");
    emit ProofVerified(true);

    // 2. Verify the timestamp is valid (within 5 minutes of current time)
    uint256 proofTimestamp = input[1];
    require(
        proofTimestamp >= block.timestamp - 300 && 
        proofTimestamp <= block.timestamp + 300,
        "Timestamp out of valid range"
    );

    // 3. Update last active time (encrypted)
    lastActiveEncrypted = Sapphire.encrypt(
        encryptionKey,
        nonce,
        abi.encode(uint32(block.timestamp)),
        abi.encode(owner)
    );

    emit HeartbeatReceived(owner);
}

// Private function to distribute ROSE to beneficiaries upon successful trigger
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

// Setter for zk-SNARK verifier address (can be updated post-deployment)
    function setGroth16Verifier(address _groth16VerifierAddress) external onlyOwner {
        verifier2 = Groth16Verifier(_groth16VerifierAddress);
    }

}