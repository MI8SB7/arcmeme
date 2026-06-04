import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, LineType } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import { BarChart2 } from 'lucide-react';
import { indexerApi } from '../utils/indexerApi';
import { useAppContext } from '../context/AppContext';
import { formatPrice } from '../utils/formatPrice';

interface TradingChartProps {
  marketAddress: string;
  refreshTrigger: number;
}

const TradingChartInner: React.FC<TradingChartProps> = ({ marketAddress, refreshTrigger }) => {
  const { theme } = useAppContext();
  const isLight = theme === 'light';

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const priceLineRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const [hasData, setHasData] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSinglePoint, setIsSinglePoint] = useState<boolean>(false);

  useEffect(() => {
    console.log("MINIMAL_EFFECT");
  }, []);

  useLayoutEffect(() => {
    console.log("MINIMAL_LAYOUT_EFFECT");
  }, []);

  console.log("BEFORE_USEEFFECT_DECLARATION");
  useEffect(() => {
    console.log("TRADING_CHART_EFFECT_START");
    let isMounted = true;
    
    const loadData = async () => {
      if (!marketAddress) return;
      
      try {
        const data = await indexerApi.getChartData(marketAddress);
        
        if (!isMounted) return;
        
        if (data.length === 0) {
          setHasData(false);
          setIsLoading(false);
          return;
        }

        // Sort data by time to satisfy lightweight-charts strictly increasing rule
        const sortedData = [...data].sort((a, b) => a.time - b.time);

        // Ensure unique times (sometimes rapid trades can share the same exact second)
        const uniqueData: { time: number, value: number }[] = [];
        const seenTimes = new Set<number>();
        
        for (const point of sortedData) {
          // If collision, bump by 1 second until free
          let t = point.time;
          while (seenTimes.has(t)) {
            t++;
          }
          seenTimes.add(t);
          uniqueData.push({ ...point, time: t });
        }

        // Patch removed from here, moved directly before setData() for exact logging

        console.log("RAW_TRADES_COUNT (from API)", data.length);
        console.log("UNIQUE_DATA_AFTER_DEDUPE_LOOP", uniqueData.length);

        setHasData(true);
        setIsLoading(false);
        setIsSinglePoint(uniqueData.length === 1);

        // Allow React to render the chart container before initializing
        setTimeout(() => {
          if (!isMounted) return;

        if (chartContainerRef.current && !chartRef.current) {
          try {
            console.log("BEFORE_CREATE_CHART");
            const exactWidth = chartContainerRef.current.clientWidth || 600;
            const exactHeight = chartContainerRef.current.clientHeight || 400;

            const chart = createChart(chartContainerRef.current, {
              layout: {
                background: { type: 'solid' as any, color: isLight ? '#FFFFFF' : '#050816' },
                textColor: isLight ? '#64748B' : '#94A3B8',
                fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
              },
              grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
              },
              timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderVisible: false,
                fixLeftEdge: true,
                fixRightEdge: true,
              },
              rightPriceScale: {
                borderVisible: false,
                scaleMargins: {
                  top: 0.1,
                  bottom: 0.1,
                },
              },
              width: exactWidth,
              height: exactHeight,
              crosshair: {
                mode: 1, // Magnet
                vertLine: {
                  color: isLight ? 'rgba(100, 116, 139, 0.4)' : 'rgba(148, 163, 184, 0.4)',
                  width: 1,
                  style: 3,
                  labelBackgroundColor: isLight ? '#F1F5F9' : '#1E293B',
                },
                horzLine: {
                  color: isLight ? 'rgba(100, 116, 139, 0.4)' : 'rgba(148, 163, 184, 0.4)',
                  width: 1,
                  style: 3,
                  labelBackgroundColor: isLight ? '#F1F5F9' : '#1E293B',
                },
              }
            });
            console.log("AFTER_CREATE_CHART");

            const exactWidth2 = chartContainerRef.current.clientWidth || 600;
            console.log("WIDTH_ASSIGNED", exactWidth2);
            console.log("HEIGHT", chartContainerRef.current.clientHeight);
            console.log("CANVAS_BEFORE_RESIZE", chartContainerRef.current.querySelector("canvas"));

            chart.resize(exactWidth2, exactHeight);
            chartRef.current = chart;
            
            console.log("CANVAS_AFTER_RESIZE", chartContainerRef.current.querySelector("canvas"));

            const newSeries = chart.addSeries(AreaSeries, {
              topColor: isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.3)',
              bottomColor: 'rgba(59, 130, 246, 0.0)',
              lineColor: '#3B82F6',
              lineWidth: 3,
              lineType: LineType.Curved,
              lastValueVisible: false,
              priceLineVisible: false,
              priceFormat: {
                type: 'custom',
                minMove: 0.000000000001,
                formatter: formatPrice,
              },
            });
            
            console.log("SERIES_CREATED", newSeries);
            seriesRef.current = newSeries;

            // Subscribe to crosshair move
            chart.subscribeCrosshairMove((param) => {
              const tooltip = tooltipRef.current;
              if (!tooltip) return;

              if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.y < 0
              ) {
                tooltip.style.display = 'none';
              } else {
                const data = param.seriesData.get(newSeries) as any;
                if (data && data.value !== undefined) {
                  tooltip.style.display = 'block';
                  
                  const date = new Date((param.time as number) * 1000);
                  const hh = String(date.getHours()).padStart(2, '0');
                  const mm = String(date.getMinutes()).padStart(2, '0');
                  const ss = String(date.getSeconds()).padStart(2, '0');
                  const timeStr = `${hh}:${mm}:${ss}`;

                  const price = data.value;
                  const formattedPriceHTML = formatPrice(price);

                  tooltip.innerHTML = `
                    <div class="flex flex-col space-y-1">
                      <div><span class="text-[#3B82F6] font-semibold">Price:</span> <span class="text-text" title="$${price.toFixed(18).replace(/0+$/, '').replace(/\.$/, '')}">$${formattedPriceHTML}</span></div>
                      <div><span class="text-[#3B82F6] font-semibold">Time:</span> <span class="text-text">${timeStr}</span></div>
                    </div>
                  `;
                } else {
                  tooltip.style.display = 'none';
                }
              }
            });
          } catch (err) {
            console.error("CHART_CRASH", err);
          }
        }

        if (seriesRef.current) {
          try {
            let dataToSet: any[] = uniqueData;
            if (uniqueData.length === 1) {
              dataToSet = [
                uniqueData[0],
                {
                  time: (uniqueData[0].time + 60),
                  value: uniqueData[0].value
                }
              ];
            }

            try {
              seriesRef.current.setData(dataToSet);
            } catch (err) {
              console.error("SETDATA_ERROR", err);
            }
            



            // Add floating price label near the latest point
            if (priceLineRef.current) {
              try {
                seriesRef.current.removePriceLine(priceLineRef.current);
              } catch (e) {}
              priceLineRef.current = null;
            }

            const lastPoint = dataToSet[dataToSet.length - 1];
            if (lastPoint) {
              priceLineRef.current = seriesRef.current.createPriceLine({
                price: lastPoint.value,
                color: 'rgba(59, 130, 246, 0.6)',
                lineWidth: 1.5,
                lineStyle: 2, // Dashed
                axisLabelVisible: false, // Hide label on axis
                title: `$${formatPrice(lastPoint.value)}`,
              });
            }
            
            chartRef.current?.timeScale().fitContent();
          } catch (err) {
            console.error("DATA_SET_CRASH", err);
          }
        } else {
          console.error("SERIES_REF_IS_NULL");
        }
        }, 0); // End of setTimeout

      } catch (err) {
        console.error("Failed to load chart data:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [marketAddress, refreshTrigger, theme]);

  // Clean up chart on unmount to prevent memory leaks
  useEffect(() => {
    console.log("EFFECT_START");
    return () => {
      console.log("EFFECT_CLEANUP");
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        priceLineRef.current = null;
      }
    };
  }, []);

  console.log("COMPONENT_BODY_END");
 
  return (
    <div className="glassmorphism-light p-4 rounded-xl border border-border/50 h-[420px] flex flex-col relative overflow-hidden">
      {/* Chart and Fallbacks Area */}
      <div className="flex-1 w-full relative">
        {/* Hover Crosshair Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute top-2 left-2 z-30 pointer-events-none bg-card/85 backdrop-blur-md border border-border/80 px-3 py-2 rounded-lg text-xs font-mono text-muted hidden"
        />

        {/* The chart container is ALWAYS rendered so the ref is NEVER null. */}
        <div 
          ref={chartContainerRef} 
          className="absolute inset-0" 
          style={{ opacity: hasData && !isLoading ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60 backdrop-blur-sm">
            <div className="w-8 h-8 border-4 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin"></div>
          </div>
        )}

        {!hasData && !isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background">
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex-1 border-b border-border/10 w-full"></div>
              ))}
            </div>
            <div className="relative z-10 flex flex-col items-center max-w-sm px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#10B981]/10 to-[rgba(6,182,212,0.1)] flex items-center justify-center mb-5 border border-[#10B981]/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <BarChart2 size={28} className="text-[#10B981]" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">No trading history yet</h3>
              <p className="text-muted text-sm leading-relaxed">
                📈 Trading data will appear here after the first trades occur. Execute the first trade to generate chart data!
              </p>
            </div>
          </div>
        )}

        {isSinglePoint && hasData && !isLoading && (
          <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
            <div className="bg-card/80 backdrop-blur-md border border-border/80 text-muted px-4 py-2 rounded-full text-sm shadow-lg">
              Waiting for more trades to build chart history...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export class TradingChartErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("RENDER_PHASE_CRASH", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color:'red',fontSize:'20px'}}>Chart Crash: {String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}

export const TradingChart: React.FC<TradingChartProps> = (props) => {
  return (
    <TradingChartErrorBoundary>
      <TradingChartInner {...props} />
    </TradingChartErrorBoundary>
  );
};
