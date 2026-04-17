import { NextResponse } from 'next/server';
import axios from 'axios';
import { calculateMomentum } from '@/lib/engine';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export async function GET() {
  try {
    const marketData = [];
    
    // Fetch top 500 (2 pages of 250)
    for (let page = 1; page <= 2; page++) {
      const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page,
          sparkline: false,
          price_change_percentage: '24h,7d',
        },
      });
      marketData.push(...response.data);
    }

    const processedData = marketData.map(calculateMomentum)
      .sort((a, b) => b.momentumScore - a.momentumScore);

    return NextResponse.json(processedData);
  } catch (error: any) {
    console.error('Market Data Fetch Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
