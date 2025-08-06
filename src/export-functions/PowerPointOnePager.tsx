import React, { useState } from 'react';
import PptxGenJS from 'pptxgenjs';

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

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate project metrics
  const calculateProjectMetrics = () => {
    const costData = project.cost_data || {};
    const effectsData = project.effects_data || {};
    
    let totalCost = 0;
    let totalEffects = 0;
    
    // Calculate total costs
    if (costData.actualCostDetails?.costEntries) {
      costData.actualCostDetails.costEntries.forEach((entry: any) => {
        if (entry?.costUnit === 'fixed') {
          totalCost += Number(entry.fixedDetails?.fixedAmount) || 0;
        } else if (entry?.costUnit === 'hours') {
          const hours = Number(entry.hoursDetails?.hours) || 0;
          const rate = Number(entry.hoursDetails?.hourlyRate) || 0;
          totalCost += hours * rate;
        } else if (entry?.costUnit === 'monthly') {
          const amount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
          const duration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
          totalCost += amount * duration;
        } else if (entry?.costUnit === 'yearly') {
          const amount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
          const duration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
          totalCost += amount * duration;
        }
      });
    }
    
    // Calculate total effects value
    if (effectsData.effectDetails) {
      effectsData.effectDetails.forEach((effect: any) => {
        if (effect?.quantifiableValue) {
          totalEffects += Number(effect.quantifiableValue) || 0;
        }
      });
    }
    
    const roi = totalCost > 0 ? ((totalEffects - totalCost) / totalCost) * 100 : 0;
    
    return {
      totalCost,
      totalEffects,
      roi,
      hasQuantifiableData: totalEffects > 0,
      hasQualitativeData: effectsData.effectDetails?.some((e: any) => e?.qualitativeDescription) || false
    };
  };

  const determineFocusArea = () => {
    // Logic to determine the main focus area based on project data
    const technicalData = project.technical_data || {};
    const leadershipData = project.leadership_data || {};
    const legalData = project.legal_data || {};
    
    // Check for technical challenges
    if (technicalData.technical_obstacles || technicalData.technical_solutions) {
      return { area: 'Teknik', type: 'utmaning', color: '#ff153b' };
    }
    
    // Check for leadership/organizational focus
    if (leadershipData.projectOwnership || leadershipData.organizationalChange) {
      return { area: 'Organisation & ledarskap', type: 'möjliggörare', color: '#34af8f' };
    }
    
    // Check for legal/prerequisites
    if (legalData.gdpr_assessment || legalData.legal_review) {
      return { area: 'Juridik och etik', type: 'förutsättning', color: '#fecb00' };
    }
    
    // Default to technical challenge
    return { area: 'Teknik', type: 'utmaning', color: '#ff153b' };
  };

  const generatePowerPoint = async () => {
    setLoading(true);
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      
      const metrics = calculateProjectMetrics();
      const focusArea = determineFocusArea();
      
      // Slide 1: Project Overview with Focus Areas (exact copy from image 1)
      const slide1 = pptx.addSlide();
      slide1.background = { color: '#121f2b' };
      
      // AI Sweden logo (top right)
      slide1.addText('AI', {
        x: 13.5,
        y: 0.2,
        w: 1.5,
        h: 0.4,
        fontSize: 24,
        fontFace: 'Arial',
        bold: true,
        color: '#fecb00',
        align: 'center',
      });
      
      slide1.addText('SWEDEN', {
        x: 13.5,
        y: 0.6,
        w: 1.5,
        h: 0.2,
        fontSize: 10,
        fontFace: 'Arial',
        color: '#fffefa',
        align: 'center',
      });
      
      // Main title (exact text from image)
      slide1.addText('Här beskrivs möjliggörare och viktigaste (avgörande) detaljerna. Tex. Datakrav/tillgänglighet, juridiska utmaningar eller ledarskap.', {
        x: 0.5,
        y: 0.5,
        w: 12.5,
        h: 0.8,
        fontSize: 16,
        fontFace: 'Arial',
        bold: true,
        color: '#fffefa',
        align: 'left',
      });
      
      // Subtitle (exact text from image)
      slide1.addText('Här kan man prioritera mellan att highlighta en eller två av boxarna i någon av dimensionerna förutsättning, utmaning eller möjliggörare (tex. En bra ledning gjorde projektet betydligt mycket enklare.', {
        x: 0.5,
        y: 1.3,
        w: 12.5,
        h: 0.4,
        fontSize: 12,
        fontFace: 'Arial',
        color: '#fffefa',
        align: 'left',
      });
      
      // Three focus area boxes (exact layout from image)
      const boxes = [
        {
          title: 'Organisation & ledarskap',
          content: project.leadership_data?.projectOwnership || 'IT-ledd implementation - Teknisk fokus med risk för begränsad användaracceptans. Styrka: Teknisk expertis, men kan innebära framtida risker för verksamhetsförankring.',
          borderColor: focusArea.area === 'Organisation & ledarskap' ? focusArea.color : '#224556',
          x: 0.5
        },
        {
          title: 'Juridik och etik',
          content: project.legal_data?.gdpr_assessment || 'Högrisk-AI enligt AI-förordningen - kräver konformitetsbedömning. Upphandlingsmognad låg - pågående process under provisoriskt innovationsstöd förutsättning för genomförande.',
          borderColor: focusArea.area === 'Juridik och etik' ? focusArea.color : '#224556',
          x: 5.2
        },
        {
          title: 'Teknik',
          content: project.technical_data?.technical_obstacles || 'Ingen teknisk data tillgänglig',
          borderColor: focusArea.area === 'Teknik' ? focusArea.color : '#224556',
          x: 9.9
        }
      ];
      
      boxes.forEach((box) => {
        // Box background
        slide1.addShape('rect', {
          x: box.x,
          y: 2,
          w: 4.2,
          h: 4.5,
          fill: { color: '#224556' },
          line: { color: box.borderColor, width: 3 },
        });
        
        // Box title
        slide1.addText(box.title, {
          x: box.x + 0.2,
          y: 2.2,
          w: 3.8,
          h: 0.4,
          fontSize: 14,
          fontFace: 'Arial',
          bold: true,
          color: '#fffefa',
          align: 'center',
        });
        
        // Box content
        slide1.addText(box.content, {
          x: box.x + 0.2,
          y: 2.7,
          w: 3.8,
          h: 3.6,
          fontSize: 11,
          fontFace: 'Arial',
          color: '#fffefa',
          align: 'left',
          valign: 'top',
          wrap: true,
        });
      });
      
      // Slide 2: Effects and Costs (exact copy from image 2)
      const slide2 = pptx.addSlide();
      slide2.background = { color: '#121f2b' };
      
      // AI Sweden logo
      slide2.addText('AI', {
        x: 13.5,
        y: 0.2,
        w: 1.5,
        h: 0.4,
        fontSize: 24,
        fontFace: 'Arial',
        bold: true,
        color: '#fecb00',
        align: 'center',
      });
      
      slide2.addText('SWEDEN', {
        x: 13.5,
        y: 0.6,
        w: 1.5,
        h: 0.2,
        fontSize: 10,
        fontFace: 'Arial',
        color: '#fffefa',
        align: 'center',
      });
      
      // Main title (exact from image)
      slide2.addText('Effekter och kostnader + kvalitativa', {
        x: 0.5,
        y: 0.5,
        w: 12.5,
        h: 0.4,
        fontSize: 18,
        fontFace: 'Arial',
        bold: true,
        color: '#fffefa',
        align: 'left',
      });
      
      if (metrics.hasQuantifiableData) {
        // Left section: Quantified effects (exact from image)
        slide2.addShape('rect', {
          x: 0.5,
          y: 1.2,
          w: 6.5,
          h: 0.4,
          fill: { color: '#224556' },
        });
        
        slide2.addText('Kvantifierade effekter', {
          x: 0.7,
          y: 1.3,
          w: 6.1,
          h: 0.2,
          fontSize: 14,
          fontFace: 'Arial',
          bold: true,
          color: '#fffefa',
          align: 'left',
        });
        
        // Bar chart (exact from image)
        const maxValue = Math.max(metrics.totalEffects, metrics.totalCost);
        const effectsBarHeight = (metrics.totalEffects / maxValue) * 2;
        const costsBarHeight = (metrics.totalCost / maxValue) * 2;
        
        // Effects bar (light beige)
        slide2.addShape('rect', {
          x: 1,
          y: 2.5,
          w: 1.5,
          h: effectsBarHeight,
          fill: { color: '#f4f2e6' },
        });
        
        slide2.addText(formatCurrency(metrics.totalEffects), {
          x: 1,
          y: 2.5 + effectsBarHeight + 0.1,
          w: 1.5,
          h: 0.3,
          fontSize: 12,
          fontFace: 'Arial',
          bold: true,
          color: '#fffefa',
          align: 'center',
        });
        
        slide2.addText('Effekter', {
          x: 1,
          y: 2.5 + effectsBarHeight + 0.4,
          w: 1.5,
          h: 0.2,
          fontSize: 10,
          fontFace: 'Arial',
          color: '#fffefa',
          align: 'center',
        });
        
        // Costs bars (dark blue, stacked)
        slide2.addShape('rect', {
          x: 3,
          y: 2.5,
          w: 1.5,
          h: costsBarHeight,
          fill: { color: '#224556' },
        });
        
        slide2.addText(formatCurrency(metrics.totalCost), {
          x: 3,
          y: 2.5 + costsBarHeight + 0.1,
          w: 1.5,
          h: 0.3,
          fontSize: 12,
          fontFace: 'Arial',
          bold: true,
          color: '#fffefa',
          align: 'center',
        });
        
        slide2.addText('Kostnader', {
          x: 3,
          y: 2.5 + costsBarHeight + 0.4,
          w: 1.5,
          h: 0.2,
          fontSize: 10,
          fontFace: 'Arial',
          color: '#fffefa',
          align: 'center',
        });
        
        // ROI line and percentage (exact from image)
        slide2.addShape('line', {
          x: 1.75,
          y: 2.5 + effectsBarHeight,
          w: 1.25,
          h: 0,
          line: { color: '#fecb00', width: 2 },
        });
        
        slide2.addText(`${metrics.roi >= 0 ? '+' : ''}${metrics.roi.toFixed(1)}% Projektavkastning`, {
          x: 1.75,
          y: 2.5 + effectsBarHeight - 0.3,
          w: 1.25,
          h: 0.2,
          fontSize: 10,
          fontFace: 'Arial',
          bold: true,
          color: '#fecb00',
          align: 'center',
        });
        
        // Detailed breakdown (exact from image)
        slide2.addText('Detaljerad uppdelning:', {
          x: 0.7,
          y: 4.5,
          w: 6.1,
          h: 0.3,
          fontSize: 12,
          fontFace: 'Arial',
          bold: true,
          color: '#fffefa',
          align: 'left',
        });
        
        // Effects details
        if (project.effects_data?.effectDetails) {
          project.effects_data.effectDetails.forEach((effect: any, index: number) => {
            if (effect?.quantifiableValue) {
              slide2.addText(`${effect.effectTitle || 'Handläggare och chefer'}: ${formatCurrency(effect.quantifiableValue)}`, {
                x: 0.7,
                y: 4.8 + (index * 0.3),
                w: 6.1,
                h: 0.2,
                fontSize: 10,
                fontFace: 'Arial',
                color: '#fffefa',
                align: 'left',
              });
            }
          });
        }
        
        // Costs details
        if (project.cost_data?.actualCostDetails?.costEntries) {
          project.cost_data.actualCostDetails.costEntries.forEach((cost: any, index: number) => {
            let costValue = 0;
            if (cost?.costUnit === 'fixed') {
              costValue = Number(cost.fixedDetails?.fixedAmount) || 0;
            }
            if (costValue > 0) {
              slide2.addText(`${cost.costLabel || 'Interna resurser IT och projektledning'}: ${formatCurrency(costValue)}`, {
                x: 0.7,
                y: 5.5 + (index * 0.3),
                w: 6.1,
                h: 0.2,
                fontSize: 10,
                fontFace: 'Arial',
                color: '#fffefa',
                align: 'left',
              });
            }
          });
        }
      } else {
        // Qualitative effects section (when no quantified data)
        slide2.addShape('rect', {
          x: 0.5,
          y: 1.2,
          w: 6.5,
          h: 0.4,
          fill: { color: '#224556' },
        });
        
        slide2.addText('Kvalitativa effekter', {
          x: 0.7,
          y: 1.3,
          w: 6.1,
          h: 0.2,
          fontSize: 14,
          fontFace: 'Arial',
          bold: true,
          color: '#fffefa',
          align: 'left',
        });
        
        // Add qualitative content
        let yPos = 2;
        if (project.effects_data?.effectDetails) {
          project.effects_data.effectDetails.forEach((effect: any, index: number) => {
            if (effect?.qualitativeDescription) {
              slide2.addText(effect.effectTitle || 'Kvalitativ effekt', {
                x: 0.7,
                y: yPos,
                w: 6.1,
                h: 0.3,
                fontSize: 12,
                fontFace: 'Arial',
                bold: true,
                color: '#fffefa',
                align: 'left',
              });
              
              slide2.addText(effect.qualitativeDescription, {
                x: 0.7,
                y: yPos + 0.3,
                w: 6.1,
                h: 0.6,
                fontSize: 10,
                fontFace: 'Arial',
                color: '#fffefa',
                align: 'left',
                wrap: true,
              });
              
              yPos += 1.2;
            }
          });
        }
        
        if (yPos === 2) {
          slide2.addText('Inga kvalitativa effekter dokumenterade', {
            x: 0.7,
            y: 2,
            w: 6.1,
            h: 0.4,
            fontSize: 11,
            fontFace: 'Arial',
            color: '#fffefa',
            align: 'left',
          });
        }
      }
      
      // Right side - Qualitative effects (exact from image)
      slide2.addShape('rect', {
        x: 7.5,
        y: 1.2,
        w: 6.5,
        h: 0.4,
        fill: { color: '#224556' },
      });
      
      slide2.addText('Kvalitativa effekter', {
        x: 7.7,
        y: 1.3,
        w: 6.1,
        h: 0.2,
        fontSize: 14,
        fontFace: 'Arial',
        bold: true,
        color: '#fffefa',
        align: 'left',
      });
      
      // Add qualitative effects content (exact from image)
      let rightYPos = 2;
      if (project.effects_data?.effectDetails) {
        project.effects_data.effectDetails.forEach((effect: any) => {
          if (effect?.qualitativeDescription && rightYPos < 6) {
            slide2.addText(effect.effectTitle || 'Kvalitativ effekt', {
              x: 7.7,
              y: rightYPos,
              w: 6.1,
              h: 0.3,
              fontSize: 12,
              fontFace: 'Arial',
              bold: true,
              color: '#fffefa',
              align: 'left',
            });
            
            slide2.addText(effect.qualitativeDescription.substring(0, 150) + '...', {
              x: 7.7,
              y: rightYPos + 0.3,
              w: 6.1,
              h: 0.4,
              fontSize: 10,
              fontFace: 'Arial',
              color: '#fffefa',
              align: 'left',
              wrap: true,
            });
            
            rightYPos += 0.8;
          }
        });
      }
      
      if (rightYPos === 2) {
        slide2.addText('Inga kvalitativa effekter dokumenterade', {
          x: 7.7,
          y: 2,
          w: 6.1,
          h: 0.4,
          fontSize: 11,
          fontFace: 'Arial',
          color: '#fffefa',
          align: 'left',
        });
      }
      
      // Save as PDF
      const filename = `${project.title || 'projekt'}_presentation.pdf`;
      await pptx.writeFile({ fileName: filename, outputType: 'PDF' });
      
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
        backgroundColor: '#fecb00',
        color: '#121f2b',
        border: 'none',
        borderRadius: '5px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: loading ? 'not-allowed' : 'pointer',
        margin: '10px 0',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? 'Genererar...' : '📊 Exportera som PDF'}
    </button>
  );
};

export default PowerPointOnePager; 