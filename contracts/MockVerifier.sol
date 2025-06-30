// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MockVerifier
 * @dev A mock implementation of a ZK proof verifier for testing purposes
 */
contract MockVerifier {
    bool private returnValue = true;
    
    /**
     * @dev Sets the return value for the verifyProof function
     * @param _value The boolean value to return
     */
    function setReturnValue(bool _value) public {
        returnValue = _value;
    }
    
    /**
     * @dev Mock implementation of the verifyProof function for Groth16 proof verification
     * @param a Array representing the 'a' component of the proof
     * @param b Array representing the 'b' component of the proof
     * @param c Array representing the 'c' component of the proof
     * @param input Public inputs to the circuit
     * @return The configured return value (true or false)
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[2] memory input
    ) public view returns (bool) {
        return returnValue;
    }
    
    /**
     * @dev Alternative signature for groth16 verifier
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) public view returns (bool) {
        return returnValue;
    }
}