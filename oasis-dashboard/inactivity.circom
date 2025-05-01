pragma circom 2.0.0;
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template Inactivity() {
    // Public inputs (no longer forwarded as outputs)
    signal input hash;
    signal input inactivityPeriod;
    signal input currentTime;
    
    // Private inputs
    signal input lastActive;
    signal input owner;

    // [Keep all your constraints...]
    // Remove all signal output declarations
    
    // Your existing constraints...
    signal validTime;
    signal diff;
    signal inactive;
    
    component timeCheck = LessThan(64);
    timeCheck.in[0] <== lastActive;
    timeCheck.in[1] <== currentTime;
    validTime <== timeCheck.out;
    validTime === 1;
    
    diff <== currentTime - lastActive;
    
    component periodCheck = GreaterEqThan(64);
    periodCheck.in[0] <== diff;
    periodCheck.in[1] <== inactivityPeriod;
    inactive <== periodCheck.out;
    inactive === 1;
    
    component hasher = Poseidon(2);
    hasher.inputs[0] <== lastActive;
    hasher.inputs[1] <== owner;
    
    hash === hasher.out;
}

// Proper public declaration
component main {public [hash, inactivityPeriod, currentTime]} = Inactivity();