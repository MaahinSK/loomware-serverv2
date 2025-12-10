# Stripe Webhook Testing Guide

## Problem
Stripe webhooks require a publicly accessible URL. If your server is running on localhost, Stripe cannot reach it.

## Solutions

### Option 1: Use Stripe CLI (Recommended for Local Development)

The Stripe CLI can forward webhook events from Stripe to your local server.

#### Setup Steps:

1. **Install Stripe CLI**
   - Windows: Download from https://github.com/stripe/stripe-cli/releases
   - Or use: `scoop install stripe`

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
   
   This will give you a webhook signing secret like: `whsec_xxxxx`

4. **Update your .env file**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

5. **In another terminal, trigger a test event**
   ```bash
   stripe trigger checkout.session.completed
   ```

6. **Watch your server console** for the webhook logs

### Option 2: Deploy Your Server to a Public URL

Deploy your server to:
- **Vercel** (easiest for Node.js)
- **Render** (free tier available)
- **Railway** (free tier available)
- **Heroku** (paid)

Then configure the webhook in Stripe dashboard to point to:
```
https://your-server.com/api/payments/webhook
```

### Option 3: Use ngrok (Temporary Testing)

1. **Install ngrok**: https://ngrok.com/download

2. **Start your server** on localhost:5000

3. **Run ngrok**
   ```bash
   ngrok http 5000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Configure Stripe webhook** to:
   ```
   https://abc123.ngrok.io/api/payments/webhook
   ```

6. **Get the webhook secret** from Stripe dashboard and update your `.env`

## Current Issue

Your client is deployed to: `https://loomware-a50ce.web.app/`

But your server needs to be publicly accessible for Stripe webhooks to work.

## Quick Check

Run this command to see if your webhook endpoint is accessible:
```bash
curl -X POST http://localhost:5000/api/payments/webhook
```

If you get a response, your endpoint exists but is only accessible locally.
