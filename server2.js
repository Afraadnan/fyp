const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const port = 8545;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const BENEFICIARIES_FILE = path.join(DATA_DIR, 'beneficiaries.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
if (!fs.existsSync(BENEFICIARIES_FILE)) {
    fs.writeFileSync(BENEFICIARIES_FILE, JSON.stringify({}));
}

if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}));
}

// Helper functions
function getBeneficiaries() {
    try {
        const data = fs.readFileSync(BENEFICIARIES_FILE);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading beneficiaries:', error);
        return {};
    }
}

function saveBeneficiaries(data) {
    try {
        fs.writeFileSync(BENEFICIARIES_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving beneficiaries:', error);
        return false;
    }
}

function getSettings() {
    try {
        const data = fs.readFileSync(SETTINGS_FILE);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading settings:', error);
        return {};
    }
}

function saveSettings(data) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

// Configure nodemailer (for demonstration purposes - replace with real email service in production)
const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your_email@example.com',
        pass: 'your_password'
    }
});

// Routes
app.get('/check_timeout', async (req, res) => {
    const { last_ping, timeout_secs } = req.query;

    // Compare last_ping with current time
    const lastPingTime = parseInt(last_ping);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeout = parseInt(timeout_secs);

    if (currentTime - lastPingTime > timeout) {
        res.json(true);  // Trigger condition met
    } else {
        res.json(false); // Not triggered yet
    }
});

app.get('/beneficiaries', (req, res) => {
    const { contractAddress } = req.query;
    
    if (!contractAddress) {
        return res.status(400).json({ error: 'Contract address is required' });
    }

    const allBeneficiaries = getBeneficiaries();
    const contractBeneficiaries = allBeneficiaries[contractAddress] || [];
    
    res.json({ beneficiaries: contractBeneficiaries });
});

app.post('/add_beneficiary', (req, res) => {
    const { contractAddress, beneficiary } = req.body;
    
    if (!contractAddress || !beneficiary || !beneficiary.address) {
        return res.status(400).json({ success: false, message: 'Missing required data' });
    }

    try {
        const allBeneficiaries = getBeneficiaries();
        
        // Initialize array for this contract if it doesn't exist
        if (!allBeneficiaries[contractAddress]) {
            allBeneficiaries[contractAddress] = [];
        }
        
        // Check if beneficiary already exists
        const exists = allBeneficiaries[contractAddress].some(b => 
            b.address.toLowerCase() === beneficiary.address.toLowerCase()
        );
        
        if (exists) {
            return res.json({ success: false, message: 'Beneficiary already exists' });
        }
        
        // Add new beneficiary
        allBeneficiaries[contractAddress].push(beneficiary);
        saveBeneficiaries(allBeneficiaries);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding beneficiary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/remove_beneficiary', (req, res) => {
    const { contractAddress, beneficiaryAddress } = req.body;
    
    if (!contractAddress || !beneficiaryAddress) {
        return res.status(400).json({ success: false, message: 'Missing required data' });
    }

    try {
        const allBeneficiaries = getBeneficiaries();
        
        if (!allBeneficiaries[contractAddress]) {
            return res.json({ success: false, message: 'No beneficiaries for this contract' });
        }
        
        // Filter out the beneficiary to remove
        allBeneficiaries[contractAddress] = allBeneficiaries[contractAddress].filter(b => 
            b.address.toLowerCase() !== beneficiaryAddress.toLowerCase()
        );
        
        saveBeneficiaries(allBeneficiaries);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing beneficiary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/check_beneficiary', (req, res) => {
    const { contractAddress, address } = req.query;
    
    if (!contractAddress || !address) {
        return res.status(400).json({ error: 'Contract address and beneficiary address are required' });
    }

    try {
        const allBeneficiaries = getBeneficiaries();
        const contractBeneficiaries = allBeneficiaries[contractAddress] || [];
        
        const isBeneficiary = contractBeneficiaries.some(b => 
            b.address.toLowerCase() === address.toLowerCase()
        );
        
        res.json({ isBeneficiary });
    } catch (error) {
        console.error('Error checking beneficiary status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/update_settings', (req, res) => {
    const { contractAddress, ownerAddress, settings } = req.body;
    
    if (!contractAddress || !ownerAddress) {
        return res.status(400).json({ success: false, message: 'Missing required data' });
    }

    try {
        const allSettings = getSettings();
        
        if (!allSettings[contractAddress]) {
            allSettings[contractAddress] = {};
        }
        
        allSettings[contractAddress] = {
            ...allSettings[contractAddress],
            ownerAddress,
            ...settings
        };
        
        saveSettings(allSettings);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/notify_beneficiaries', async (req, res) => {
    const { contractAddress } = req.body;
    
    if (!contractAddress) {
        return res.status(400).json({ success: false, message: 'Contract address is required' });
    }

    try {
        const allBeneficiaries = getBeneficiaries();
        const contractBeneficiaries = allBeneficiaries[contractAddress] || [];
        
        // Filter beneficiaries with email addresses
        const beneficiariesToNotify = contractBeneficiaries.filter(b => b.email);
        
        if (beneficiariesToNotify.length === 0) {
            return res.json({ success: true, message: 'No beneficiaries to notify' });
        }
        
        // Send notification emails (in a real app, this would use a proper email service)
        const notifications = beneficiariesToNotify.map(async beneficiary => {
            try {
                // This is a mock email - in a real application, uncomment this to send actual emails
                /*
                await transporter.sendMail({
                    from: 'deadmansswitch@example.com',
                    to: beneficiary.email,
                    subject: 'Dead Man\'s Switch Triggered',
                    text: `The Dead Man's Switch for contract ${contractAddress} has been triggered. You are registered as a beneficiary and may now claim the funds.`,
                    html: `
                        <h1>Dead Man's Switch Triggered</h1>
                        <p>The Dead Man's Switch for contract ${contractAddress} has been triggered.</p>
                        <p>You are registered as a beneficiary and may now claim the funds.</p>
                        <p>Visit the application to claim your portion of the funds.</p>
                    `
                });
                */
                
                console.log(`[NOTIFICATION] Email sent to ${beneficiary.email}`);
                return true;
            } catch (error) {
                console.error(`Error sending notification to ${beneficiary.email}:`, error);
                return false;
            }
        });
        
        // Wait for all notification attempts to complete
        const results = await Promise.all(notifications);
        const allSuccessful = results.every(result => result);
        
        res.json({ 
            success: true, 
            allNotified: allSuccessful,
            message: allSuccessful ? 'All beneficiaries notified' : 'Some notifications failed'
        });
    } catch (error) {
        console.error('Error notifying beneficiaries:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Dead Man's Switch Server running at http://localhost:${port}`);
});