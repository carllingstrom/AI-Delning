'use client';

import React from 'react';
import CostPieChart from '@/components/CostPieChart';

export default function PieChartDemo() {
  // Sample cost data
  const sampleCostData = [
    { x: 'Timmar', y: 250000 },
    { x: 'Fast', y: 150000 },
    { x: 'Månadsvis', y: 80000 },
    { x: 'Årlig', y: 120000 },
  ];

  return (
    <div style={{ 
      backgroundColor: '#1a1a2e', 
      minHeight: '100vh', 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      <h1 style={{ color: '#ffffff', marginBottom: '20px' }}>
        Pie Chart Demo - Victory Chart
      </h1>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '20px'
      }}>
        <CostPieChart 
          data={sampleCostData}
          width={200}
          height={200}
          title="KOSTNADSFÖRDELNING"
        />
        
        <div style={{ color: '#ffffff', textAlign: 'center', maxWidth: '400px' }}>
          <h3>Victory Pie Chart Component</h3>
          <p>
            This is the Victory pie chart component that can be used in web applications. 
            It provides interactive charts with smooth animations and professional styling.
          </p>
          <p>
            <strong>Note:</strong> This component cannot be directly used in PDF exports 
            because Victory charts use SVG, which isn't supported by @react-pdf/renderer.
          </p>
        </div>
      </div>
    </div>
  );
} 