import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Principal Quant Analyst Persona Prompt
const SYSTEM_PROMPT = `You are a Principal Quant Developer and Skeptical Hedge fund Analyst at an elite crypto trading desk. 
Your goal is to debunk "fake-outs" and identify "True institutional breakouts" based on raw on-chain and price action data.
Be concise (2-3 sentences), razor-sharp, and use institutional trading terminology.
Distinguish between "Dead Cat Bouncing" (low momentum, high retail noise) and "Volume-backed accumulation" (supply vacuum).`;

export async function POST(req: Request) {
  try {
    const { asset } = await req.json();
    
    // Check for API key and provide instructional fallback
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return NextResponse.json({ 
        summary: "SYSTEM ERROR: Neural Link Offline. Please configure your GEMINI_API_KEY in the environment settings to unlock Principal Analyst intelligence. Current signals suggest high-velocity monitoring is operational, but qualitative research is locked.",
        isMissingKey: true
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT
    });

    const prompt = `
      RAW DATA UPLINK:
      Asset: ${asset.name} (${asset.symbol.toUpperCase()})
      Current Price: $${asset.current_price}
      24h Momentum Change: ${asset.price_change_percentage_24h}%
      Momentum Velocity: ${asset.momentumVelocity}x (Relative to Volume)
      Beta Factor: ${asset.betaFactor}β (Relative to BTC Trend)
      Vol/MCap Ratio: ${asset.volumeMCapRatio} (Lower is more liquid, Higher is early buyer territory)
      Total Momentum Score: ${asset.momentumScore}/100
      
      ANALYZE: Is this an institutional breakout or a retail pump? Provide a skeptical high-conviction assessment.
    `;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('AI Analysis Error:', error.message);
    return NextResponse.json({ 
      summary: "QUANT ADVISORY: Neural processing error. Check API quotas or model availability." 
    }, { status: 500 });
  }
}
