import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { asset } = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ summary: "Gemini API key not configured. Summary unavailable." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze the following crypto asset for current momentum and "Early Buyer" potential:
      Name: ${asset.name}
      Symbol: ${asset.symbol}
      Price: $${asset.current_price}
      24h Change: ${asset.price_change_percentage_24h}%
      Volume/Market Cap Ratio: ${asset.volumeMCapRatio}
      Market Cap Rank: ${asset.market_cap_rank}
      
      Provide a brief (2-3 sentence) summary explaining if this is a high-potential breakout or a potential fakeout. Use trader terminology like "bullish divergence", "accumulation", or "volume-backed expansion".
    `;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('AI Analysis Error:', error.message);
    return NextResponse.json({ summary: "Analyis temporarily unavailable." }, { status: 500 });
  }
}
