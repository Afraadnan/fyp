// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "node_modules/@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./HeartbeatVerifier.sol";
import "./Groth16Verifier.sol";

contract PrivateSmartContract {
    Verifier public verifier;
    Groth16Verifier public verifier2;
    address public owner;
    bool private initialized;

    uint32 public inactivityPeriod; // in seconds
    bytes private lastActiveEncrypted;
    bytes32 private encryptionKey;
    bytes32 private nonce;

    mapping(address => bytes) private encryptedBeneficiaries;
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
        verifier = Verifier(_verifierAddress);
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
        if (encryptedBeneficiaries[_beneficiary].length == 0) {
            beneficiaryList.push(_beneficiary);
        }
        bytes memory encryptedAmount = Sapphire.encrypt(
            encryptionKey,
            nonce,
            abi.encode(_amount),
            abi.encode(owner, _beneficiary)
        );
        encryptedBeneficiaries[_beneficiary] = encryptedAmount;
        emit BeneficiaryAdded(_beneficiary, _amount);
    }

    function getBeneficiaryAmount(address _beneficiary) public view returns (uint256) {
        require(msg.sender == owner || msg.sender == _beneficiary, "Not authorized");

        bytes memory encrypted = encryptedBeneficiaries[_beneficiary];
        require(encrypted.length > 0, "No entry for this address");

        bytes memory decrypted = Sapphire.decrypt(
            encryptionKey,
            nonce,
            encrypted,
            abi.encode(owner, _beneficiary)
        );

        return abi.decode(decrypted, (uint256));
    }

    function depositFunds() external payable onlyOwner {
        require(msg.value > 0, "Must send ROSE");
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

    function computePoseidonHash(uint256 lastActive, uint256 ownerAsUint) external pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(lastActive, ownerAsUint))) % 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    }

    function triggerWithProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[3] calldata input
    ) external {
        bytes memory decrypted = Sapphire.decrypt(
            encryptionKey,
            nonce,
            lastActiveEncrypted,
            abi.encode(owner)
        );
        uint32 lastActive = abi.decode(decrypted, (uint32));

        emit HashComputed(input[0]);

        require(input[1] == inactivityPeriod, "Inactivity period mismatch");

        bool isValidProof = verifier2.verifyProof(a, b, c, input);
        require(isValidProof, "Invalid ZK proof");
        emit ProofVerified(true);

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

    function heartbeatWithProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[2] calldata input
    ) external onlyOwner {
        uint256 proofTimestamp = input[1];

        bool isValidProof = verifier.verifyProof(
            [a[0], a[1]],
            [[b[0][0], b[0][1]], [b[1][0], b[1][1]]],
            [c[0], c[1]],
            input
        );
        require(isValidProof, "Invalid ZK proof");
        emit ProofVerified(true);

        require(
            proofTimestamp >= block.timestamp - 300 && 
            proofTimestamp <= block.timestamp + 300,
            "Timestamp out of valid range"
        );

        lastActiveEncrypted = Sapphire.encrypt(
            encryptionKey,
            nonce,
            abi.encode(uint32(block.timestamp)),
            abi.encode(owner)
        );

        emit HeartbeatReceived(owner);
    }

    function _releaseFunds() private {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds available");

        for (uint256 i = 0; i < beneficiaryList.length; i++) {
            address beneficiary = beneficiaryList[i];
            uint256 amount = getBeneficiaryAmount(beneficiary);
            if (amount > 0 && balance >= amount) {
                payable(beneficiary).transfer(amount);
                emit FundsReleased(beneficiary, amount);
                balance -= amount;
                delete encryptedBeneficiaries[beneficiary];
            }
        }
    }

    function setGroth16Verifier(address _groth16VerifierAddress) external onlyOwner {
        verifier2 = Groth16Verifier(_groth16VerifierAddress);
    }
}
