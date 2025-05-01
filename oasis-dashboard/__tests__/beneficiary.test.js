/**
 * @jest-environment jsdom
 */
import { ethers } from "ethers";
import { initBeneficiaryUI, claimFunds, addBeneficiary } from '../bene.js';

// Mock ethers to prevent "ethers is not defined" error
jest.mock('ethers', () => {
  return {
    utils: {
      formatEther: jest.fn(val => val.toString()),
      parseEther: jest.fn(val => val),
      isAddress: jest.fn().mockReturnValue(true)
    },
    constants: {
      AddressZero: '0x0000000000000000000000000000000000000000'
    },
    BigNumber: {
      from: jest.fn(val => ({
        mul: jest.fn(() => ({
          div: jest.fn(() => val)
        }))
      }))
    }
  };
});

// Set up globals that the component depends on
global.walletConnected = true;
global.contractAddress = "0xContractAddress";

// Mock the contract
global.contract = {
    getOwnerAddress: jest.fn(),
    owner: jest.fn(),
    beneficiaryList: jest.fn(),
    beneficiaries: jest.fn(),
    verifyInactivity: jest.fn(),
    addBeneficiary: jest.fn(),
    triggerSwitch: jest.fn(),
    estimateGas: {
      triggerSwitch: jest.fn()
    },
    address: "0xContractAddress"
};

// Mock the provider
global.provider = {
    getSigner: jest.fn(() => ({
        getAddress: jest.fn().mockResolvedValue('0x1234'),
    })),
    getBalance: jest.fn().mockResolvedValue('100'),
};

// Mock DOM-related functions
global.updateStatus = jest.fn();
global.loadBeneficiaries = jest.fn();
global.checkIfBeneficiary = jest.fn();
global.monitorTransaction = jest.fn().mockResolvedValue({ status: 1 });

// Mock document methods
const mockElements = {};
document.getElementById = jest.fn(id => {
  if (!mockElements[id]) {
    mockElements[id] = {
      classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
      textContent: '',
      disabled: false,
      value: id === 'beneficiaryAddress' ? '0x0000' : 
             id === 'beneficiaryAmount' ? '1' : '',
      innerHTML: '',
      querySelector: jest.fn().mockReturnValue({})
    };
  }
  return mockElements[id];
});

document.addEventListener = jest.fn();
document.dispatchEvent = jest.fn();

// Create a mock Event constructor that JSDOM expects
const MockEvent = function(type) {
  this.type = type;
  this.bubbles = false;
  this.cancelable = false;
};

// This is needed for proper event simulation
global.Event = MockEvent;

// Create helper for wallet connected event
const simulateWalletConnectedEvent = () => {
  // Directly call the handler instead of using dispatchEvent
  const handlers = document.addEventListener.mock.calls
    .filter(call => call[0] === 'walletConnected')
    .map(call => call[1]);
  
  // If any handler exists, call it
  if (handlers.length > 0) {
    handlers[0]();
  } else {
    // If no handler is registered yet, mock the initBeneficiaryUI call directly
    initBeneficiaryUI();
  }
};

