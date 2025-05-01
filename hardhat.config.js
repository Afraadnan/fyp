require("dotenv").config(); // Ensure this is at the top

require("@oasisprotocol/sapphire-hardhat");

require("@nomicfoundation/hardhat-ethers"); // Add this line for ethers support
//require("@nomicfoundation/hardhat-chai-ma");
require("@nomicfoundation/hardhat-chai-matchers");



const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
module.exports = {
  solidity: "0.8.20", // Solidity version for your contract
  networks: {
    sapphireTestnet: {
      url: 'https://testnet.sapphire.oasis.dev',
      chainId: 23295, // Sapphire Testnet chain ID
      accounts: [PRIVATE_KEY],
      companionNetworks: {
        // Used for verifying contracts with a different provider
        home: 'ethereum'
      }, // Use private key from .env
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};