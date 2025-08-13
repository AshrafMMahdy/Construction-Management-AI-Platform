
import React, { useState, useRef, useMemo, useLayoutEffect } from 'react';
import { ChartDataPoint } from '../types';

interface LineChartProps {
  data: ChartDataPoint[];
  yAxisLabel: string;
}

const MARGIN = { top: 20, right: 30, bottom: 60, left: 80 };

const LineChart: React.FC<LineChartProps> = ({ data, yAxisLabel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: ChartDataPoint | null }>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });
  
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }
  }, []);

  const { width, height } = dimensions;
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const { xScale, yScale, linePath, areaPath, yAxisTicks } = useMemo(() => {
    if (innerWidth <= 0 || innerHeight <= 0 || data.length === 0) {
      return { xScale: () => 0, yScale: () => 0, linePath: '', areaPath: '', yAxisTicks: [] };
    }

    const yMax = Math.max(...data.map(d => d.value)) * 1.1 || 10;
    
    const yScale = (value: number) => innerHeight - (value / yMax) * innerHeight;
    const xScale = (index: number) => (data.length > 1 ? (index / (data.length - 1)) * innerWidth : innerWidth / 2);

    const linePoints = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`).join(' ');
    const linePath = `M${linePoints}`;

    const areaPath = data.length > 1 
      ? `M${xScale(0)},${innerHeight} L${linePoints} L${xScale(data.length - 1)},${innerHeight} Z`
      : `M${xScale(0) - (innerWidth / 2)},${innerHeight} L${xScale(0)},${yScale(data[0].value)} L${xScale(0) + (innerWidth / 2)},${innerHeight} Z`;


    const tickCount = 5;
    const yAxisTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
        const value = (yMax / tickCount) * i;
        return { value, y: yScale(value) };
    });

    return { xScale, yScale, linePath, areaPath, yAxisTicks };
  }, [data, innerWidth, innerHeight]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || data.length === 0 || innerWidth <= 0) return;
    const svgRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left - MARGIN.left;
    
    const index = Math.round((x / innerWidth) * (data.length - 1));
    if (index >= 0 && index < data.length) {
      const point = data[index];
      setTooltip({
        visible: true,
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top,
        content: point
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };
  
  const formatYAxisLabel = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toFixed(0);
  }

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      {width > 0 && (
        <svg width="100%" height="100%" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {/* Axes */}
            <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#778DA9" strokeWidth="1" />
            <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#778DA9" strokeWidth="1" />

            {/* Y-Axis Ticks and Labels */}
            {yAxisTicks.map(tick => (
              <g key={tick.value} className="text-xs text-brand-muted fill-current">
                <line x1="-5" y1={tick.y} x2={innerWidth} y2={tick.y} stroke="#E0E1DD" strokeOpacity="0.1" strokeDasharray="2,2" />
                <text x="-10" y={tick.y} dominantBaseline="middle" textAnchor="end">
                  {formatYAxisLabel(tick.value)}
                </text>
              </g>
            ))}
            
            {/* X-Axis Ticks and Labels */}
            {data.map((d, i) => {
                 const showLabel = data.length <= 12 || i % Math.ceil(data.length / 12) === 0;
                 if (!showLabel) return null;
                 return (
                    <text
                        key={i}
                        x={xScale(i)}
                        y={innerHeight + 20}
                        transform={`rotate(-45, ${xScale(i)}, ${innerHeight + 20})`}
                        textAnchor="end"
                        className="text-xs text-brand-muted fill-current"
                    >
                        {d.label}
                    </text>
                 )
            })}
           
            {/* Y-Axis Title */}
            <text
                transform={`translate(-${MARGIN.left - 20}, ${innerHeight / 2}) rotate(-90)`}
                textAnchor="middle"
                className="text-sm font-semibold text-brand-light fill-current"
            >
                {yAxisLabel}
            </text>

            {/* Data visualization */}
            <path d={areaPath} fill="url(#area-gradient)" />
            <path d={linePath} fill="none" stroke="#FFB703" strokeWidth="2" />
            
             {/* Data points */}
            {data.map((d, i) => (
                <circle key={i} cx={xScale(i)} cy={yScale(d.value)} r="4" fill="#FFB703" />
            ))}
          </g>

          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFB703" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#FFB703" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </svg>
      )}

      {tooltip.visible && tooltip.content && (
        <div
          className="absolute bg-brand-primary p-2 rounded-md shadow-lg pointer-events-none text-xs text-brand-light border border-brand-accent/50"
          style={{ top: tooltip.y + 10, left: tooltip.x + 10, transform: `translateY(-100%)` }}
        >
          <p className="font-bold">{tooltip.content.label}</p>
          <p>{yAxisLabel}: <span className="font-semibold text-brand-accent">{tooltip.content.value.toLocaleString()}</span></p>
        </div>
      )}
    </div>
  );
};

export default LineChart;
