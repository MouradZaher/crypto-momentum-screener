# CryptoMomentum Technical Specification

## Core Objective
Build a high-performance crypto screener that identifies momentum breakouts and "early buyer" signals across the top 500 assets using real-time data and AI-driven insights.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI (Radix UI)
- **State Management**: React Query (TanStack Query) for data fetching
- **API (Market Data)**: CoinGecko API (Free Tier)
- **API (AI)**: Google Gemini 1.5 Flash (via `@google/generative-ai`)
- **Deployment**: Vercel
- **Version Control**: GitHub

## Data Architecture
### Momentum Score Formula
`Score = (V_Spike * 0.4) + (V_MCap * 0.3) + (P_Action * 0.2) + (RSI_Factor * 0.1)`

- **V_Spike (Volume Spike)**: `24h_Volume / 7d_Avg_Volume`. Measures sudden interest.
- **V_MCap (Volume/Market Cap Ratio)**: `24h_Volume / Market_Cap`. Measures "Hidden Gem" potential (high turnover relative to size).
- **P_Action (Price Action)**: Weighted score of `24h_Change` and `7d_Change`.
- **RSI_Factor**: Proximity to 70 (Bullish Momentum) without being overly exhausted (e.g., peak at 75, penalized above 85).

### API Endpoints
1. `/api/market-data`: Fetches top 500 coins from CoinGecko, calculates momentum scores.
2. `/api/analyze`: Takes a coin's data and uses Gemini to generate a "Bullish Divergence" or "Accumulation" summary.

## UI Design Concepts
- **Institutional Dark Mode**: High-contrast, sleek interface with neon accents (green for bullish, red for bearish).
- **High Potential Hub**: A primary table featuring sorted momentum scores, volume ratios, and AI summaries.
- **Dynamic Indicators**: Mini-sparklines or progress bars for momentum intensity.

## Security & Secrets
- All API keys stored in `.env.local`.
- Proxied requests via Next.js API routes to hide keys from the client.

## Deployment & DevOps
- **GitHub**: Automated repository creation and push.
- **Vercel**: CLI-based deployment with production linking.