// Test cases
describe('Beneficiary UI', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize UI for owner', async () => {
        // Setup mock for owner
        global.contract.getOwnerAddress.mockResolvedValue('0x1234');
        global.contract.owner.mockResolvedValue('0x1234');
        global.contract.beneficiaryList.mockResolvedValue('0x0000');
        global.contract.beneficiaries.mockResolvedValue('10');

        // Test the function directly without simulating the event
        await initBeneficiaryUI();

        expect(document.getElementById('ownerBeneficiaryControls').classList.toggle)
          .toHaveBeenCalledWith('hidden', false);
        expect(global.loadBeneficiaries).toHaveBeenCalled();
    });

    test('should initialize UI for non-owner', async () => {
        // Setup mock for non-owner
        global.contract.getOwnerAddress.mockResolvedValue('0x5678');
        global.contract.owner.mockResolvedValue('0x5678');
        global.contract.beneficiaryList.mockResolvedValue('0x0000');
        global.contract.beneficiaries.mockResolvedValue('10');

        // Test the function directly
        await initBeneficiaryUI();

        expect(document.getElementById('ownerBeneficiaryControls').classList.toggle)
          .toHaveBeenCalledWith('hidden', true);
    });

    test('should handle claimFunds process', async () => {
        // Properly mock all functions used in claimFunds
        global.contract.verifyInactivity.mockResolvedValue(true);
        global.contract.beneficiaries.mockResolvedValue({
          lte: jest.fn().mockReturnValue(false),
          gt: jest.fn().mockReturnValue(true)
        });
        global.provider.getBalance.mockResolvedValue({
          lt: jest.fn().mockReturnValue(false)
        });
        
        global.contract.estimateGas.triggerSwitch.mockResolvedValue({
          mul: jest.fn().mockReturnValue({
            div: jest.fn().mockReturnValue(300000)
          })
        });
        
        global.contract.triggerSwitch.mockResolvedValue({ 
          hash: "0xtxhash",
          wait: jest.fn().mockResolvedValue({ status: 1 }) 
        });

        // Create a spy on the console.error to prevent test output pollution
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await claimFunds();

        // Verify the correct calls were made
        expect(updateStatus).toHaveBeenCalledWith("Preparing to claim funds...", "info");
        expect(updateStatus).toHaveBeenCalledWith("Claiming funds...", "info");
        expect(global.contract.triggerSwitch).toHaveBeenCalled();
        expect(updateStatus).toHaveBeenCalledWith("Transaction submitted: 0xtxhash", "info");
        expect(updateStatus).toHaveBeenCalledWith("Funds claimed successfully!", "success");
        
        // Restore the original console.error
        errorSpy.mockRestore();
    });

    test('should fail to claim funds if contract is active', async () => {
        // Setup mocks for failed claim
        global.contract.verifyInactivity.mockResolvedValue(false);
        global.contract.beneficiaries.mockResolvedValue({
          gt: jest.fn().mockReturnValue(true)
        });
        global.provider.getBalance.mockResolvedValue({
          lt: jest.fn().mockReturnValue(false)
        });

        // Create a spy on the console.error
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await claimFunds();

        expect(updateStatus).toHaveBeenCalledWith("Preparing to claim funds...", "info");
        expect(updateStatus).toHaveBeenCalledWith("Claim failed: Contract is still active. Cannot claim funds yet.", "error");
        
        // Restore console.error
        errorSpy.mockRestore();
    });

    test('should add beneficiary successfully', async () => {
        // Set up mock return values for getElementById
        document.getElementById.mockImplementation(id => {
          if (id === "beneficiaryAddress") {
            return { value: "0x0000" };
          } else if (id === "beneficiaryAmount") {
            return { value: "1" };
          } else {
            return {
              classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
              textContent: '',
              disabled: false,
              value: '',
              innerHTML: '',
            };
          }
        });
        
        // Mock provider balance
        global.provider.getBalance.mockResolvedValue({
          lt: jest.fn().mockReturnValue(false)
        });
        
        // Mock contract function
        global.contract.addBeneficiary.mockResolvedValue({ 
          hash: "0xtxhash",
          wait: jest.fn().mockResolvedValue({ status: 1 }) 
        });
        
        global.contract.getOwnerAddress.mockResolvedValue('0x1234');
        
        await addBeneficiary();

        expect(updateStatus).toHaveBeenCalledWith("Adding beneficiary...", "info");
        expect(global.contract.addBeneficiary).toHaveBeenCalledWith("0x0000", "1");
        expect(updateStatus).toHaveBeenCalledWith("Added beneficiary with 1 ETH", "success");
    });

    test('should fail to add beneficiary if contract has insufficient funds', async () => {
        // Set up mock return values for getElementById
        document.getElementById.mockImplementation(id => {
          if (id === "beneficiaryAddress") {
            return { value: "0x0000" };
          } else if (id === "beneficiaryAmount") {
            return { value: "200" };
          } else {
            return {
              classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
              textContent: '',
              disabled: false,
              value: '',
              innerHTML: '',
            };
          }
        });

        // Mock provider balance to return insufficient funds
        global.provider.getBalance.mockResolvedValue({
          lt: jest.fn().mockReturnValue(true)
        });
        
        await addBeneficiary();

        expect(updateStatus).toHaveBeenCalledWith("Contract needs at least 200 ETH to cover this beneficiary", "error");
    });
});