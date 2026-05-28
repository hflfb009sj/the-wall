# The Wall — Deployment Guide

## Step 1: Supabase Setup
1. Go to supabase.com → Your project → SQL Editor
2. Run the contents of `supabase-schema.sql`
3. This creates: pioneers, payments, likes, ratings tables

## Step 2: Vercel Setup
1. Push this project to GitHub
2. Import on Vercel: vercel.com/new
3. Add Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   - NEXT_PUBLIC_PI_APP_ID = the-wall-17f83751cc0521cc
   - NEXT_PUBLIC_PI_SANDBOX = true (change to false for Mainnet)
   - PI_API_KEY = (your Pi API key — keep secret)
4. Deploy

## Step 3: Pi Developer Portal
1. Go to develop.pi in Pi Browser
2. Open The Wall app
3. Update App URL = https://your-app.vercel.app
4. Update Callback URL = https://your-app.vercel.app/api/payments/approve

## Step 4: Test on Testnet
1. Open your Vercel URL inside Pi Browser
2. Sign in with Pi
3. Try engraving a Stone sigil (0.001 Pi test)
4. Verify payment appears in Supabase payments table
5. Verify pioneer appears in pioneers table

## Step 5: Go Mainnet
1. Change NEXT_PUBLIC_PI_SANDBOX = false in Vercel
2. In Pi Developer Portal → switch to Mainnet
3. Redeploy

## Payment Flow
User pays → onReadyForServerApproval → /api/payments/approve → Pi approves
→ User confirms on blockchain → onReadyForServerCompletion → /api/payments/complete
→ Profile saved to Supabase → Pioneer appears on wall

## Revenue Model
- All Pi payments go to your wallet
- Genesis holders: 3% of market commissions
- Sovereign holders: 5% of market commissions
- Market commission: 10% per trade
