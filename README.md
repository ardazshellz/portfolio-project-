# Portfolio Project — Investment OS
## Deployment Guide (20 minutes)

---

### STEP 1 — Install Node.js
Go to https://nodejs.org and download the LTS version. Install it. 
Verify by opening Terminal (Mac) or Command Prompt (Windows) and typing:
```
node --version
```
You should see something like v20.x.x

---

### STEP 2 — Install Vercel CLI
In your terminal, run:
```
npm install -g vercel
```

---

### STEP 3 — Unzip and enter the project folder
Unzip the stacked-racks.zip file, then in your terminal:
```
cd stacked-racks
npm install
```
Wait for packages to install (1-2 minutes).

---

### STEP 4 — Deploy to Vercel
```
vercel
```
- It will ask you to log in — choose "Continue with GitHub" or enter an email
- When asked "Set up and deploy?" → press Enter (Yes)
- When asked project name → press Enter (keep stacked-racks)
- When asked which directory → press Enter (keep ./)
- When asked to override settings → type N and press Enter

Vercel will build and deploy. In about 60 seconds you'll see:
```
✅ Production: https://stacked-racks-xxxx.vercel.app
```

---

### STEP 5 — Open on your phone
Go to that URL on your phone. Bookmark it to your home screen:
- iPhone: tap Share → Add to Home Screen
- Android: tap menu → Add to Home Screen

---

### ENVIRONMENT VARIABLES (already set in vercel.json)
- T212_KEY — your Trading 212 API key
- FINNHUB_KEY — your Finnhub API key

If you need to update keys later:
1. Go to vercel.com → your project → Settings → Environment Variables
2. Update the value and redeploy

---

### UPDATING THE APP
When I give you a new App.js:
1. Replace src/App.js with the new file
2. Run: vercel --prod
Done. Live in 30 seconds.

---

### SECURITY NOTE
After deploying, regenerate both API keys:
- Trading 212: Settings → API → Delete old key → Generate new
- Finnhub: finnhub.io → Dashboard → Regenerate
Then update them in Vercel environment variables.

---

### WHAT THE APP DOES
- Connects to Trading 212 API every 2 minutes — live positions, shares, avg prices
- Connects to Finnhub every 60 seconds — live prices for all holdings
- Full candlestick charts with MA20, MA50, Fibonacci, Support/Resistance
- 1000-point conviction scoring system
- Dynamic allocation engine (enter your monthly budget, toggle buckets)
- Watchlist analyser — type any ticker, get instant analysis + chart
