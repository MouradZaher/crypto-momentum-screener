"use client";

import { useState, useEffect, useRef } from 'react';

export interface TickerData {
  symbol: string;
  price: number;
}

/**
 * WebSocket hook for Binance real-time price stream (1s refresh)
 * Streams all USDT pair tickers for the Top 20-50 assets
 */
export function usePriceStream(enabled: boolean = true) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Binance WebSocket All Tickers stream
    ws.current = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (Array.isArray(data)) {
        const newPrices: Record<string, number> = {};
        data.forEach((ticker: any) => {
          // We only care about USDT pairs for the primary dashboard
          if (ticker.s.endsWith('USDT')) {
            const symbol = ticker.s.replace('USDT', '').toLowerCase();
            newPrices[symbol] = parseFloat(ticker.c);
          }
        });

        setPrices((prev) => ({
          ...prev,
          ...newPrices,
        }));
      }
    };

    ws.current.onerror = (error) => {
      console.error('Binance WS Error:', error);
    };

    ws.current.onclose = () => {
      console.log('Binance WS Closed');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [enabled]);

  return prices;
}
