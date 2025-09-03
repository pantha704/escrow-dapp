# Vercel Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites

- GitHub repository with your escrow project
- Vercel account (free tier works fine)
- Program deployed to Solana devnet

### Step 1: Prepare Repository

Make sure your repository structure looks like this:

```
escrow/
├── frontend/           # React frontend (this gets deployed)
├── programs/          # Anchor program (already deployed)
├── tests/            # Test files
└── README.md
```

### Step 2: Deploy on Vercel

1. **Connect Repository**

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` folder as the root directory

2. **Configure Build Settings**

   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `bun run build`
   - **Output Directory**: `dist`
   - **Install Command**: `bun install`

3. **Set Environment Variables**
   Add these in Vercel dashboard under "Environment Variables":

   ```
   VITE_SOLANA_NETWORK=devnet
   VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
   VITE_PROGRAM_ID=8hMrECVej1KoLvygnfLytvGEuvQwGMT5jobXHkjjWpyS
   VITE_APP_TITLE=Escrow dApp
   VITE_REFRESH_INTERVAL=30000
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get your live URL (e.g., `https://your-app.vercel.app`)

### Step 3: Update Documentation

Once deployed, update your `PROJECT_DESCRIPTION.md`:

```markdown
**Deployed Frontend URL:** https://your-app.vercel.app
```

### Step 4: Test Deployment

1. Visit your deployed URL
2. Connect wallet (Phantom/Solflare)
3. Test escrow creation with devnet tokens
4. Verify all functions work (create/take/refund)

## 🔧 Troubleshooting

### Common Issues:

**Build Fails - "IDL not found"**

- Solution: The `copy-idl` script runs automatically in build
- Make sure `target/idl/blueshift_anchor_escrow.json` exists

**Wallet Connection Issues**

- Solution: Ensure HTTPS is enabled (Vercel provides this automatically)
- Check browser console for errors

**RPC Errors**

- Solution: Verify `VITE_SOLANA_RPC_URL` is set correctly
- Try alternative devnet RPC if needed

**Program Not Found**

- Solution: Verify `VITE_PROGRAM_ID` matches your deployed program
- Check program is deployed to devnet

### Alternative RPC Endpoints (if needed):

```
# Solana Labs (primary)
https://api.devnet.solana.com

# Alchemy (backup)
https://solana-devnet.g.alchemy.com/v2/YOUR_API_KEY

# QuickNode (backup)
https://your-endpoint.solana-devnet.quiknode.pro/YOUR_API_KEY/
```

## 📱 Mobile Testing

Your deployed dApp will work on mobile browsers with wallet apps:

- **iOS**: Phantom mobile app browser
- **Android**: Phantom mobile app browser
- **Desktop**: Any browser with wallet extension

## 🔄 Continuous Deployment

Vercel automatically redeploys when you push to your main branch:

1. Make changes to frontend code
2. Push to GitHub
3. Vercel automatically rebuilds and deploys
4. New version is live in ~2 minutes

## 🌐 Custom Domain (Optional)

1. Go to Vercel dashboard → Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

## 📊 Analytics & Monitoring

Vercel provides built-in analytics:

- Page views and unique visitors
- Performance metrics
- Error tracking
- Function invocations

Access via: Vercel Dashboard → Your Project → Analytics

---

**Need Help?**

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- Check browser console for errors
- Verify all environment variables are set correctly
