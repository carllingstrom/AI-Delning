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
  // Using the design system colorscale
  const colors = [
    '#fecb00', // Primary yellow
    '#007399', // Light blue
    '#004d66', // Blue
    '#34af8f', // Accent green
    '#ff153b', // Accent red
    '#224556', // Blue-gray
    '#f4f2e6', // Off-white
    '#fffefa', // White
    // Additional colors for more variety
    '#fecb00', // Primary yellow (repeated)
    '#007399', // Light blue (repeated)
    '#004d66', // Blue (repeated)
    '#34af8f', // Accent green (repeated)
    '#ff153b', // Accent red (repeated)
    '#224556', // Blue-gray (repeated)
    '#f4f2e6', // Off-white (repeated)
    '#fffefa'  // White (repeated)
  ];

  return (
    <div className="flex flex-col items-center p-6 bg-[#224556] rounded-lg shadow-lg">
      {title && (
        <h3 className="text-xl font-bold text-[#fecb00] mb-4 text-center">
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
              stroke: '#fffefa',
              strokeWidth: 2,
            },
            labels: {
              fontSize: 12,
              fontWeight: 'bold',
              fill: '#fffefa',
            }
          }}
          labelComponent={
            <VictoryLabel
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                fill: '#fffefa',
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
            <span className="text-sm text-[#fffefa] font-medium">
              {item.x}: {item.y}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 