# Incubator Protocol

The unified multichain terminal for traders. This platform provides charts, swaps, and analytics across Solana, Ethereum, Base, and Arbitrum.

## Getting Started

To run the application locally:

1. Install dependencies
   npm install

2. Configure environment
   Create a .env.local file in the root directory with your API keys (Alchemy, Firebase, Solana RPC).

3. Start the development server
   npm run dev

Open http://localhost:3000 to view the application.

## Architecture

This project is built with Next.js and uses a modern stack for performance and scalability.

- Framework: Next.js (App Router)
- Styling: Tailwind CSS
- State Management: Zustand
- Data Fetching: React Query & Firebase
- Web3: Wagmi (EVM) & @solana/web3.js

## Project Structure

- /src/app: Application routes and pages
- /src/components: Reusable UI components
- /src/lib: Utilities and service integrations (Alchemy, Solana, Firebase)
- /src/store: Global state management
- /src/types: TypeScript definitions

## Deployment

The application is configured for deployment on Firebase Hosting.
npm run build
firebase deploy --only hosting
