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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      backgroundColor: '#121f2b',
      padding: '15px',
      borderRadius: '8px'
    }}>
      {title && (
        <h3 style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#fffefa',
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
              stroke: '#fffefa',
              strokeWidth: 2,
            },
            labels: {
              fontSize: 8,
              fontWeight: 'bold',
              fill: '#fffefa',
            }
          }}
          labelComponent={
            <VictoryLabel
              style={{
                fontSize: 8,
                fontWeight: 'bold',
                fill: '#fffefa',
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
            justifyContent: 'space-between',
            fontSize: '8px',
            color: '#fffefa'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: colors[index % colors.length],
                borderRadius: '2px'
              }} />
              <span style={{ fontSize: '7px' }}>{item.x}</span>
            </div>
            <span style={{ 
              fontSize: '7px', 
              fontWeight: 'bold',
              color: '#fecb00'
            }}>
              {item.y.toLocaleString('sv-SE')} kr
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 