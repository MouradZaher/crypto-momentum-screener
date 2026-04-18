export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency?: number | null;
}

export interface MomentumResult extends CryptoAsset {
  momentumScore: number;
  volumeMCapRatio: number;
  momentumVelocity: number;
  betaFactor: number; // vs BTC
  isEarlyBuyer: boolean;
  intensity: 'Low' | 'Medium' | 'High' | 'Extreme';
}

/**
 * Advanced Quant Engine
 * Calculates multi-factor momentum including Velocity and Beta (Relative Strength)
 */
export function calculateMomentum(asset: CryptoAsset, btcChange24: number = 0): MomentumResult {
  const currentPrice = asset.current_price ?? 0;
  const marketCap = asset.market_cap ?? 1;
  const totalVolume = asset.total_volume ?? 0;
  const priceChange24 = asset.price_change_percentage_24h ?? 0;
  const priceChange7 = asset.price_change_percentage_7d_in_currency ?? 0;

  // 1. Fundamental Momentum: Vol/MCap
  const volMCapRatio = totalVolume / (marketCap || 1);
  
  // 2. Momentum Velocity: How 'efficient' is the price move?
  // High velocity = Low volume moving price significantly (supply vacuum)
  // Low velocity = High volume with little price move (churn)
  // We sanitize this to avoid division by zero and normalize it.
  const volumeNorm = Math.max(totalVolume / 1000000, 1); // Normalize to millions
  const velocity = Math.abs(priceChange24) / (Math.sqrt(volumeNorm) || 1);

  // 3. Beta Factor: Relative Strength vs Market Leader (BTC)
  // If > 1, asset is outperforming BTC's current move
  const betaFactor = btcChange24 !== 0 ? priceChange24 / btcChange24 : 1;

  // 4. Advanced Score Weights
  const weights = {
    volMCap: 0.35,
    pChange24: 0.35,
    pChange7: 0.15,
    velocity: 0.15
  };

  // Normalize scores (0-100)
  const vMCapScore = Math.min((volMCapRatio / 0.2) * 100, 100);
  const pChange24Score = Math.min((Math.max(priceChange24, 0) / 15) * 100, 100);
  const pChange7Score = Math.min((Math.max(priceChange7, 0) / 40) * 100, 100);
  const velocityScore = Math.min(velocity * 10, 100);

  const totalScore = (
    (vMCapScore * weights.volMCap) + 
    (pChange24Score * weights.pChange24) + 
    (pChange7Score * weights.pChange7) +
    (velocityScore * weights.velocity)
  );

  let intensity: MomentumResult['intensity'] = 'Low';
  if (totalScore > 80) intensity = 'Extreme';
  else if (totalScore > 60) intensity = 'High';
  else if (totalScore > 40) intensity = 'Medium';

  return {
    ...asset,
    current_price: currentPrice,
    market_cap: marketCap,
    total_volume: totalVolume,
    price_change_percentage_24h: priceChange24,
    momentumScore: Math.round(totalScore),
    volumeMCapRatio: Number(volMCapRatio.toFixed(4)),
    momentumVelocity: Number(velocity.toFixed(4)),
    betaFactor: Number(betaFactor.toFixed(2)),
    isEarlyBuyer: (volMCapRatio > 0.15 && priceChange24 > 5),
    intensity,
  };
}
