'use client';

import React, { useRef, useEffect, useState } from 'react';
import { VictoryPie, VictoryLabel, VictoryTheme } from 'victory';
import html2canvas from 'html2canvas';

interface CostData {
  x: string;
  y: number;
}

interface PieChartToImageProps {
  data: CostData[];
  width?: number;
  height?: number;
  title?: string;
  onImageGenerated?: (base64Image: string) => void;
}

export default function PieChartToImage({ 
  data, 
  width = 200, 
  height = 200,
  title = "KOSTNADSFÖRDELNING",
  onImageGenerated
}: PieChartToImageProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [imageData, setImageData] = useState<string>('');

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

  useEffect(() => {
    const generateImage = async () => {
      if (chartRef.current) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            backgroundColor: '#121f2b',
            scale: 2, // Higher resolution
            useCORS: true,
            allowTaint: true,
          });
          
          const base64Image = canvas.toDataURL('image/png');
          setImageData(base64Image);
          
          if (onImageGenerated) {
            onImageGenerated(base64Image);
          }
        } catch (error) {
          console.error('Error generating pie chart image:', error);
        }
      }
    };

    // Generate image after component mounts
    const timer = setTimeout(generateImage, 100);
    return () => clearTimeout(timer);
  }, [data, onImageGenerated]);

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
      
      <div ref={chartRef} style={{ position: 'relative' }}>
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
              color: '#fecb00',
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