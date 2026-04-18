import { NextResponse } from 'next/server';
import axios from 'axios';
import { calculateMomentum } from '@/lib/engine';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export async function GET() {
  try {
    // Parallel fetch for better performance & to avoid Vercel 10s timeout
    const pages = [1, 2];
    const fetchPromises = pages.map(page => 
      axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page,
          sparkline: false,
          price_change_percentage: '24h,7d',
        },
        timeout: 8000, // 8 second timeout per request
      })
    );

    const responses = await Promise.all(fetchPromises);
    const marketData = responses.flatMap(res => res.data);

    if (!marketData || marketData.length === 0) {
      throw new Error('No data received from CoinGecko');
    }

    const processedData = marketData.map(calculateMomentum)
      .sort((a, b) => b.momentumScore - a.momentumScore);

    return NextResponse.json(processedData);
  } catch (error: any) {
    const errorMsg = error.response?.data?.status?.error_message || error.message;
    console.error('Market Data Fetch Error:', errorMsg);
    
    return NextResponse.json(
      { error: 'Failed to fetch market data', detail: errorMsg }, 
      { status: error.response?.status || 500 }
    );
  }
}
