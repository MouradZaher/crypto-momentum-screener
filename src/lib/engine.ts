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
  isEarlyBuyer: boolean;
  intensity: 'Low' | 'Medium' | 'High' | 'Extreme';
}

export function calculateMomentum(asset: CryptoAsset): MomentumResult {
  const currentPrice = asset.current_price ?? 0;
  const marketCap = asset.market_cap ?? 1;
  const totalVolume = asset.total_volume ?? 0;
  const priceChange24 = asset.price_change_percentage_24h ?? 0;
  const priceChange7 = asset.price_change_percentage_7d_in_currency ?? 0;

  const volMCapRatio = totalVolume / (marketCap || 1);
  
  // Weight factors
  const vMCapWeight = 0.4;
  const pChange24Weight = 0.4;
  const pChange7Weight = 0.2;

  // Normalize scores (0-100)
  const vMCapScore = Math.min((volMCapRatio / 0.2) * 100, 100);
  const pChange24Score = Math.min((Math.max(priceChange24, 0) / 15) * 100, 100);
  const pChange7Score = Math.min((Math.max(priceChange7, 0) / 40) * 100, 100);

  const totalScore = (vMCapScore * vMCapWeight) + (pChange24Score * pChange24Weight) + (pChange7Score * pChange7Weight);

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
    isEarlyBuyer: volMCapRatio > 0.15,
    intensity,
  };
}
