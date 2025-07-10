import { NextResponse } from 'next/server';

/**
 * GET /api/counties  →  [{ code, name }]
 * Returns the list of Swedish counties/regions (län)
 */
export async function GET() {
  try {
    // Return the 21 Swedish counties (län)
    const counties = [
      { code: '01', name: 'Stockholm' },
      { code: '03', name: 'Uppsala' },
      { code: '04', name: 'Södermanland' },
      { code: '05', name: 'Östergötland' },
      { code: '06', name: 'Jönköping' },
      { code: '07', name: 'Kronoberg' },
      { code: '08', name: 'Kalmar' },
      { code: '09', name: 'Gotland' },
      { code: '10', name: 'Blekinge' },
      { code: '12', name: 'Skåne' },
      { code: '13', name: 'Halland' },
      { code: '14', name: 'Västra Götaland' },
      { code: '17', name: 'Värmland' },
      { code: '18', name: 'Örebro' },
      { code: '19', name: 'Västmanland' },
      { code: '20', name: 'Dalarna' },
      { code: '21', name: 'Gävleborg' },
      { code: '22', name: 'Västernorrland' },
      { code: '23', name: 'Jämtland' },
      { code: '24', name: 'Västerbotten' },
      { code: '25', name: 'Norrbotten' }
    ];

    return NextResponse.json(counties);
  } catch (error) {
    console.error('Unexpected error in counties API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 