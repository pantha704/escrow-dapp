# Vercel Deployment Checklist ✅

## Pre-Deployment

- [ ] Program deployed to devnet (`8hMrECVej1KoLvygnfLytvGEuvQwGMT5jobXHkjjWpyS`)
- [ ] Frontend builds locally (`bun run build`)
- [ ] All tests pass (`anchor test`)
- [ ] Code pushed to GitHub repository

## Vercel Configuration

- [ ] Repository connected to Vercel
- [ ] Root directory set to `frontend`
- [ ] Framework preset: Vite
- [ ] Build command: `bun run build`
- [ ] Output directory: `dist`

## Environment Variables

Set these in Vercel dashboard:

- [ ] `VITE_SOLANA_NETWORK=devnet`
- [ ] `VITE_SOLANA_RPC_URL=https://api.devnet.solana.com`
- [ ] `VITE_PROGRAM_ID=8hMrECVej1KoLvygnfLytvGEuvQwGMT5jobXHkjjWpyS`
- [ ] `VITE_APP_TITLE=Escrow dApp`
- [ ] `VITE_REFRESH_INTERVAL=30000`

## Post-Deployment Testing

- [ ] Site loads without errors
- [ ] Wallet connection works
- [ ] Can create escrow with test tokens
- [ ] Can view active escrows
- [ ] Can take/refund escrows
- [ ] Mobile browser compatibility

## Documentation Updates

- [ ] Update `PROJECT_DESCRIPTION.md` with live URL
- [ ] Update `README.md` with deployment info
- [ ] Share live demo link

## Your Deployment URL

Once deployed, your URL will be: `https://[project-name].vercel.app`

**Ready to deploy!** 🚀
