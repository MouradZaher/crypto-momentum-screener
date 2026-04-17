"use client";

import React, { useState, useEffect } from "react";
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
  RefreshCw
} from "lucide-react";
import { MomentumResult } from "@/lib/engine";

export default function Dashboard() {
  const [assets, setAssets] = useState<MomentumResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<MomentumResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/market");
      setAssets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async (asset: MomentumResult) => {
    setSelectedAsset(asset);
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const { data } = await axios.post("/api/analyze", { asset });
      setAiAnalysis(data.summary);
    } catch (err) {
      setAiAnalysis("Analysis currently unavailable.");
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredAssets = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 lg:p-10 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <TrendingUp className="text-blue-500 w-10 h-10" />
            Crypto<span className="text-blue-500">Momentum</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
           Institutional-Grade Early Buyer Intelligence <Activity className="w-4 h-4 text-emerald-500" />
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search assets..."
              className="bg-[#0f172a] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 w-64 md:w-80 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchData} 
            className="p-2.5 rounded-lg border border-slate-800 bg-[#0f172a] hover:bg-slate-800 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]/50 text-slate-400 text-[10px] uppercase font-bold tracking-tighter border-b border-slate-800">
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">24h Change</th>
                    <th className="px-6 py-4">Vol/MCap Ratio</th>
                    <th className="px-6 py-4">Momentum Score</th>
                    <th className="px-6 py-4">Signals</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading ? (
                    [...Array(10)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4" colSpan={7}>
                          <div className="h-6 bg-slate-800/50 rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredAssets.map((asset) => (
                      <tr 
                        key={asset.id} 
                        className={`hover:bg-slate-800/30 transition-colors group ${selectedAsset?.id === asset.id ? 'bg-blue-900/10' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={asset.image} alt="" className="w-8 h-8 rounded-full" />
                            <div>
                              <div className="font-bold text-slate-100">{asset.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono tracking-widest">{asset.symbol.toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">
                          ${asset.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1 font-bold ${asset.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {asset.price_change_percentage_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {asset.price_change_percentage_24h.toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-sm">{asset.volumeMCapRatio}</span>
                            <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${asset.volumeMCapRatio > 0.15 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-600'}`} 
                                style={{ width: `${Math.min(asset.volumeMCapRatio * 300, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-lg font-black tracking-tighter ${asset.momentumScore > 75 ? 'momentum-extreme' : 'text-slate-100'}`}>
                            {asset.momentumScore}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {asset.isEarlyBuyer && (
                              <span className="bg-blue-900/30 text-blue-400 border border-blue-500/30 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Early Buyer
                              </span>
                            )}
                            {asset.momentumScore > 60 && (
                              <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                                <Activity className="w-3 h-3" /> High Momentum
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => runAnalysis(asset)}
                            className="text-slate-500 hover:text-blue-400 transition-colors p-1"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 sticky top-6">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Globe className="text-blue-500 w-6 h-6" />
              Intelligence Hub
            </h3>

            {!selectedAsset ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">Select an asset to generate AI-driven momentum analysis.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                  <img src={selectedAsset.image} alt="" className="w-12 h-12 rounded-full" />
                  <div>
                    <h4 className="text-xl font-bold">{selectedAsset.name}</h4>
                    <p className="text-slate-400 text-sm font-mono">{selectedAsset.symbol.toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Rank</p>
                    <p className="text-lg font-black font-mono">#{selectedAsset.market_cap_rank}</p>
                  </div>
                  <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Vol/MCap</p>
                    <p className="text-lg font-black font-mono">{selectedAsset.volumeMCapRatio}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3 text-blue-500" />
                    AI Insights (Gemini 1.5 Flash)
                  </p>
                  <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl min-h-[120px] text-slate-300 text-sm leading-relaxed relative overflow-hidden">
                    {analyzing ? (
                      <div className="flex flex-col gap-3 py-2">
                        <div className="h-4 bg-blue-500/10 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-blue-500/10 rounded w-[90%] animate-pulse"></div>
                        <div className="h-4 bg-blue-500/10 rounded w-[70%] animate-pulse"></div>
                      </div>
                    ) : (
                      aiAnalysis || "Click the 'AI Analyze' button to generate deep research."
                    )}
                  </div>
                </div>

                {!aiAnalysis && !analyzing && (
                  <button 
                    onClick={() => runAnalysis(selectedAsset)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
                  >
                    <Activity className="w-5 h-5" /> Generate Deep Analysis
                  </button>
                )}
                
                <div className="pt-4 border-t border-slate-800">
                   <p className="text-[10px] text-slate-600 italic">Disclaimers apply. All insights are generated by AI and do not constitute financial advice.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
