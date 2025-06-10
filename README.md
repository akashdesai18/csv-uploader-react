# CSV Pay Machine

A React application for processing CSV-based payments using the Payman SDK.

## Features

- OAuth-based authentication with Payman
- CSV file upload and parsing
- Batch payment processing
- Real-time payment status tracking
- Beautiful Material UI design

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your Payman credentials:
```env
VITE_PAYMAN_CLIENT_ID=your_client_id
VITE_PAYMAN_CLIENT_SECRET=your_client_secret
```

3. Run the development server:
```bash
npm run dev
```

## Deployment to Vercel

1. Install Vercel CLI (optional):
```bash
npm install -g vercel
```

2. Deploy using one of these methods:

### Method 1: Using Vercel Dashboard
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `VITE_PAYMAN_CLIENT_ID`
   - `VITE_PAYMAN_CLIENT_SECRET`
5. Deploy

### Method 2: Using Vercel CLI
1. Login to Vercel:
```bash
vercel login
```

2. Deploy:
```bash
vercel
```

3. Add environment variables:
```bash
vercel env add VITE_PAYMAN_CLIENT_ID
vercel env add VITE_PAYMAN_CLIENT_SECRET
```

4. Redeploy to apply environment variables:
```bash
vercel --prod
```

## Important Notes

- Make sure to set up the OAuth redirect URI in your Payman dashboard to match your Vercel deployment URL
- The application requires environment variables to be set up properly in Vercel
- All routes are configured to support client-side routing
