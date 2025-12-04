# OMEN - Deployment Guide

## MVP Features Implemented ✅

### 1. Token Gating (Mock)
- Checks if wallet holds minimum $OMEN tokens before voting
- Currently returns `true` (mock) - update after token launch
- File: `src/utils/tokenGating.ts`

### 2. Vote Persistence
- Votes saved to browser localStorage
- Persists across page reloads
- Prevents double voting
- File: `src/utils/voteStorage.ts`

### 3. Wallet Integration
- Requires wallet connection to vote
- Shows "Connect wallet to vote" warning
- Integrates with Phantom/Solflare

### 4. Enhanced UX
- Vote counts update in real-time
- Progress bars animate
- Buttons disable after voting
- Visual feedback for voted state

---

## Deploying to Vercel

### Step 1: Install Vercel CLI (Optional)
```powershell
npm install -g vercel
```

### Step 2: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit - OMEN prediction dApp"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your site will be live at `https://your-project.vercel.app`

### Step 3: Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `omen.xyz`)
3. Follow DNS configuration instructions

---

## After Token Launch

### Update Token Contract Address

1. **Get Token Address from Pump.fun**
   - After launching on Pump.fun, copy the token contract address

2. **Update `src/utils/tokenGating.ts`**
   ```typescript
   const OMEN_TOKEN_ADDRESS = 'YOUR_ACTUAL_TOKEN_ADDRESS_HERE';
   ```

3. **Enable Real Token Gating**
   - Uncomment the real implementation in `hasMinimumTokens()`
   - Comment out the mock `return true;`

4. **Redeploy**
   ```powershell
   git add .
   git commit -m "Add real token contract address"
   git push
   ```
   - Vercel will auto-deploy

---

## Environment Variables (Optional)

If you want to make the token address configurable:

1. **Create `.env.local`**
   ```
   NEXT_PUBLIC_OMEN_TOKEN_ADDRESS=YOUR_TOKEN_ADDRESS
   NEXT_PUBLIC_MINIMUM_TOKENS=1000
   ```

2. **Add to Vercel**
   - Go to Project Settings → Environment Variables
   - Add the same variables

3. **Update Code**
   ```typescript
   const OMEN_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_OMEN_TOKEN_ADDRESS || '7XuMtMfPXxHbjDLYtxmK4wRvYiFu1N9F8VDXukMTpump';
   const MINIMUM_TOKENS = parseInt(process.env.NEXT_PUBLIC_MINIMUM_TOKENS || '1000');
   ```

---

## Testing Locally

1. **Run Dev Server**
   ```powershell
   $env:PATH = "C:\Users\troy.watson\OneDrive - Commercial Motor Vehicles Pty Ltd\Desktop\Node JS\node-v24.11.1-win-x64;$env:PATH"; & "C:\Users\troy.watson\OneDrive - Commercial Motor Vehicles Pty Ltd\Desktop\Node JS\node-v24.11.1-win-x64\npm.cmd" run dev
   ```

2. **Test Voting**
   - Connect Phantom wallet
   - Try voting on a prediction
   - Refresh page - vote should persist
   - Try voting again - should be blocked

3. **Build for Production**
   ```powershell
   npm run build
   npm start
   ```

---

## Next Steps After Launch

### Phase 2: Backend Integration
1. Set up Supabase database
2. Migrate votes from localStorage to database
3. Add real-time vote syncing
4. Build admin panel

### Phase 3: Advanced Features
1. Leaderboard system
2. Reward distribution
3. On-chain voting (optional)
4. Mobile app

---

## Troubleshooting

### Build Errors
- **Error**: "Module not found"
  - Run `npm install` to ensure all dependencies are installed

- **Error**: "Type errors"
  - Check TypeScript files for any type mismatches

### Wallet Connection Issues
- Ensure Phantom/Solflare extension is installed
- Check browser console for errors
- Verify wallet adapter packages are installed

### Vote Not Persisting
- Check browser localStorage (F12 → Application → Local Storage)
- Ensure `voteStorage.ts` is imported correctly
- Clear localStorage and try again

---

## Support

For issues or questions:
- Check Next.js docs: https://nextjs.org/docs
- Solana wallet adapter: https://github.com/solana-labs/wallet-adapter
- Vercel deployment: https://vercel.com/docs
