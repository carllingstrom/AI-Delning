// AI text fitting utility for generating concise summaries
export async function fitSummary(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return 'Ingen beskrivning tillgänglig för detta projekt.';
  }

  // Simple text fitting logic - in a real implementation, this would call an AI service
  const maxLength = 300;
  
  if (text.length <= maxLength) {
    return text;
  }

  // Truncate and add ellipsis
  const truncated = text.substring(0, maxLength - 3) + '...';
  
  // Try to break at a sentence boundary
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  if (lastSentenceEnd > maxLength * 0.7) { // If we can break at a sentence and it's not too short
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  return truncated;
}

// Additional utility functions for text processing
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
}

export function extractKeyPoints(text: string, maxPoints: number = 3): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.slice(0, maxPoints).map(s => s.trim() + '.');
} 