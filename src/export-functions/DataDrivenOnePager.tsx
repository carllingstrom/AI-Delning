import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { generateSimplePieChart } from '@/lib/pieChartGenerator';

// Register custom fonts
Font.register({
  family: 'GreycliffCF',
  fonts: [
    { src: '/fonts/ConnaryFagen-GreycliffCFRegular.otf', fontWeight: 'normal' },
    { src: '/fonts/ConnaryFagen-GreycliffCFBold.otf', fontWeight: 'bold' },
    { src: '/fonts/ConnaryFagen-GreycliffCFHeavy.otf', fontWeight: 'heavy' },
    { src: '/fonts/ConnaryFagen-GreycliffCFExtraLight.otf', fontWeight: 'ultralight' },
  ]
});

// Create styles to identically match the attached picture
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#1a1a2e', // Dark blue background
    padding: 25, // Reduced padding
    fontFamily: 'GreycliffCF',
    color: '#ffffff',
    height: '100%',
  },
  
  // Project Header - much more compact
  header: {
    flexDirection: 'column',
    marginBottom: 15, // Much smaller margin
  },
  
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  headerLeft: {
    flex: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 16, // Add consistent spacing between location and status
  },
  
  projectTitle: {
    fontSize: 16, // Smaller font for better fit
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4, // Minimal margin
  },
  
  projectLocation: {
    fontSize: 10,
    color: '#cccccc',
    marginRight: 16, // Ensure consistent spacing
  },
  projectStatus: {
    fontSize: 10,
    color: '#cccccc',
  },
  
  statusBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8, // Smaller padding
    paddingVertical: 3, // Smaller padding
    borderRadius: 3,
  },
  
  statusText: {
    fontSize: 10, // Smaller font
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  
  // Summary Section - much more compact with constrained height
  summarySection: {
    marginBottom: 20,
    minHeight: 80,
    maxHeight: 120,
    // No background, border, or special padding
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff', // Changed from #fecb00 to white
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryText: {
    fontSize: 10,
    color: '#ffffff',
    lineHeight: 1.4,
    textAlign: 'justify',
    flexWrap: 'wrap',
  },
  
  // Main content area - full width layout
  mainContent: {
    flexDirection: 'column',
    flex: 1,
  },
  
  // Bottom section for pie chart - full width layout
  bottomSection: {
    flexDirection: 'column',
    marginTop: 20,
  },
  
  // Pie chart container - takes right half of page
  pieChartContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginTop: 15,
  },
  
  // Right column for pie chart
  rightColumn: {
    width: '50%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  
  // Cost distribution section - right side
  costDistributionSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  
  // Chart section
  chartSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  
  chartTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  
  // ROI Section - more compact
  roiSection: {
    alignItems: 'center',
    marginBottom: 15, // Reduced from 25
  },
  
  roiValue: {
    fontSize: 18, // Reduced from 20
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 2, // Reduced from 4
  },
  
  roiLabel: {
    fontSize: 9, // Reduced from 10
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 1.1, // Reduced from 1.2
  },
  
  // Claw-down separator - more subtle
  separator: {
    height: 2, // Reduced from 3
    backgroundColor: '#ffd700',
    marginBottom: 15, // Reduced from 20
    position: 'relative',
  },
  
  separatorLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 2, // Reduced from 3
    height: 15, // Reduced from 20
    backgroundColor: '#ffd700',
  },
  
  separatorRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 2, // Reduced from 3
    height: 15, // Reduced from 20
    backgroundColor: '#ffd700',
  },
  
  // Key figures grid - more compact
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 12, // Reduced from 15
  },
  
  metricItem: {
    width: '18%',
    alignItems: 'center',
    marginBottom: 10, // Reduced from 15
  },
  
  metricValue: {
    fontSize: 18, // Reduced from 20
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2, // Reduced from 4
  },
  
  metricLabel: {
    fontSize: 9, // Reduced from 10
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 1.1, // Reduced from 1.2
  },
  
  // Progress bar for sharing score - more subtle
  progressSection: {
    marginBottom: 15, // Reduced from 20
  },
  
  progressLabel: {
    fontSize: 8, // Smaller for better fit
    color: '#ffffff',
    marginBottom: 6, // Reduced from 8
    textAlign: 'center',
  },
  
  progressBar: {
    height: 3, // Reduced from 4 - smaller but keep contrast
    backgroundColor: '#666666', // Back to original contrast
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff', // Back to original contrast
    borderRadius: 2,
  },
  
  // Simple pie chart styles
  pieChartSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  
  pieChartInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  
  pieChartImage: {
    width: 70,
    height: 70,
  },
  
  pieChartLegend: {
    flexDirection: 'column',
    gap: 3,
    minWidth: 100,
  },
  
  pieLegend: {
    width: '100%',
    flexDirection: 'column',
    gap: 4,
  },
  
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  
  legendColor: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  legendText: {
    fontSize: 8,
    color: '#ffffff',
    flex: 1,
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: 'normal',
  },
  
  legendValue: {
    fontSize: 7,
    color: '#ffd700',
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  

  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25, // Reduced
    left: 25, // Reduced
    right: 25, // Reduced
    textAlign: 'center',
    fontSize: 9, // Smaller
    color: '#888888',
  },



  totalCostSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  totalCostLabel: {
    fontSize: 9,
    color: '#ffffff',
    marginBottom: 3,
  },
  totalCostAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffd700',
  },
});

