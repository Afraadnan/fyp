// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Dead Man's Vault with Multiple Beneficiaries
 * @dev A contract that releases funds to designated beneficiaries if the owner fails to check in
 */

contract DeadManVault2 {
    address public owner;  //Address of the contract owner
    uint256 public timeout;
    uint256 public lastPingTime;   
    bool public triggered;   // Flag indicating if the contract has been triggered     
    bool public claimed; // Flag to prevent repeated claims once triggered
    
    // Mapping to track all registered beneficiaries
    mapping(address => bool) public beneficiaries;
    // Array to keep track of all beneficiary addresses
    address[] public beneficiaryList;
    
    // Events
    event Pinged(address indexed owner, uint256 timestamp);
    event Triggered(uint256 timestamp);
    event FundsClaimed(address indexed beneficiary, uint256 amount);
    event BeneficiaryAdded(address indexed beneficiary);
    event BeneficiaryRemoved(address indexed beneficiary);
    
    constructor(uint256 _timeout) {
        owner = msg.sender;
        timeout = _timeout;
        lastPingTime = block.timestamp;
        claimed = false;
        triggered = false;
    }
    
// Restricts function usage to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    

// Ensures function can only run before the contract is triggered
    modifier notTriggered() {
        require(!triggered, "Switch already triggered");
        _;
    }
    
// Restricts access to registered beneficiaries only
    modifier onlyBeneficiary() {
        require(beneficiaries[msg.sender], "Only registered beneficiaries can call this function");
        _;
    }

 // -------------------------------
    // Heartbeat Mechanism
    // -------------------------------

    /**
     * @dev Owner sends heartbeat (ping) to prove they're alive
     */
    
    function ping() external onlyOwner notTriggered {
        lastPingTime = block.timestamp;
        emit Pinged(owner, block.timestamp);
    }
    
 /**
     * @dev Anyone can trigger the switch if the owner has been inactive
     */
    function trigger() external {
        require(block.timestamp > lastPingTime + timeout, "Still active");
        triggered = true;
        emit Triggered(block.timestamp);
    }

     /**
     * @dev Allows a beneficiary to claim funds once the switch is triggered
     */
    function claim() external onlyBeneficiary {
        require(triggered, "Not triggered yet");
        require(!claimed, "Already claimed");
        
        claimed = true;
        
        // Calculate the share per beneficiary
        uint256 share = address(this).balance / beneficiaryList.length;
        
        // Send funds to the claiming beneficiary
        (bool success, ) = msg.sender.call{value: share}("");
        require(success, "Transfer failed");
        
        emit FundsClaimed(msg.sender, share);
    }
    
    /**
     * @dev Owner can add a beneficiary
     * @param _beneficiary Address of the beneficiary to add
     */
    function addBeneficiary(address _beneficiary) external onlyOwner notTriggered {
        require(_beneficiary != address(0), "Invalid address");
        require(!beneficiaries[_beneficiary], "Beneficiary already exists");
        
        beneficiaries[_beneficiary] = true;
        beneficiaryList.push(_beneficiary);
        
        emit BeneficiaryAdded(_beneficiary);
    }
    
    /**
     * @dev Owner can remove a beneficiary
     * @param _beneficiary Address of the beneficiary to remove
     */
    function removeBeneficiary(address _beneficiary) external onlyOwner notTriggered {
        require(beneficiaries[_beneficiary], "Beneficiary doesn't exist");
        
        beneficiaries[_beneficiary] = false;
        
        // Efficient removal from array using swap-and-pop
        for (uint i = 0; i < beneficiaryList.length; i++) {
            if (beneficiaryList[i] == _beneficiary) {
                beneficiaryList[i] = beneficiaryList[beneficiaryList.length - 1];
                beneficiaryList.pop();
                break;
            }
        }
        
        emit BeneficiaryRemoved(_beneficiary);
    }
    
    /**
     * @dev Check if an address is registered as a beneficiary
     * @param _address Address to check
     * @return bool indicating if the address is a beneficiary
     */

    function isBeneficiary(address _address) external view returns (bool) {
        return beneficiaries[_address];
    }
    
    /**
     * @dev Get the total number of beneficiaries
     * @return uint256 Number of beneficiaries
     */
    function getBeneficiaryCount() external view returns (uint256) {
        return beneficiaryList.length;
    }
    
    /**
     * @dev Get beneficiary at a specific index
     * @param _index Index in the beneficiary list
     * @return address Beneficiary address
     */
    function getBeneficiaryAtIndex(uint256 _index) external view returns (address) {
        require(_index < beneficiaryList.length, "Index out of bounds");
        return beneficiaryList[_index];
    }
    
    /**
     * @dev Owner can update the timeout period
     * @param _newTimeout New timeout in seconds
     */
    function updateTimeout(uint256 _newTimeout) external onlyOwner notTriggered {
        timeout = _newTimeout;
    }
    
    /**
     * @dev Get the time of the last ping
     * @return uint256 Timestamp of the last ping
     */
    function lastPing() external view returns (uint256) {
        return lastPingTime;
    }
    
    /**
     * @dev Function to receive Ether
     */
    receive() external payable {}
}