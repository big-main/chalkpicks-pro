# Railway Deployment Guide for ChalkPicks Pro

## Quick Start (iPhone/Mobile)

### Step 1: Push to GitHub
1. Open GitHub on your iPhone
2. Go to your `chalkpicks-pro` repository
3. Upload these new files to the root:
   - `railway.json`
   - `nixpacks.toml`
   - `server.js`
   - `env.example`

Or use Git commands:
```bash
git add railway.json nixpacks.toml server.js env.example
git commit -m "feat: Add Railway deployment configuration"
git push origin main
```

### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Choose your `chalkpicks-pro` repository
5. Click **"Deploy"**

Railway will automatically:
- Detect `nixpacks.toml` for build config
- Run `npm ci && npm run build`
- Start with `node server.js`

### Step 3: Add Environment Variables
1. In Railway dashboard, go to **Variables** tab
2. Add these critical variables:

```
DATABASE_URL=mysql://user:pass@host/chalkpicks
JWT_SECRET=your-random-secret-key-here
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=sk_test_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
FIRECRAWL_API_KEY=your-firecrawl-key
```

3. Copy all other variables from `env.example` and fill in your values

### Step 4: Configure Domain
1. In Railway dashboard, go to **Settings** → **Domains**
2. Add custom domain: `chalkpicks.live`
3. Railway will give you a CNAME record
4. Update your domain registrar DNS settings:
   - Type: CNAME
   - Name: `chalkpicks.live`
   - Value: (Railway's CNAME value)

### Step 5: Deploy
1. Click **"Deploy"** button
2. Wait for build to complete (5-10 minutes)
3. Once deployed, visit `https://chalkpicks.live`

## What Each File Does

| File | Purpose |
|------|---------|
| `railway.json` | Tells Railway how to build and start the app |
| `nixpacks.toml` | Specifies Node 20, npm ci, npm run build |
| `server.js` | Express server that serves the SPA + proxies APIs |
| `env.example` | Template for all required environment variables |

## Troubleshooting

### Build Fails
- Check Railway logs: Dashboard → **Logs** tab
- Ensure `package.json` has `"type": "module"`
- Verify all dependencies are in `package.json`

### Site Shows 404
- Ensure `dist/public/index.html` exists after build
- Check that `server.js` is being executed
- Verify static files are in the right location

### API Calls Fail
- Check that all environment variables are set
- Verify `DATABASE_URL` is correct
- Ensure `STRIPE_SECRET_KEY` and other API keys are valid

### Domain Not Working
- Wait 24-48 hours for DNS propagation
- Verify CNAME record is set correctly
- Check Railway domain settings

## Environment Variables Checklist

✅ Required:
- `DATABASE_URL`
- `JWT_SECRET`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

✅ Recommended:
- `FIRECRAWL_API_KEY` (for web scraping)
- `OPENROUTER_API_KEY` (for LLM fallback)
- All Manus integration keys

## Post-Deployment

1. **Test the site**: Visit `https://chalkpicks.live`
2. **Test signup**: Create a test account
3. **Test promo code**: Use code `LAUNCH50`
4. **Test subscription**: Try a paid tier
5. **Monitor logs**: Check Railway logs for errors

## Support

- Railway Docs: https://docs.railway.app
- GitHub Issues: Create an issue in your repo
- Railway Support: https://railway.app/support

---

**Deployment Status**: Ready to deploy ✅
