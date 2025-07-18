import React from 'react';
import { VictoryPie, VictoryLabel, VictoryTheme } from 'victory';

interface CostData {
  x: string;
  y: number;
}

interface CostPieChartProps {
  data: CostData[];
  width?: number;
  height?: number;
  title?: string;
}

export default function CostPieChart({ 
  data, 
  width = 120, 
  height = 120,
  title = "KOSTNADSFÖRDELNING"
}: CostPieChartProps) {
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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      backgroundColor: '#1a1a2e',
      padding: '15px',
      borderRadius: '8px'
    }}>
      {title && (
        <h3 style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          margin: '0 0 10px 0'
        }}>
          {title}
        </h3>
      )}
      
      <div style={{ position: 'relative' }}>
        <VictoryPie
          data={data}
          width={width}
          height={height}
          colorScale={colors}
          theme={VictoryTheme.material}
          style={{
            data: {
              stroke: '#ffffff',
              strokeWidth: 2,
            },
            labels: {
              fontSize: 8,
              fontWeight: 'bold',
              fill: '#ffffff',
            }
          }}
          labelComponent={
            <VictoryLabel
              style={{
                fontSize: 8,
                fontWeight: 'bold',
                fill: '#ffffff',
              }}
            />
          }
        />
      </div>
      
      {/* Legend */}
      <div style={{ 
        marginTop: '10px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px'
      }}>
        {data.map((item, index) => (
          <div key={item.x} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: colors[index % colors.length]
            }} />
            <span style={{
              fontSize: '8px',
              color: '#ffffff',
              flex: 1
            }}>
              {item.x}
            </span>
            <span style={{
              fontSize: '8px',
              color: '#FECB00',
              fontWeight: 'bold'
            }}>
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(item.y)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 