import React, { useEffect, useRef } from 'react';

interface DataPoint {
  x: string;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showArea?: boolean;
  showTooltip?: boolean;
  formatY?: (value: number) => string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  color = '#1A6BFF',
  showGrid = true,
  showArea = true,
  showTooltip = true,
  formatY = (value) => value.toFixed(2),
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min and max values
    const yValues = data.map(d => d.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const yRange = maxY - minY || 1;

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
      }
      
      // Vertical grid lines
      const xStep = chartWidth / (data.length - 1 || 1);
      for (let i = 0; i < data.length; i += Math.ceil(data.length / 6)) {
        const x = padding + xStep * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
      }
    }

    // Create path points
    const points = data.map((point, index) => ({
      x: padding + (chartWidth / (data.length - 1 || 1)) * index,
      y: padding + chartHeight - ((point.y - minY) / yRange) * chartHeight
    }));

    // Draw area fill
    if (showArea) {
      ctx.fillStyle = color + '20'; // Add transparency
      ctx.beginPath();
      ctx.moveTo(points[0].x, padding + chartHeight);
      points.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.lineTo(points[points.length - 1].x, padding + chartHeight);
      ctx.closePath();
      ctx.fill();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 5; i++) {
      const value = maxY - (yRange / 5) * i;
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(formatY(value), padding - 10, y);
    }

    // Draw X-axis labels (show every nth label to avoid crowding)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelStep = Math.ceil(data.length / 6);
    
    data.forEach((point, index) => {
      if (index % labelStep === 0 || index === data.length - 1) {
        const x = padding + (chartWidth / (data.length - 1 || 1)) * index;
        ctx.fillText(point.x, x, padding + chartHeight + 10);
      }
    });

  }, [data, height, color, showGrid, showArea, formatY]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full relative" style={{ height: `${height}px` }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LineChart;