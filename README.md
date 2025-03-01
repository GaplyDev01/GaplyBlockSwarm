# BlockSwarms

BlockSwarms is a blockchain dashboard platform built on Next.js with Solana integration. It features a token search functionality, wallet integration, and market data visualization.

## Features

- **Token Search**: Search any Solana token with real-time data from CoinGecko and Jupiter APIs
- **Dashboard**: Customizable dashboard with drag-and-drop widgets
- **Wallet Integration**: Connect your Solana wallet and view your balances and transactions
- **Clerk Authentication**: Secure user authentication with Clerk

## Tech Stack

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Solana Web3.js
- Clerk Auth
- Vercel Deployment

## Deployment to Vercel

1. **Create a Vercel Account**: If you don't already have one, sign up at [vercel.com](https://vercel.com)

2. **Install Vercel CLI** (optional):
   ```
   npm i -g vercel
   ```

3. **Deploy via Vercel Dashboard**:
   - Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
   - Import your repository in the Vercel dashboard
   - Configure the project settings:
     - Framework preset: Next.js
     - Root directory: ./
     - Build command: npm run build
     - Output directory: .next

4. **Configure Environment Variables**:
   - Add the necessary environment variables in the Vercel dashboard:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
     - `CLERK_SECRET_KEY`: Your Clerk secret key
     - `COINGECKO_API_KEY`: Optional CoinGecko API key for higher rate limits
     - `NEXT_PUBLIC_SOLANA_RPC_URL`: Solana RPC URL (default is provided)

5. **Deploy**:
   - Click "Deploy" in the Vercel dashboard or run:
   ```
   vercel
   ```

## Local Development

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd blockswarms
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Set up environment variables**:
   Copy `.env.example` to `.env.local` and fill in the values.
   ```
   cp .env.example .env.local
   ```

4. **Run the development server**:
   ```
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** to see the app.

## Project Structure

- `app/`: Next.js app router pages
- `components/`: React components
- `lib/`: Utility functions and services
- `public/`: Static assets
- `styles/`: Global styles
- `tests/`: Test files

## API Information

The project uses the following APIs:
- CoinGecko API for token data and price information
- Jupiter API as a fallback for Solana token information
- Solana Web3.js for blockchain interactions

## License

This project is licensed under the MIT License - see the LICENSE file for details.