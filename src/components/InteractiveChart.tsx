"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType, LineData } from "lightweight-charts";

interface SparklineChartProps {
  data: number[];
  color?: string;
}

/**
 * Lightweight Sparkline Chart for the Intelligence Hub
 */
export const SparklineChart = ({ data, color = "#3b82f6" }: SparklineChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      width: chartContainerRef.current.clientWidth,
      height: 120,
      timeScale: { visible: false },
      rightPriceScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });

    const series = (chart as any).addAreaSeries({
      topColor: color + "33",
      bottomColor: color + "00",
      lineColor: color,
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const lineData: LineData[] = data.map((val, i) => ({
      time: (Math.floor(Date.now() / 1000) - (data.length - i) * 3600) as any,
      value: val,
    }));

    series.setData(lineData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, color]);

  return <div ref={chartContainerRef} className="w-full h-[120px]" />;
};
