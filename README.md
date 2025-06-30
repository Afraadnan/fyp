
# 🔐 Privacy-Preserving Dead Man’s Switch using FHE & ZK

## 🧠 Overview

This project is a privacy-focused **Dead Man’s Switch** that securely triggers fund release or control transfer when the owner becomes inactive. The system uses:

- 🔒 **Fully Homomorphic Encryption (TFHE)** in Rust to evaluate inactivity without revealing timestamps
- 🛡 **Oasis Sapphire** for off-chain private logic
- ⚖️ **Solidity smart contract** for on-chain control
- 🖥 **JavaScript frontend** with MetaMask wallet connection

It ensures user privacy using encrypted off-chain logic and zero-knowledge-style verifications — without leaking personal data on-chain.

---

## 📦 Features

- ✅ Encrypted inactivity check via TFHE
- 🕒 Live countdown and heartbeat logging
- 🔐 Triggerable switch logic on timeout
- 📜 Smart contract manages beneficiaries and claims
- 🧩 Modular Rust + Solidity + JS architecture

---

## 🛠 Tech Stack

| Layer            | Tools & Frameworks                              |
|------------------|--------------------------------------------------|
| 💻 Frontend       | HTML, CSS, JavaScript, MetaMask, Ethers.js      |
| 🔗 Smart Contract | Solidity, Hardhat, Ethers.js                     |
| 🔐 Backend Logic  | Rust (TFHE - Zama), Cargo                        |
| 🌐 Privacy Compute| Oasis Sapphire                                  |
| ⚙️ Dev Tools      | Node.js, npm, Hardhat CLI, VS Code, Git          |

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
│   └── tfhe\_inactivity.rs        # Rust logic using TFHE
├── scripts/
│   └── deploy.js                 # Hardhat contract deployment
├── hardhat.config.js
├── package.json
├── Cargo.toml                    # Rust configuration
└── README.md

````

---

## 🔐 How It Works

1. User connects their wallet via MetaMask.
2. A `heartbeat()` is sent regularly and encrypted off-chain.
3. Rust backend (TFHE) evaluates if timeout is exceeded.
4. If inactive for too long, the contract allows `triggerSwitch()`.
5. Beneficiaries can now claim funds securely through the contract.

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Afraadnan/dead-mans-switch-fyp.git
cd dead-mans-switch-fyp
````

---

### 2. Install JavaScript Dependencies

```bash
# Frontend
cd frontend
npm install
```

---

### 3. Compile the Rust Backend

Install Rust via [rustup](https://rustup.rs/):

```bash
cd backend
cargo build --release
```

> Make sure Zama's TFHE crate is listed in `Cargo.toml`.

---

### 4. Compile & Deploy Smart Contract (Hardhat)

```bash
npm install   # in the project root
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

---

### 5. Launch Frontend

You can use [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code or simply open `index.html` in your browser.

---

## 📸 UI Preview

Coming soon! (You can include screenshots or a GIF of the countdown, MetaMask connection, and beneficiary UI.)

![image](https://github.com/user-attachments/assets/7dae6214-5f1f-4191-bbc5-af8a9631aa9f)
![image](https://github.com/user-attachments/assets/5c506733-8c06-40cd-bc12-7acf8b9aa26a)

## 🔍 Developer Notes

* Countdown logic is synced with encrypted backend.
* No sensitive data (timestamps, identities) is exposed on-chain.
* Designed for gas efficiency and privacy.

---

## 👩‍💻 Author

**Afra Adnan Qadir**
BSc Software Engineering – University of Nottingham Malaysia
📧 [afraadnan223@gmail.com](mailto:afraadnan223@gmail.com)
🔗 [LinkedIn](https://www.linkedin.com/in/afraadnan)
💻 [GitHub](https://github.com/Afraadnan)

---

## 📜 License

MIT License — open for research and educational use. Attribution appreciated.







