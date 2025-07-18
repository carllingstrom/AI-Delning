import React from 'react';
import { VictoryPie, VictoryLabel, VictoryTheme } from 'victory';

interface PieChartData {
  x: string;
  y: number;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  width?: number;
  height?: number;
  innerRadius?: number;
}

export default function PieChart({ 
  data, 
  title = "Data Distribution", 
  width = 400, 
  height = 400,
  innerRadius = 0
}: PieChartProps) {
  // AI Sweden theme colors
  const colors = [
    '#FECB00', // AI Sweden yellow
    '#0D1B2A', // Dark blue
    '#1B365D', // Medium blue
    '#2E5984', // Light blue
    '#4A90E2', // Sky blue
    '#7FB3D3', // Light sky blue
    '#A8D5BA', // Mint green
    '#F4A261', // Orange
    '#E76F51', // Red orange
    '#9B5DE5'  // Purple
  ];

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg">
      {title && (
        <h3 className="text-xl font-bold text-[#0D1B2A] mb-4 text-center">
          {title}
        </h3>
      )}
      
      <div className="relative">
        <VictoryPie
          data={data}
          width={width}
          height={height}
          innerRadius={innerRadius}
          colorScale={colors}
          theme={VictoryTheme.material}
          style={{
            data: {
              stroke: '#ffffff',
              strokeWidth: 2,
            },
            labels: {
              fontSize: 12,
              fontWeight: 'bold',
              fill: '#0D1B2A',
            }
          }}
          labelComponent={
            <VictoryLabel
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                fill: '#0D1B2A',
              }}
            />
          }
        />
      </div>
      
      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-2 max-w-md">
        {data.map((item, index) => (
          <div key={item.x} className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-[#0D1B2A] font-medium">
              {item.x}: {item.y}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 