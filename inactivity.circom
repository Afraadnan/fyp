// Import the Poseidon hash function and comparator components from circomlib
pragma circom 2.0.0;
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

//
template Inactivity() {
    // Public inputs (no longer forwarded as outputs)
    signal input hash;                  // Poseidon hash of lastActive and owner (used to validate inputs)
    signal input inactivityPeriod;      // Required inactivity threshold (in seconds)
    signal input currentTime;           // Current timestamp at the moment of verification
    
    // Private inputs- known only to the prover
    signal input lastActive;            // Last known active timestamp (must be proven)
    signal input owner;                 // Address or user identifier (used in Poseidon hash)

   // Intermediate signals used for internal logic
    signal validTime;                   // Indicates if lastActive < currentTime
    signal diff;                        // Time elapsed since lastActive
    signal inactive;                    // Indicates if inactivity period condition is satisfied
    
    // Comparator to check: lastActive < currentTime
    component timeCheck = LessThan(64);
    timeCheck.in[0] <== lastActive;
    timeCheck.in[1] <== currentTime;
    validTime <== timeCheck.out;

    // Enforce that the time check is true
    validTime === 1;
    
    // Calculate the difference between current time and last activity
    diff <== currentTime - lastActive;
    
    // Comparator to check: (currentTime - lastActive) >= inactivityPeriod
    component periodCheck = GreaterEqThan(64);
    periodCheck.in[0] <== diff;
    periodCheck.in[1] <== inactivityPeriod;
    inactive <== periodCheck.out;

    // Enforce that the user has been inactive for long enough
    inactive === 1;
    
    // Poseidon hash of private inputs: [lastActive, owner]
    component hasher = Poseidon(2);
    hasher.inputs[0] <== lastActive;
    hasher.inputs[1] <== owner;
    
    // Constrain that the public hash input matches computed Poseidon hash
    hash === hasher.out;
}

// Instantiate the template and expose specific signals as public for ZKP
component main {public [hash, inactivityPeriod, currentTime]} = Inactivity();