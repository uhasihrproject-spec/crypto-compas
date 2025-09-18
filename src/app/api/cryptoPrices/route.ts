import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd,btc,eth',
      { next: { revalidate: 30 } } // Cache for 30 seconds
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch crypto prices');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return NextResponse.json({ error: 'Failed to fetch crypto prices' }, { status: 500 });
  }
}
