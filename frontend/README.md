# Escrow Frontend

A React frontend for the Blueshift Escrow program built with Vite, TypeScript, and Tailwind CSS.

## Features

- 🔗 **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- 🏪 **Create Escrows**: Deposit tokens and specify what you want in return
- 🔄 **Take Escrows**: Complete token exchanges with other users
- 💰 **Refund**: Reclaim your deposited tokens if needed
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- ⚡ **Real-time Updates**: Live escrow data and transaction status

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Solana wallet (Phantom recommended)
- Some SOL for transaction fees

### Installation

```bash
# Install dependencies
bun install

# Start development server (automatically syncs IDL)
bun run dev
```

**Note**: The development server automatically syncs the IDL from `../target/idl/blueshift_anchor_escrow.json` before starting.

### Configuration

The app is configured to connect to Solana devnet by default. To use with localnet:

1. Update `WalletProvider.tsx`:

```typescript
// Change this line:
const endpoint = useMemo(() => clusterApiUrl(network), [network]);

// To this for local development:
const endpoint = "http://127.0.0.1:8899";
```

2. Make sure your local validator is running:

```bash
solana-test-validator
```

## Usage

1. **Connect Wallet**: Click the wallet button to connect your Solana wallet
2. **Create Escrow**:
   - Enter a unique seed number
   - Provide Token A mint address (token you're depositing)
   - Provide Token B mint address (token you want to receive)
   - Set deposit and receive amounts
   - Click "Create Escrow"
3. **Take Escrow**: Browse available escrows and click "Take Escrow" to complete a trade
4. **Refund**: Click "Refund" on your own escrows to reclaim deposited tokens

## Program Integration

The frontend integrates with the Blueshift Escrow Solana program:

- **Program ID**: `8hMrECVej1KoLvygnfLytvGEuvQwGMT5jobXHkjjWpyS`
- **Instructions**: Make, Take, Refund
- **Accounts**: Automatic PDA derivation and ATA management

## Development

### Project Structure

```
src/
├── App.tsx           # Main application component
├── WalletProvider.tsx # Solana wallet configuration
├── idl.json          # Program IDL for type safety
├── main.tsx          # Application entry point
└── index.css         # Tailwind CSS styles
```

### Building

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

## Troubleshooting

### Common Issues

1. **Wallet Connection Issues**: Make sure you have a Solana wallet installed and configured
2. **Transaction Failures**: Ensure you have sufficient SOL for transaction fees
3. **Token Account Errors**: Make sure you have the required tokens in your wallet
4. **Network Issues**: Verify you're connected to the correct Solana cluster

### Error Messages

- `"Invalid amount"`: Check that deposit/receive amounts are greater than 0
- `"Account does not exist"`: The escrow may have already been taken or refunded
- `"Insufficient funds"`: You don't have enough tokens for the transaction

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Blueshift Escrow program and follows the same licensing terms.
