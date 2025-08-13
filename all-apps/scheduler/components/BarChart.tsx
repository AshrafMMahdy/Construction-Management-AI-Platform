
import React, { useState, useRef, useMemo, useLayoutEffect } from 'react';
import { ChartDataPoint } from '../types';

interface BarChartProps {
  data: ChartDataPoint[];
  yAxisLabel: string;
}

const MARGIN = { top: 20, right: 20, bottom: 60, left: 60 };

const BarChart: React.FC<BarChartProps> = ({ data, yAxisLabel }) => {
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

  const { xScale, yScale, yAxisTicks } = useMemo(() => {
    if (innerWidth <= 0 || innerHeight <= 0 || data.length === 0) {
      return { xScale: () => 0, yScale: () => 0, yAxisTicks: [] };
    }

    const yMax = Math.max(...data.map(d => d.value)) * 1.1 || 10;
    const yScale = (value: number) => innerHeight - (value / yMax) * innerHeight;

    const barWidth = innerWidth / data.length;
    const xScale = (index: number) => index * barWidth;
    
    const tickCount = 5;
    const yAxisTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
        const value = Math.ceil((yMax / tickCount) * i);
        return { value, y: yScale(value) };
    });

    return { xScale, yScale, yAxisTicks };
  }, [data, innerWidth, innerHeight]);

  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>, point: ChartDataPoint) => {
    if (!containerRef.current) return;
    const svgRect = containerRef.current.getBoundingClientRect();
    setTooltip({
        visible: true,
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top,
        content: point
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      {width > 0 && (
        <svg width="100%" height="100%">
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {/* Axes */}
            <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#778DA9" strokeWidth="1" />
            <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#778DA9" strokeWidth="1" />

            {/* Y-Axis Ticks and Labels */}
            {yAxisTicks.map(tick => (
              <g key={tick.value} className="text-xs text-brand-muted fill-current">
                <line x1="-5" y1={tick.y} x2={innerWidth} y2={tick.y} stroke="#E0E1DD" strokeOpacity="0.1" strokeDasharray="2,2" />
                <text x="-10" y={tick.y} dominantBaseline="middle" textAnchor="end">{tick.value}</text>
              </g>
            ))}

             {/* Y-Axis Title */}
             <text
                transform={`translate(-${MARGIN.left - 20}, ${innerHeight / 2}) rotate(-90)`}
                textAnchor="middle"
                className="text-sm font-semibold text-brand-light fill-current"
            >
                {yAxisLabel}
            </text>

            {/* Bars and X-axis labels */}
            {data.map((d, i) => {
                const barWidth = (innerWidth / data.length) * 0.8;
                const barX = xScale(i) + (innerWidth / data.length - barWidth) / 2;
                const barY = yScale(d.value);
                const barHeight = innerHeight - barY;
                const showLabel = data.length <= 12 || i % Math.ceil(data.length / 12) === 0;

                return (
                    <g key={i}>
                         <rect
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={barHeight > 0 ? barHeight : 0}
                            fill="#FFB703"
                            className="opacity-70 hover:opacity-100 transition-opacity"
                            onMouseMove={(e) => handleMouseMove(e, d)}
                            onMouseLeave={handleMouseLeave}
                        />
                        {showLabel && (
                             <text
                                x={xScale(i) + (innerWidth / data.length) / 2}
                                y={innerHeight + 20}
                                textAnchor="middle"
                                className="text-xs text-brand-muted fill-current"
                            >
                                {d.label}
                            </text>
                        )}
                    </g>
                );
            })}
          </g>
        </svg>
      )}

      {tooltip.visible && tooltip.content && (
        <div
          className="absolute bg-brand-primary p-2 rounded-md shadow-lg pointer-events-none text-xs text-brand-light border border-brand-accent/50"
          style={{ top: tooltip.y, left: tooltip.x, transform: 'translate(10px, -110%)' }}
        >
          <p className="font-bold">{tooltip.content.label}</p>
          <p>{yAxisLabel}: <span className="font-semibold text-brand-accent">{tooltip.content.value.toLocaleString()}</span></p>
        </div>
      )}
    </div>
  );
};

export default BarChart;
