# BlockSwarms

BlockSwarms is a blockchain dashboard platform built on Next.js with Solana integration. It features a token search functionality, wallet integration, and market data visualization.

## Features

- **Token Search**: Search any Solana token with real-time data from CoinGecko and Jupiter APIs
- **Dashboard**: Customizable dashboard with drag-and-drop widgets
- **Wallet Integration**: Connect your Solana wallet and view your balances and transactions
- **Wallet-based Authentication**: Secure user authentication using Solana wallets

## Tech Stack

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Solana Web3.js
- Solana Wallet Adapter
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
     - `COINGECKO_API_KEY`: Optional CoinGecko API key for higher rate limits
     - `NEXT_PUBLIC_SOLANA_RPC_URL`: Solana RPC URL (default is provided)
     - `ANTHROPIC_API_KEY`: For AI chat functionality
     - `OPENAI_API_KEY`: Alternative AI provider for chat functionality

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

The project follows clean architecture principles with all code now consolidated in the `src/` directory:

- `src/app/`: Next.js app router pages and API routes
- `src/presentation/`: UI components, hooks, and contexts
- `src/application/`: Application services and business logic
- `src/core/`: Domain entities, interfaces, and business rules
- `src/infrastructure/`: External services, adapters, and technical implementations
- `src/shared/`: Utilities, types, and cross-cutting concerns
- `public/`: Static assets
- `tests/`: Test files

## API Information

The project uses the following APIs:
- CoinGecko API for token data and price information
- Jupiter API as a fallback for Solana token information
- Solana Web3.js for blockchain interactions

## License

This project is licensed under the MIT License - see the LICENSE file for details.