
# 🔐 Privacy-Preserving Dead Man’s Switch using FHE & ZK

## 🧠 Overview

This project implements a **Dead Man’s Switch** that securely transfers control or assets (e.g., crypto funds) to beneficiaries if the owner becomes inactive. It combines **Fully Homomorphic Encryption (FHE)** with **Zero-Knowledge Proofs (ZK)** to verify inactivity off-chain—**without revealing sensitive data like timestamps**.

Key components include:
- `TFHE` in Rust for encrypted logic
- `Oasis Sapphire` for off-chain compute privacy
- `Solidity` smart contract for fund handling
- `JavaScript` frontend for interaction
- `Express.js + Nodemailer` for email alerts

---

## 📦 Features

- ✅ Encrypted heartbeat verification using TFHE
- 🕒 Live countdown & timeout logic (off-chain)
- 🔒 ZK-proof-based fund trigger
- 📜 Solidity contract for fund and beneficiary control
- 📧 Email alerts to beneficiaries
- 🧩 Modular, gas-efficient, and privacy-first

---

## 🛠 Tech Stack

| Layer          | Tools & Frameworks                             |
|----------------|-------------------------------------------------|
| Smart Contract | Solidity, Hardhat, Ethers.js                   |
| Backend        | Rust (TFHE), Node.js, Express, Nodemailer      |
| Frontend       | JavaScript, HTML, CSS, Ethers.js, MetaMask     |
| Privacy Layer  | TFHE (Zama), Oasis Sapphire                    |
| Wallet         | MetaMask                                       |

---

## 📁 Project Structure

```

DeadMansSwitch-FYP/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── contracts/
│   └── DeadManSwitch.sol
├── backend/
│   ├── tfhe\_inactivity.rs
│   ├── express\_server.js
│   └── nodemailer\_config.js
├── scripts/
│   └── deploy.js
├── README.md
├── package.json
└── hardhat.config.js

````

---

## 🔐 How It Works

1. User connects wallet via MetaMask.
2. `heartbeat()` function is called periodically and processed off-chain via encrypted logic.
3. If timeout is reached (e.g., 30 days of inactivity), the system allows `triggerSwitch()`.
4. Once triggered, email notifications are sent to beneficiaries.
5. Beneficiaries can claim funds through the smart contract.

---

## 💻 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Afraadnan/dead-mans-switch-fyp.git
cd dead-mans-switch-fyp
````

### 2. Install Dependencies

```bash
cd frontend
npm install
cd ../backend
npm install
```

### 3. Compile and Deploy Smart Contract

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

### 4. Run Backend Server

```bash
node backend/express_server.js
```

### 5. Launch Frontend

You can use [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code or open `index.html` directly in your browser.

---

## 📧 Email Setup

To enable email alerts, configure `nodemailer_config.js`:

```js
module.exports = {
  service: 'YourSMTPService',
  auth: {
    user: 'your@email.com',
    pass: 'yourpassword'
  }
}
```

Use Mailtrap or Gmail SMTP for testing.

---

## 📸 UI Preview

Coming soon! (You can include screenshots or a GIF of the countdown, MetaMask connection, and beneficiary UI.)

---

## 🔒 Security Notes

* Off-chain TFHE ensures **no timestamps or user data is revealed**.
* Gas costs minimized by delegating logic off-chain.
* ZK-proof concept ensures **verifiable inactivity** without central trust.

---

## 👩‍💻 Author

**Afra Adnan Qadir**
BSc Software Engineering – University of Nottingham Malaysia
📧 [afraadnan223@gmail.com](mailto:afraadnan223@gmail.com)
🔗 [LinkedIn](https://www.linkedin.com/in/afraadnan)
💻 [GitHub](https://github.com/Afraadnan)

---

## 📜 License

This project is licensed under the **MIT License**.
Use freely with credit. For educational or non-commercial research purposes.

---

