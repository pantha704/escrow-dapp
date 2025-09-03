# Solana Escrow dApp

A decentralized escrow service for secure peer-to-peer SPL token exchanges on Solana.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Solana CLI
- Anchor Framework
- Phantom/Solflare wallet

### Installation

```bash
# Clone and setup
git clone <your-repo>
cd escrow

# Install dependencies
yarn install
# or
bun install

# Build program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Start frontend
cd frontend
bun install
bun run dev
```

### Usage

1. **Connect Wallet** at http://localhost:5174
2. **Create Escrow** - Deposit tokens and set exchange terms
3. **Take Escrow** - Complete trades by providing requested tokens
4. **Refund** - Reclaim your deposited tokens anytime

## 💡 Example Transaction

Here's a complete example to test the escrow functionality on devnet:

### Step 1: Get Test Tokens
```bash
# Create a custom token for testing
spl-token create-token --decimals 6

# Example output: GRmDAdVee795cya78KNVcxaGE1FuR7sLegqBFVzscNPf

# Create token account and mint tokens to your wallet
spl-token create-account GRmDAdVee795cya78KNVcxaGE1FuR7sLegqBFVzscNPf
spl-token mint GRmDAdVee795cya78KNVcxaGE1FuR7sLegqBFVzscNPf 10000
```

### Step 2: Create Escrow
Fill out the escrow form with these example values:

| Field | Value | Description |
|-------|-------|-------------|
| **Seed** | `1` | Unique number (user-chosen, 1-999999) |
| **Token A Mint** | `GRmDAdVee795cya78KNVcxaGE1FuR7sLegqBFVzscNPf` | Your custom token |
| **Token B Mint** | `So11111111111111111111111111111111111111112` | Wrapped SOL |
| **Deposit Amount** | `1000` | 1,000 of your custom tokens |
| **Receive Amount** | `100000000` | 0.1 SOL (100M lamports) |

### Step 3: Test the Trade
- **As Maker**: You can refund to get your tokens back
- **As Taker**: Someone with 0.1 SOL can complete the trade
- **Result**: Atomic swap of 1,000 custom tokens ↔ 0.1 SOL

### About the Seed Parameter
The **seed** is a user-chosen number that:
- Must be unique per maker (you can't reuse the same seed)
- Creates deterministic escrow addresses
- Allows you to have multiple active escrows
- Can be any number (commonly 1, 2, 3... for simplicity)

**Example Seeds:**
- Use `1` for your first escrow
- Use `2` for your second escrow  
- Use `42` if you like that number
- Use `123456` for a more unique identifier

## 🏗️ Architecture

### Program Structure
```
escrow/
├── programs/escrow/          # Anchor program
├── tests/                    # Test suite
├── frontend/                 # React frontend
└── target/                   # Build artifacts
```

### Key Components
- **Escrow Account**: Stores trade parameters and state
- **Vault ATA**: Holds deposited tokens securely
- **PDA Authority**: Program-controlled token operations

## 🧪 Testing

```bash
# Run all tests
anchor test

# Test specific scenarios
anchor test --skip-deploy
```

**Test Coverage:**
- ✅ Escrow creation and token deposits
- ✅ Successful token exchanges
- ✅ Maker refunds and account closure
- ✅ Error handling and constraint validation

## 📋 Program Details

**Program ID:** `8hMrECVej1KoLvygnfLytvGEuvQwGMT5jobXHkjjWpyS`

**Instructions:**
- `make` - Create escrow and deposit tokens
- `take` - Execute token exchange
- `refund` - Return tokens to maker

**Security Features:**
- PDA-based authority control
- Comprehensive constraint validation
- Atomic token operations
- Zero-trust architecture

## 🌐 Frontend

Built with React, TypeScript, and Solana wallet adapters.

**Features:**
- Real-time escrow monitoring
- Multi-wallet support
- Error handling and validation
- Responsive design

## 🔧 Development

### Locearn More

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [SPL Token Program](https://spl.solana.com/token)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.