interface DataDrivenOnePagerProps {
  project: any;
  aiSummary?: string;
}

const DataDrivenOnePager: React.FC<DataDrivenOnePagerProps> = ({ project, aiSummary }) => {
  if (!project) {
    console.warn('DataDrivenOnePager: No project data provided');
    return null;
  }

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

  // Define formatCurrency function first
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare cost data for pie chart
  const costData = [];
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





  // Chart colors - using the design system colorscale
  const chartColors = [
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

  // Extract technical information for future diagrams
  const technicalInfo = {
    technology: project.tech?.find((t: string) => t.startsWith('Teknologi:'))?.replace('Teknologi: ', '') || 'Ej specificerat',
    implementation: project.tech?.find((t: string) => t.startsWith('Implementation:'))?.replace('Implementation: ', '') || 'Ej specificerat',
    integration: project.tech?.find((t: string) => t.startsWith('Integration:'))?.replace('Integration: ', '') || 'Ej specificerat',
    riskLevel: project.risk || 'Ej specificerat'
  };

  // Extract legal and compliance information
  const legalInfo = {
    gdprRisk: project.legal_data?.gdprRisk || 'Ej specificerat',
    aiRisk: project.legal_data?.aiRisk || 'Ej specificerat',
    procurementType: project.legal_data?.procurementType || 'Ej specificerat',
    openSource: project.legal_data?.openSource || 'Ej specificerat'
  };

  // Extract areas and value dimensions for categorization
  const areas = project.areas || [];
  const valueDimensions = project.value_dimensions || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Project Header - smaller and more compact */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.projectTitle}>{project.title || 'Ej namngivet projekt'}</Text>
              <View style={styles.headerInfo}>
                <Text style={styles.projectLocation}>{project.location || 'Ej specificerat'}</Text>
                <Text style={styles.projectStatus}>Status: {project.phase || 'Ej specificerat'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Summary Section - smaller and more compact */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>SAMMANFATTNING</Text>
          <Text style={styles.summaryText}>
            {summaryText}
          </Text>
        </View>

        {/* Main content - full width layout */}
        <View style={styles.mainContent}>
          {/* ROI Section - full width */}
          <View style={styles.roiSection}>
            <Text style={styles.roiValue}>{roi >= 0 ? '+' : ''}{roi.toFixed(1)}%</Text>
            <Text style={styles.roiLabel}>Return on Investment</Text>
          </View>

          {/* Claw-down separator - full width */}
          <View style={styles.separator}>
            <View style={styles.separatorLeft} />
            <View style={styles.separatorRight} />
          </View>



          {/* Key figures grid - full width */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{(totalBenefit / 1000000).toFixed(1)} Mkr</Text>
              <Text style={styles.metricLabel}>TOTAL NYTTA</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{(totalCost / 1000000).toFixed(1)} Mkr</Text>
              <Text style={styles.metricLabel}>TOTAL KOSTNAD</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{paybackPeriod > 0 ? paybackPeriod.toFixed(1) : '0.0'} år</Text>
              <Text style={styles.metricLabel}>ÅTERBETALNINGSTID</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{locationCount}</Text>
              <Text style={styles.metricLabel}>LOKALISERING</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{sharingScore}%</Text>
              <Text style={styles.metricLabel}>DELNINGSPOÄNG</Text>
            </View>
          </View>

          {/* Progress bar for sharing score - full width */}
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>DELNINGSPOÄNG PROGRESS</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${sharingScore}%` }]} />
            </View>
          </View>

          {/* Bottom section - Pie chart on the right half */}
          <View style={styles.bottomSection}>
            {/* Pie chart container - takes right half of page */}
            <View style={styles.pieChartContainer}>
              {/* Right column - Cost distribution */}
              <View style={styles.rightColumn}>
                <View style={styles.costDistributionSection}>
                  <Text style={styles.chartTitle}>KOSTNADSFÖRDELNING</Text>
                  
                  {/* Simple Pie Chart */}
                  <View style={styles.pieChartSection}>
                    <View style={styles.pieChartInnerContainer}>
                      {/* Generate pie chart image */}
                      <Image 
                        src={generateSimplePieChart(costData)}
                        style={styles.pieChartImage}
                      />
                      
                      {/* Legend next to the chart */}
                      <View style={styles.pieChartLegend}>
                        {costData.map((item, index) => {
                          const percentage = totalCost > 0 ? (item.y / totalCost) * 100 : 0;
                          const color = chartColors[index % chartColors.length];
                          
                          return (
                            <View key={index} style={styles.legendItem}>
                              <View style={[styles.legendColor, { backgroundColor: color }]} />
                              <Text style={styles.legendText}>{item.x}</Text>
                              <Text style={styles.legendValue}>{formatCurrency(item.y)}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>AI Sweden - Projektportalen | Genererad {new Date().toLocaleDateString('sv-SE')}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default DataDrivenOnePager; 