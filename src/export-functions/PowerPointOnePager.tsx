import React, { useState } from 'react';
import PptxGenJS from 'pptxgenjs';
import { generateSimplePieChart } from '@/lib/pieChartGenerator';

interface PowerPointOnePagerProps {
  project: any;
  aiSummary?: string;
  children?: (props: { loading: boolean; generatePowerPoint: () => void }) => React.ReactNode;
}

const PowerPointOnePager: React.FC<PowerPointOnePagerProps> = ({ project, aiSummary, children }) => {
  if (!project) {
    console.warn('PowerPointOnePager: No project data provided');
    return null;
  }

  const [loading, setLoading] = useState(false);

  // Use calculated values from the controller
  const totalBenefit = project.totalBenefit || 0;
  const totalCost = project.totalCost || project.budget || 0;
  const roi = project.roi || 0;
  const paybackPeriod = project.paybackPeriod || 0;
  const sharingScore = project.sharingScore || 0;
  
  // Localization: count actual locations
  const locationCount = project.location && project.location !== 'Ej specificerat' ? 
    project.location.split(',').length : 0;
  
  // Use AI summary or fallback to project description
  const summaryText = aiSummary || project.intro || project.description || 'Ingen sammanfattning tillgänglig för detta projekt.';

  // Define formatCurrency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare cost data for pie chart
  const costData: Array<{x: string, y: number, label: string}> = [];
  if (project.cost_data && project.cost_data.actualCostDetails && project.cost_data.actualCostDetails.costEntries && project.cost_data.actualCostDetails.costEntries.length > 0) {
    project.cost_data.actualCostDetails.costEntries.forEach((entry: any, index: number) => {
      if (!entry) return;
      
      let entryTotal = 0;
      let entryLabel = '';
      
      try {
        switch (entry?.costUnit) {
          case 'hours':
            const hours = Number(entry.hoursDetails?.hours) || 0;
            const hourlyRate = Number(entry.hoursDetails?.hourlyRate) || 0;
            entryTotal = hours * hourlyRate;
            entryLabel = entry.costLabel || entry.description || entry.hoursDetails?.description || 'Timmar';
            break;
          case 'fixed':
            entryTotal = Number(entry.fixedDetails?.fixedAmount) || 0;
            entryLabel = entry.costLabel || entry.description || entry.fixedDetails?.description || 'Fast kostnad';
            break;
          case 'monthly':
            const monthlyAmount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
            const monthlyDuration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
            entryTotal = monthlyAmount * monthlyDuration;
            entryLabel = entry.costLabel || entry.description || entry.monthlyDetails?.description || 'Månadsvis kostnad';
            break;
          case 'yearly':
            const yearlyAmount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
            const yearlyDuration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
            entryTotal = yearlyAmount * yearlyDuration;
            entryLabel = entry.costLabel || entry.description || entry.yearlyDetails?.description || 'Årlig kostnad';
            break;
        }
      } catch (error) {
        console.warn('Error calculating cost entry for chart:', error);
        return;
      }
      
      if (entryTotal > 0) {
        costData.push({
          x: entryLabel,
          y: entryTotal,
          label: `${formatCurrency(entryTotal)}`
        });
      }
    });
  }
  
  // If no cost data, create a simple placeholder
  if (costData.length === 0) {
    costData.push({
      x: 'Ingen kostnadsdata',
      y: 1,
      label: 'N/A'
    });
  }

  // Chart colors
  const chartColors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];

  const generatePowerPoint = async () => {
    setLoading(true);
    try {
      const pptx = new PptxGenJS();
    
    // Set slide size to 16:9 aspect ratio
    pptx.layout = 'LAYOUT_16x9';
    
    // Add a slide
    const slide = pptx.addSlide();
    
    // Set background color to match PDF theme
    slide.background = { color: '#1a1a2e' };
    
    // Header section
    slide.addText(project.title || 'Ej namngivet projekt', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.8,
      fontSize: 24,
      fontFace: 'Arial',
      bold: true,
      color: '#ffffff',
      align: 'left',
    });
    
    // Project info (location and status)
    const locationText = `${project.location || 'Ej specificerat'} | Status: ${project.phase || 'Ej specificerat'}`;
    slide.addText(locationText, {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 0.3,
      fontSize: 12,
      fontFace: 'Arial',
      color: '#cccccc',
      align: 'left',
    });
    
    // Summary section
    slide.addText('SAMMANFATTNING', {
      x: 0.5,
      y: 1.6,
      w: 9,
      h: 0.3,
      fontSize: 14,
      fontFace: 'Arial',
      bold: true,
      color: '#ffffff',
      align: 'left',
    });
    
    slide.addText(summaryText, {
      x: 0.5,
      y: 1.9,
      w: 9,
      h: 1.2,
      fontSize: 11,
      fontFace: 'Arial',
      color: '#ffffff',
      align: 'left',
      valign: 'top',
      wrap: true,
    });
    
    // ROI Section
    slide.addText(`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`, {
      x: 0.5,
      y: 3.3,
      w: 2,
      h: 0.8,
      fontSize: 32,
      fontFace: 'Arial',
      bold: true,
      color: '#ffd700',
      align: 'center',
      valign: 'middle',
    });
    
    slide.addText('Return on Investment', {
      x: 0.5,
      y: 4.1,
      w: 2,
      h: 0.3,
      fontSize: 12,
      fontFace: 'Arial',
      color: '#ffffff',
      align: 'center',
    });
    
    // Key figures grid
    const metrics = [
      { label: 'TOTAL NYTTA', value: `${(totalBenefit / 1000000).toFixed(1)} Mkr` },
      { label: 'TOTAL KOSTNAD', value: `${(totalCost / 1000000).toFixed(1)} Mkr` },
      { label: 'ÅTERBETALNINGSTID', value: `${paybackPeriod > 0 ? paybackPeriod.toFixed(1) : '0.0'} år` },
      { label: 'LOKALISERING', value: locationCount.toString() },
      { label: 'DELNINGSPOÄNG', value: `${sharingScore}%` },
    ];
    
    metrics.forEach((metric, index) => {
      const x = 3 + (index * 1.4);
      slide.addText(metric.value, {
        x,
        y: 3.3,
        w: 1.2,
        h: 0.4,
        fontSize: 16,
        fontFace: 'Arial',
        bold: true,
        color: '#ffffff',
        align: 'center',
        valign: 'middle',
      });
      
      slide.addText(metric.label, {
        x,
        y: 3.7,
        w: 1.2,
        h: 0.3,
        fontSize: 9,
        fontFace: 'Arial',
        color: '#ffffff',
        align: 'center',
      });
    });
    
    // Progress bar for sharing score
    slide.addText('DELNINGSPOÄNG PROGRESS', {
      x: 0.5,
      y: 4.6,
      w: 9,
      h: 0.3,
      fontSize: 10,
      fontFace: 'Arial',
      color: '#ffffff',
      align: 'center',
    });
    
    // Progress bar background
    slide.addShape('rect', {
      x: 0.5,
      y: 4.9,
      w: 9,
      h: 0.2,
      fill: { color: '#666666' },
      line: { color: '#666666' },
    });
    
    // Progress bar fill
    slide.addShape('rect', {
      x: 0.5,
      y: 4.9,
      w: (sharingScore / 100) * 9,
      h: 0.2,
      fill: { color: '#ffffff' },
      line: { color: '#ffffff' },
    });
    
    // Cost distribution section (right side)
    slide.addText('KOSTNADSFÖRDELNING', {
      x: 10.5,
      y: 1.6,
      w: 3.5,
      h: 0.3,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: '#ffffff',
      align: 'center',
    });
    
    // Add pie chart image
    try {
      const pieChartImage = generateSimplePieChart(costData);
      slide.addImage({
        data: pieChartImage,
        x: 10.5,
        y: 2,
        w: 1.5,
        h: 1.5,
      });
      
      // Legend
      costData.forEach((item, index) => {
        const color = chartColors[index % chartColors.length];
        const y = 2 + (index * 0.25);
        
        // Color dot
        slide.addShape('ellipse', {
          x: 12.2,
          y: y + 0.05,
          w: 0.1,
          h: 0.1,
          fill: { color },
          line: { color },
        });
        
        // Label
        slide.addText(item.x, {
          x: 12.4,
          y,
          w: 1.5,
          h: 0.2,
          fontSize: 9,
          fontFace: 'Arial',
          color: '#ffffff',
          align: 'left',
          valign: 'middle',
        });
        
        // Value
        slide.addText(formatCurrency(item.y), {
          x: 12.4,
          y: y + 0.2,
          w: 1.5,
          h: 0.15,
          fontSize: 8,
          fontFace: 'Arial',
          bold: true,
          color: '#ffd700',
          align: 'left',
        });
      });
    } catch (error) {
      console.warn('Error adding pie chart to PowerPoint:', error);
    }
    
    // Footer
    slide.addText(`AI Sweden - Kommunkartan MVP | Genererad ${new Date().toLocaleDateString('sv-SE')}`, {
      x: 0.5,
      y: 6.8,
      w: 9,
      h: 0.3,
      fontSize: 10,
      fontFace: 'Arial',
      color: '#888888',
      align: 'center',
    });
    
    // Save the presentation
    const filename = `${project.title || 'projekt'}_onepager.pptx`;
    await pptx.writeFile({ fileName: filename });
    } catch (error) {
      console.error('Error generating PowerPoint:', error);
    } finally {
      setLoading(false);
    }
  };

  // If children is provided, use render prop pattern
  if (children) {
    return <>{children({ loading, generatePowerPoint })}</>;
  }

  // Fallback to button for backward compatibility
  return (
    <button 
      onClick={generatePowerPoint}
      disabled={loading}
      style={{
        padding: '10px 20px',
        backgroundColor: '#ffd700',
        color: '#1a1a2e',
        border: 'none',
        borderRadius: '5px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: loading ? 'not-allowed' : 'pointer',
        margin: '10px 0',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? 'Genererar...' : '📊 Exportera som PowerPoint'}
    </button>
  );
};

export default PowerPointOnePager; 