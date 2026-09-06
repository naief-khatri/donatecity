import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ nonprofits: [] })
  }

  try {
    const apiKey = process.env.EVERY_ORG_API_KEY
    const res = await fetch(`https://partners.every.org/v0.2/search/${encodeURIComponent(query)}?apiKey=${apiKey}&take=5`)
    
    if (!res.ok) {
      throw new Error('Failed to fetch from Every.org')
    }
    
    const data = await res.json()
    return NextResponse.json({ nonprofits: data.nonprofits || [] })
  } catch (error: any) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
