export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
}

export interface MomentumResult extends CryptoAsset {
  momentumScore: number;
  volumeMCapRatio: number;
  isEarlyBuyer: boolean;
  intensity: 'Low' | 'Medium' | 'High' | 'Extreme';
}

export function calculateMomentum(asset: CryptoAsset): MomentumResult {
  const volMCapRatio = asset.total_volume / (asset.market_cap || 1);
  
  // Weight factors
  const vMCapWeight = 0.4;
  const pChange24Weight = 0.4;
  const pChange7Weight = 0.2;

  // Normalize scores (0-100)
  const vMCapScore = Math.min((volMCapRatio / 0.2) * 100, 100);
  const pChange24Score = Math.min((Math.max(asset.price_change_percentage_24h, 0) / 15) * 100, 100);
  const pChange7Score = Math.min((Math.max(asset.price_change_percentage_7d_in_currency || 0, 0) / 40) * 100, 100);

  const totalScore = (vMCapScore * vMCapWeight) + (pChange24Score * pChange24Weight) + (pChange7Score * pChange7Weight);

  let intensity: MomentumResult['intensity'] = 'Low';
  if (totalScore > 80) intensity = 'Extreme';
  else if (totalScore > 60) intensity = 'High';
  else if (totalScore > 40) intensity = 'Medium';

  return {
    ...asset,
    momentumScore: Math.round(totalScore),
    volumeMCapRatio: Number(volMCapRatio.toFixed(4)),
    isEarlyBuyer: volMCapRatio > 0.15,
    intensity,
  };
}
