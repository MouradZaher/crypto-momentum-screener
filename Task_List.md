# CryptoMomentum Task List

## Phase 1: Foundation & Setup
- [ ] Initialize Next.js project with TypeScript, Tailwind, and Shadcn.
- [ ] Configure `.env.local` for CoinGecko and Gemini API keys.
- [ ] Set up basic layout with Institutional Dark Mode.

## Phase 2: Data Engine
- [ ] Implement CoinGecko API integration to fetch top 500 coins.
- [ ] implement Momentum Score logic in a utility function.
- [ ] Create `/api/market-data` route to serve processed data.

## Phase 3: AI Intelligence
- [ ] Integrate Google Gemini SDK.
- [ ] Create `/api/analyze` route to generate AI coin summaries.
- [ ] Implement caching or throttling to manage Gemini API usage.

## Phase 4: Frontend Development
- [ ] Build the "High Potential" data table with sorting and filtering.
- [ ] Create detail view/modal for AI analysis of specific coins.
- [ ] Add real-time price/volume indicators (sparklines if possible).

## Phase 5: Version Control & Deployment
- [ ] Initialize Git repository and add `.gitignore`.
- [ ] Create GitHub repository `crypto-momentum-screener` via browser agent.
- [ ] Push code to GitHub.
- [ ] Install Vercel CLI and deploy to production.
- [ ] Verify live URL and functionality.
