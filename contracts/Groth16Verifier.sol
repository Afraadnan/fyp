// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key constants from the provided verification key
    // vk_alpha_1
    uint256 constant alphax = 16575532494137007999521996119383673034954209906212639756561518465057948246913;
    uint256 constant alphay = 20539142265405134571009740469866794861922142956157151819691490170719514140744;
    
    // vk_beta_2
    uint256 constant betax1 = 6512778289700294688776977310219008075315987860141461170525946010737631796223;
    uint256 constant betax2 = 13695958624361029652205932886842010506342173995302911741143210194141392245771;
    uint256 constant betay1 = 14446098593817916079459607894656323675659442059321078649475548846322318158599;
    uint256 constant betay2 = 21749776208965627593642070841183999873452679841441418260788461014823535867932;
    
    // vk_gamma_2
    uint256 constant gammax1 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammax2 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammay1 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant gammay2 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    
    // vk_delta_2
    uint256 constant deltax1 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant deltax2 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant deltay1 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltay2 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    
    // IC array for all public inputs (constants + inputs)
    // IC[0]
    uint256 constant IC0x = 2034329020969717429552856104880664932384702926743562724972781463402494466314;
    uint256 constant IC0y = 17719834788837675715365432153116477278048004488264646839745631999816802440047;
    
    // IC[1] - For hash
    uint256 constant IC1x = 5353383916636114476587757882761309977852735446930320612964478141679757750626;
    uint256 constant IC1y = 17806986319373026900452958469029250648648175121132270768225420865179884786033;
    
    // IC[2] - For inactivityPeriod
    uint256 constant IC2x = 15867029978913913696716880954563866914345797765241703453483778572428683974584;
    uint256 constant IC2y = 2225461406444730949735497247527286294137075371950509828290779187424340860339;
    
    // IC[3] - For currentTime
    uint256 constant IC3x = 16175796066040575756855702758352486757468626684090678852210878989577855697073;
    uint256 constant IC3y = 20475514665018012591992208441548459347478208718688774342625134608508071942257;

    struct G1Point {
        uint256 x;
        uint256 y;
    }

    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[3] calldata input // Fixed array size for the 3 public inputs
    ) external view returns (bool) {
        // Validate all field elements
        validateFieldElement(a[0]);
        validateFieldElement(a[1]);
        validateFieldElement(b[0][0]);
        validateFieldElement(b[0][1]);
        validateFieldElement(b[1][0]);
        validateFieldElement(b[1][1]);
        validateFieldElement(c[0]);
        validateFieldElement(c[1]);
        
        for (uint i = 0; i < input.length; i++) {
            validateFieldElement(input[i]);
        }

        // Calculate the linear combination of inputs with IC coefficients
        G1Point memory vk_x = G1Point(IC0x, IC0y);
        
        // Add the contribution of each public input
        vk_x = pointAdd(vk_x, scalarMul(G1Point(IC1x, IC1y), input[0]));
        vk_x = pointAdd(vk_x, scalarMul(G1Point(IC2x, IC2y), input[1]));
        vk_x = pointAdd(vk_x, scalarMul(G1Point(IC3x, IC3y), input[2]));

        // Pairing check implementation
        uint256[24] memory inputPairing;
        
        // -A
        inputPairing[0] = a[0];
        inputPairing[1] = q - (a[1] % q); // Negate y-coordinate for -A
        
        // B - Note the order swap for G2 points
        inputPairing[2] = b[0][1];
        inputPairing[3] = b[0][0];
        inputPairing[4] = b[1][1];
        inputPairing[5] = b[1][0];
        
        // alpha1
        inputPairing[6] = alphax;
        inputPairing[7] = alphay;
        
        // beta2
        inputPairing[8] = betax1;
        inputPairing[9] = betax2;
        inputPairing[10] = betay1;
        inputPairing[11] = betay2;
        
        // vk_x (linear combination of IC and inputs)
        inputPairing[12] = vk_x.x;
        inputPairing[13] = vk_x.y;
        
        // C
        inputPairing[14] = c[0];
        inputPairing[15] = c[1];
        
        // gamma2
        inputPairing[16] = gammax1;
        inputPairing[17] = gammax2;
        inputPairing[18] = gammay1;
        inputPairing[19] = gammay2;
        
        // delta2
        inputPairing[20] = deltax1;
        inputPairing[21] = deltax2;
        inputPairing[22] = deltay1;
        inputPairing[23] = deltay2;

        uint256[1] memory out;
        bool success;
        
        assembly {
            success := staticcall(sub(gas(), 2000), 8, inputPairing, 768, out, 0x20)
        }
        
        require(success, "Pairing check failed");
        return out[0] == 1;
    }
    
    // Helper function to add two points on the elliptic curve
    function pointAdd(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint256[4] memory input;
        input[0] = p1.x;
        input[1] = p1.y;
        input[2] = p2.x;
        input[3] = p2.y;
        
        bool success;
        
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0x80, r, 0x40)
        }
        
        require(success, "EC add failed");
        return r;
    }
    
    // Helper function to multiply a point by a scalar
    function scalarMul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
        uint256[3] memory input;
        input[0] = p.x;
        input[1] = p.y;
        input[2] = s;
        
        bool success;
        
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x60, r, 0x40)
        }
        
        require(success, "EC mul failed");
        return r;
    }

    function validateFieldElement(uint256 element) internal pure {
        require(element < r, "Field element not in range");
    }
}