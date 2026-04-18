"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { 
  TrendingUp, 
  Zap, 
  Search, 
  AlertCircle, 
  ChevronRight,
  TrendingDown,
  Activity,
  Globe,
  RefreshCw,
  AlertTriangle,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { MomentumResult, calculateMomentum } from "@/lib/engine";
import { usePriceStream } from "@/hooks/usePriceStream";
import { SparklineChart } from "./InteractiveChart";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

// Memoized individual asset row for 1s performance
const AssetRow = React.memo(({ asset, isSelected, onClick, livePrice }: { 
  asset: MomentumResult, 
  isSelected: boolean, 
  onClick: () => void,
  livePrice?: number 
}) => {
  return (
    <motion.tr 
      layout
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        backgroundColor: isSelected ? "rgba(37, 99, 235, 0.08)" : "transparent"
      }}
      exit={{ opacity: 0 }}
      className="group transition-all hover:bg-slate-800/40 cursor-pointer relative overflow-hidden"
      onClick={onClick}
    >
      {asset.momentumScore > 85 && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={asset.image} alt="" className="w-10 h-10 rounded-xl shadow-lg" />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#020617] ${livePrice ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
          </div>
          <div>
            <div className="font-black text-slate-100 uppercase tracking-tight text-lg">{asset.name}</div>
            <div className="text-[10px] text-blue-500/60 font-black tracking-[0.2em]">{asset.symbol.toUpperCase()}</div>
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
         <div className="flex flex-col">
           <span className="font-mono font-bold text-slate-100 text-lg tracking-tight">
             ${(livePrice || asset.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </span>
           <span className={`text-[11px] font-black flex items-center gap-1 ${(asset.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
             {(asset.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}{(asset.price_change_percentage_24h ?? 0).toFixed(2)}%
           </span>
         </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-10">
            <span className="font-mono text-sm font-bold text-slate-300">{(asset.momentumVelocity ?? 0).toFixed(2)}x</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]`} 
              animate={{ width: `${Math.min((asset.momentumVelocity ?? 0) * 20, 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
         <div className={`font-mono text-sm font-black ${(asset.betaFactor ?? 1) > 1.2 ? 'text-emerald-400' : (asset.betaFactor ?? 1) < 0.8 ? 'text-rose-400' : 'text-slate-400'}`}>
           {(asset.betaFactor ?? 1).toFixed(2)}β
         </div>
      </td>
      <td className="px-8 py-6 font-mono text-sm font-bold text-blue-400">
        {(asset.volumeMCapRatio || 0).toFixed(3)}
      </td>
      <td className="px-8 py-6">
        <div className={`text-2xl font-black tracking-tight ${asset.momentumScore > 80 ? 'text-emerald-400' : asset.momentumScore > 60 ? 'text-blue-400' : 'text-slate-100'}`}>
          {asset.momentumScore}
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex flex-wrap gap-2">
          {asset.isEarlyBuyer && (
            <motion.span 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="bg-emerald-500 text-[#020617] text-[10px] font-black px-2.5 py-1 rounded shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase tracking-tighter"
            >
              Early Entry
            </motion.span>
          )}
        </div>
      </td>
    </motion.tr>
  );
});

AssetRow.displayName = "AssetRow";

export default function Dashboard() {
  const [baseAssets, setBaseAssets] = useState<MomentumResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<MomentumResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [refreshTimer, setRefreshTimer] = useState(0);

  // 1s Real-Time Price Stream (Binance WebSocket)
  const livePrices = usePriceStream(true);

  // Sync WebSocket prices into the asset list at 1s intervals
  const assets = useMemo(() => {
    if (baseAssets.length === 0) return [];
    
    // Find BTC change for Beta calculation
    const btcAsset = baseAssets.find(a => a.symbol === 'btc');
    const btcChange = btcAsset?.price_change_percentage_24h || 0;

    const updated = baseAssets.map(asset => {
      const livePrice = livePrices[asset.symbol.toLowerCase()];
      if (livePrice && livePrice !== asset.current_price) {
        return calculateMomentum({ ...asset, current_price: livePrice }, btcChange);
      }
      return asset;
    });

    return updated.sort((a, b) => b.momentumScore - a.momentumScore);
  }, [baseAssets, livePrices]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setRefreshTimer(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async (isManual = false) => {
    if (isManual) setLoading(true);
    try {
      const { data } = await axios.get(`${COINGECKO_API}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: true,
          price_change_percentage: '24h',
        },
      });
      
      const btc = data.find((a: any) => a.symbol === 'btc');
      const btcChange = btc?.price_change_percentage_24h || 0;

      const processed = data.map((a: any) => calculateMomentum(a, btcChange));
      
      processed.forEach(asset => {
        if (asset.isEarlyBuyer && !baseAssets.find(prev => prev.id === asset.id)?.isEarlyBuyer) {
          toast.success(`SIGNAL DETECTED: ${asset.name}`, { description: "High volume consolidation breakout." });
        }
      });

      setBaseAssets(processed);
      setError(null);
    } catch (err: any) {
      if (isManual) setError("Telemetry data unavailable.");
    } finally {
      if (isManual) setLoading(false);
    }
  };

  const runAnalysis = useCallback(async (asset: MomentumResult) => {
    setSelectedAsset(asset);
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const { data } = await axios.post("/api/analyze", { asset });
      setAiAnalysis(data.summary);
    } catch (err) {
      setAiAnalysis("Neural interface restricted. Verify GEMINI_API_KEY.");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const filteredAssets = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 lg:p-10 font-sans tracking-tight">
      <Toaster theme="dark" position="top-right" richColors />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black tracking-tighter flex items-center gap-4 italic uppercase">
            <TrendingUp className="text-blue-500 w-12 h-12" />
            Terminal<span className="text-blue-500">Momentum</span>
          </h1>
          <div className="flex items-center gap-3 mt-3">
             <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-400 font-bold uppercase tracking-widest">v2.0 Elite</div>
             <p className="text-slate-500 text-xs font-semibold flex items-center gap-2">
               Binance WS Delta Sync <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-4">
             <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Cycle: {30 - (refreshTimer % 30)}s</span>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Matrix Identifier..."
              className="bg-[#0f172a] border border-slate-800 rounded-xl pl-12 pr-6 py-3.5 w-64 md:w-80 outline-none focus:border-blue-500 transition-all text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        <div className="xl:col-span-3">
          <div className="bg-[#0f172a]/40 backdrop-blur-3xl rounded-3xl overflow-hidden border border-slate-800/50 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]/60 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-800/50">
                    <th className="px-8 py-6">Intelligence</th>
                    <th className="px-8 py-6">Price ($)</th>
                    <th className="px-8 py-6">Velocity</th>
                    <th className="px-8 py-6">Beta</th>
                    <th className="px-8 py-6">V/MC</th>
                    <th className="px-8 py-6">Score</th>
                    <th className="px-8 py-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/20">
                  <AnimatePresence mode="popLayout">
                    {loading && baseAssets.length === 0 ? (
                      [...Array(8)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-8 py-6" colSpan={7}><div className="h-10 bg-slate-800/40 rounded-xl w-full"></div></td>
                        </tr>
                      ))
                    ) : (
                      filteredAssets.map((asset) => (
                        <AssetRow 
                          key={asset.id} 
                          asset={asset}
                          isSelected={selectedAsset?.id === asset.id}
                          onClick={() => runAnalysis(asset)}
                          livePrice={livePrices[asset.symbol.toLowerCase()]}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="bg-[#0f172a]/50 backdrop-blur-3xl rounded-3xl p-8 border border-slate-800/50 flex flex-col min-h-[700px] sticky top-10 shadow-3xl">
            <h3 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 mb-8">
              <Activity className="text-blue-500 w-8 h-8" />
              Intelligence Hub
            </h3>

            {!selectedAsset ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <AlertCircle className="w-16 h-16 mb-6" />
                <p className="text-sm uppercase font-black tracking-[0.2em]">Uplink Pending</p>
              </div>
            ) : (
              <div className="space-y-8 flex-1 flex flex-col">
                <div className="flex items-center gap-6 border-b border-slate-800/50 pb-8">
                  <img src={selectedAsset.image} alt="" className="w-16 h-16 rounded-2xl" />
                  <div>
                    <h4 className="text-2xl font-black uppercase tracking-tight leading-none">{selectedAsset.name}</h4>
                    <p className="text-blue-500 text-sm font-black tracking-[0.3em] mt-1">{selectedAsset.symbol.toUpperCase()}</p>
                  </div>
                </div>

                <div className="bg-[#020617]/50 rounded-2xl p-6 border border-slate-800 space-y-4">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">24h Neural Snapshot</p>
                  <SparklineChart 
                    data={(selectedAsset as any).sparkline_in_7d?.price?.slice(-24) || [1,2,3,4,3,2,3,4,5,4]} 
                    color={selectedAsset.price_change_percentage_24h && selectedAsset.price_change_percentage_24h > 0 ? "#10b981" : "#ef4444"}
                  />
                </div>

                <div className="flex-1 flex flex-col bg-[#020617]/40 border-2 border-slate-800/50 p-6 rounded-2xl">
                  <p className="text-[11px] text-slate-600 uppercase font-black tracking-widest mb-4 flex items-center justify-between">
                    AI Analysis 2.0
                    {analyzing && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                  </p>
                  <div className="text-slate-300 text-sm leading-relaxed overflow-y-auto max-h-[250px] scrollbar-hide">
                    {aiAnalysis || "Matrix analysis generated upon execution."}
                  </div>
                </div>

                {!aiAnalysis && !analyzing && (
                  <button 
                    onClick={() => runAnalysis(selectedAsset)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 px-6 rounded-2xl transition-all shadow-glow uppercase"
                  >
                    Generate Analysis
                  </button>
                )}

                <div className="p-4 bg-slate-800/20 rounded-xl border border-slate-800/50 flex items-start gap-3">
                   <Settings className="w-4 h-4 text-slate-500 mt-0.5" />
                   <div className="text-[10px] text-slate-500 leading-tight">
                      Neural interface requires <b>GEMINI_API_KEY</b>. Configure in Vercel settings for high-conviction insights.
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
