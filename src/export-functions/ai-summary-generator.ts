// AI Summary Generator using Groq API
export async function generateAISummary(intro: string, problem: string, opportunity: string): Promise<string> {
  // Target word count for summary
  const TARGET_WORDS = 60;

  // Clean and prepare input text
  const cleanIntro = (intro || '').trim();
  const cleanProblem = (problem || '').trim();
  const cleanOpportunity = (opportunity || '').trim();

  // Compose the prompt for the AI
  const prompt = `Du är en expert på att skriva professionella, konsultmässiga sammanfattningar för AI-projekt i offentlig sektor.

UPPGIFT:
Skapa en sammanfattning som är EXAKT ${TARGET_WORDS} ord lång som beskriver projektet på ett naturligt och flytande sätt.

Bakgrundsinformation:
- Projektets syfte: ${cleanIntro || 'Ingen introduktion tillgänglig'}
- Utmaning/Problem: ${cleanProblem || 'Inget specifikt problem beskrivet'}
- Möjlighet/Lösning: ${cleanOpportunity || 'Ingen möjlighet beskriven'}

KRAV:
- Exakt ${TARGET_WORDS} ord - varken mer eller mindre
- Mycket koncis och faktabaserad
- Lätt att förstå för beslutsfattare
- Naturligt flöde från problem till lösning till värde
- Fokusera på konkreta resultat och nytta
- Använd aktivt språk och professionell ton
- Undvik onödiga ord och repetitioner
- SKRIV INTE "Problemet:" eller "Möjligheten:" - integrera allt i en flytande text
- Avsluta aldrig mitt i en mening - se till att texten är komplett
- Använd korta, direkta meningar
- Om information saknas, fyll ut med relevanta insikter om AI-projekt i offentlig sektor
- Om information är för mycket, prioritera det viktigaste
- VAR KREATIV - skapa en naturlig, flytande text som inte bara repeterar input-informationen

STRUKTUR:
Skapa en samhängande text som beskriver:
1. Vad projektet handlar om (kort)
2. Vilken utmaning det löser (kort)
3. Hur det skapar värde för samhället (kort)

Skriv på svenska och se till att texten alltid fyller utrymmet bra och är professionell.`;

  const groqApiKey = process.env.GROQ_API_KEY;
  
  if (!groqApiKey) {
    console.warn('GROQ_API_KEY not found, using fallback summary');
    return generateFallbackSummary(cleanIntro, cleanProblem, cleanOpportunity);
  }

  try {
    console.log('DEBUG: Calling Groq API with key:', groqApiKey.substring(0, 10) + '...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'Du är en expert på att skriva mycket korta, professionella sammanfattningar för AI-projekt. Du följer alltid ordgränsen exakt och skapar text som fyller utrymmet perfekt. Du skriver aldrig "Problemet:" eller "Möjligheten:" - allt ska vara en flytande text. Du skapar naturliga, flytande sammanfattningar som inte bara repeterar input-texten. Du är kreativ och skapar nya, sammanhängande meningar som beskriver projektet på ett professionellt sätt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    console.log('DEBUG: Groq API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DEBUG: Groq API error response:', errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('DEBUG: Groq API response data:', JSON.stringify(data, null, 2));
    
    const summary = data.choices[0]?.message?.content?.trim();
    
    if (!summary) {
      console.error('DEBUG: No summary in Groq API response');
      throw new Error('No summary generated from Groq API');
    }

    console.log('DEBUG: Raw AI summary from Groq:', summary);

    // Clean up the summary - remove any "Problemet:" or "Möjligheten:" prefixes
    let cleanedSummary = summary
      .replace(/^(Problemet|Möjligheten|Intro):\s*/gi, '')
      .replace(/\s+(Problemet|Möjligheten|Intro):\s*/gi, ' ')
      .trim();

    // Ensure the summary meets our length requirements
    const wordCount = cleanedSummary.split(/\s+/).length;
    const charCount = cleanedSummary.length;
    
    console.log('DEBUG: Summary stats - words:', wordCount, 'chars:', charCount);
    
    if (wordCount < TARGET_WORDS - 5) {
      // Too short - expand it
      console.log('DEBUG: Summary too short, expanding...');
      return expandSummary(cleanedSummary, cleanIntro, cleanProblem, cleanOpportunity);
    } else if (wordCount > TARGET_WORDS + 5 || charCount > 320) {
      // Too long - truncate it intelligently
      console.log('DEBUG: Summary too long, truncating...');
      return truncateSummary(cleanedSummary, TARGET_WORDS, 320);
    }

    console.log('DEBUG: Final summary:', cleanedSummary);
    return cleanedSummary;

  } catch (error) {
    console.error('Error generating AI summary:', error);
    console.log('DEBUG: Falling back to manual summary generation');
    return generateFallbackSummary(cleanIntro, cleanProblem, cleanOpportunity);
  }
}

function expandSummary(shortSummary: string, intro: string, problem: string, opportunity: string): string {
  // Add more details to reach the target length
  const parts = [];
  
  if (intro && !shortSummary.toLowerCase().includes(intro.substring(0, 10).toLowerCase())) {
    parts.push(`Projektet fokuserar på ${intro.toLowerCase()}`);
  }
  
  if (problem && !shortSummary.toLowerCase().includes(problem.substring(0, 10).toLowerCase())) {
    parts.push(`Utmaningen är ${problem.toLowerCase()}`);
  }
  
  if (opportunity && !shortSummary.toLowerCase().includes(opportunity.substring(0, 10).toLowerCase())) {
    parts.push(`Lösningen erbjuder ${opportunity.toLowerCase()}`);
  }
  
  if (parts.length > 0) {
    const expanded = shortSummary + ' ' + parts.join('. ') + '.';
    return expanded.length > 400 ? truncateSummary(expanded, 80, 400) : expanded;
  }
  
  return shortSummary;
}

function truncateSummary(summary: string, maxWords: number, maxChars: number): string {
  // Intelligent truncation that doesn't cut words in half
  if (summary.length <= maxChars) {
    return summary;
  }
  
  // Find the last complete sentence within the character limit
  const truncated = summary.substring(0, maxChars);
  
  // Look for sentence endings (. ! ?) in the last 20% of the text
  const searchStart = Math.max(0, truncated.length - Math.floor(maxChars * 0.2));
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > searchStart) {
    // Found a good sentence break
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // Look for word boundaries in the last 30% of the text
  const wordSearchStart = Math.max(0, truncated.length - Math.floor(maxChars * 0.3));
  const lastSpace = truncated.lastIndexOf(' ', wordSearchStart);
  
  if (lastSpace > truncated.length * 0.7) { // If we can find a good word break
    return truncated.substring(0, lastSpace) + '.';
  }
  
  // Fallback: truncate at character limit and add ellipsis
  return truncated.substring(0, maxChars - 3) + '...';
}

function generateFallbackSummary(intro: string, problem: string, opportunity: string): string {
  // Create a much more natural summary without awkward concatenation
  let summary = '';
  
  // Start with the intro if available
  if (intro && intro.trim()) {
    summary = intro.trim();
  }
  
  // Add problem context if available - but more naturally
  if (problem && problem.trim()) {
    if (summary) {
      // If we have an intro, connect it naturally without awkward phrases
      if (problem.toLowerCase().includes('dålig')) {
        summary += '. Den nuvarande funktionaliteten är begränsad och behöver förbättras.';
      } else if (problem.toLowerCase().includes('problem')) {
        summary += '. Projektet adresserar befintliga utmaningar inom området.';
      } else {
        summary += '. Projektet fokuserar på att lösa ' + problem.toLowerCase();
      }
    } else {
      // No intro, start with problem
      if (problem.toLowerCase().includes('dålig')) {
        summary = 'Projektet fokuserar på att förbättra befintlig funktionalitet.';
      } else {
        summary = 'Projektet fokuserar på att lösa ' + problem.toLowerCase();
      }
    }
  }
  
  // Add opportunity/solution if available - but more naturally
  if (opportunity && opportunity.trim()) {
    if (summary) {
      if (opportunity.toLowerCase().includes('förbättra')) {
        summary += '. Genom förbättringar skapas bättre användarupplevelser och effektivitet.';
      } else if (opportunity.toLowerCase().includes('lösning')) {
        summary += '. Projektet erbjuder innovativa lösningar för att möta behoven.';
      } else {
        summary += '. Projektet syftar till att ' + opportunity.toLowerCase();
      }
    } else {
      // No previous content, start with opportunity
      if (opportunity.toLowerCase().includes('förbättra')) {
        summary = 'Projektet syftar till att förbättra befintliga processer och system.';
      } else {
        summary = 'Projektet syftar till att ' + opportunity.toLowerCase();
      }
    }
  }
  
  // If we still don't have enough content, add some context
  if (!summary || summary.length < 100) {
    if (summary) {
      summary += ' Projektet skapar värde genom innovation och digitalisering.';
    } else {
      summary = 'Projektet syftar till att skapa värde genom innovation och digitalisering av offentliga tjänster.';
    }
  }
  
  // Clean up any awkward phrases
  summary = summary
    .replace(/^(Problemet|Möjligheten|Intro):\s*/gi, '')
    .replace(/\s+(Problemet|Möjligheten|Intro):\s*/gi, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\.\.+/g, '.') // Fix double dots
    .replace(/\s+\./g, '.') // Remove spaces before periods
    .trim();
  
  // Ensure proper sentence structure
  if (!summary.endsWith('.') && !summary.endsWith('!') && !summary.endsWith('?')) {
    summary += '.';
  }
  
  // Ensure it fits our target length
  if (summary.length > 320) {
    return truncateSummary(summary, 65, 320);
  } else if (summary.length < 200) {
    // Add some relevant context to reach minimum length
    summary += ' Projektet förbättrar effektiviteten och användarupplevelsen.';
  }
  
  return summary;
}

// Utility function to clean and prepare text for AI processing
export function prepareTextForAI(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 200); // Shorter input for more concise output
} 