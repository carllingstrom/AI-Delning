import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

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

// Create styles for text-focused version - matching second image exactly
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'GreycliffCF',
    color: '#1a1a1a',
    height: '100%',
  },
  
  // Header - exactly like second image
  header: {
    marginBottom: 25,
  },
  
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  
  projectLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  
  projectOwner: {
    fontSize: 12,
    color: '#666666',
  },
  
  statusBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  
  statusText: {
    fontSize: 10,
    color: '#1a1a1a',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  // Yellow separator line - exactly like second image
  separatorLine: {
    height: 2,
    backgroundColor: '#ffd700',
    marginBottom: 25,
  },
  
  // Content sections - with yellow bars like second image
  section: {
    marginBottom: 20,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  
  yellowBar: {
    width: 4,
    height: 16,
    backgroundColor: '#ffd700',
  },
  
  sectionContent: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 1.5,
    marginLeft: 12, // Indent content under yellow bar
  },
  
  // Key info grid - structured like second image
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    gap: 20,
  },
  
  infoItem: {
    width: '45%',
    marginBottom: 12,
  },
  
  infoLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  
  infoValue: {
    fontSize: 11,
    color: '#1a1a1a',
  },
  
  // Footer - clean and minimal
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#888888',
    borderTop: '1px solid #eeeeee',
    paddingTop: 12,
  },
});

interface TextFocusedOnePagerProps {
  project: any;
  aiSummary?: string;
}

const TextFocusedOnePager: React.FC<TextFocusedOnePagerProps> = ({ project, aiSummary }) => {
  if (!project) return null;

  // Truncate AI summary to fit in constrained space
  const truncatedSummary = aiSummary 
    ? aiSummary.length > 150 ? aiSummary.substring(0, 150) + '...' : aiSummary
    : project.intro || project.description || 'Ingen sammanfattning tillgänglig för detta projekt.';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - exactly like second image */}
        <View style={styles.header}>
          <Text style={styles.projectTitle}>{project.title || 'Ej namngivet projekt'}</Text>
          <Text style={styles.projectLocation}>{project.location || 'Ej specificerat'}</Text>
          <View style={styles.projectMeta}>
            <Text style={styles.projectOwner}>{project.responsible || 'Ej specificerat'}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{project.phase || 'Ej specificerat'}</Text>
            </View>
          </View>
        </View>

        {/* Yellow separator line - exactly like second image */}
        <View style={styles.separatorLine} />

        {/* Summary Section - with yellow bar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.yellowBar} />
            <Text style={styles.sectionTitle}>Projektsammanfattning</Text>
          </View>
          <Text style={styles.sectionContent}>
            {truncatedSummary}
          </Text>
        </View>

        {/* Problem Section - with yellow bar */}
        {project.problem && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.yellowBar} />
              <Text style={styles.sectionTitle}>Problembeskrivning</Text>
            </View>
            <Text style={styles.sectionContent}>
              {project.problem.length > 120 ? project.problem.substring(0, 120) + '...' : project.problem}
            </Text>
          </View>
        )}

        {/* Opportunity Section - with yellow bar */}
        {project.opportunity && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.yellowBar} />
              <Text style={styles.sectionTitle}>Möjligheter</Text>
            </View>
            <Text style={styles.sectionContent}>
              {project.opportunity.length > 120 ? project.opportunity.substring(0, 120) + '...' : project.opportunity}
            </Text>
          </View>
        )}

        {/* Key Information Grid - with yellow bar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.yellowBar} />
            <Text style={styles.sectionTitle}>Nyckelinformation</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Kommun</Text>
              <Text style={styles.infoValue}>{project.municipality || 'Ej specificerat'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Områden</Text>
              <Text style={styles.infoValue}>
                {Array.isArray(project.areas) ? project.areas.join(', ') : project.areas || 'Ej specificerat'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Budget</Text>
              <Text style={styles.infoValue}>
                {project.budget ? `${project.budget.toLocaleString('sv-SE')} kr` : 'Ej specificerat'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Värdedimensioner</Text>
              <Text style={styles.infoValue}>
                {Array.isArray(project.value_dimensions) ? project.value_dimensions.join(', ') : project.value_dimensions || 'Ej specificerat'}
              </Text>
            </View>
          </View>
        </View>

        {/* Effects Section - only if space allows, with yellow bar */}
        {project.effects && project.effects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.yellowBar} />
              <Text style={styles.sectionTitle}>Förväntade effekter</Text>
            </View>
            {project.effects.slice(0, 3).map((effect: any, index: number) => (
              <View key={index} style={{ marginBottom: 6, marginLeft: 12 }}>
                <Text style={styles.sectionContent}>
                  • {effect.label}: {effect.val ? `${effect.val.toLocaleString('sv-SE')} kr` : 'Ej kvantifierat'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>AI Sweden - Projektportalen | Genererad {new Date().toLocaleDateString('sv-SE')}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TextFocusedOnePager; 