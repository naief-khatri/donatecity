import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

const CAUSE_MAPPING: Record<string, { building: string, emoji: string }> = {
  health: { building: 'Hospital', emoji: '🏥' },
  education: { building: 'School', emoji: '🏫' },
  water: { building: 'Well', emoji: '💧' },
  environment: { building: 'Park', emoji: '🌲' },
  animals: { building: 'Animal Shelter', emoji: '🐾' },
}

export async function GET(request: Request) {
  // Simple cron secret check to prevent unauthorized syncs
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseAdmin = createAdminClient()
    const apiKey = process.env.EVERY_ORG_API_KEY
    if (!apiKey) throw new Error('Missing EVERY_ORG_API_KEY')

    let campaignsToUpsert = []

    // Fetch nonprofits for each mapped cause
    for (const [cause, details] of Object.entries(CAUSE_MAPPING)) {
      const res = await fetch(`https://partners.every.org/v0.2/browse/${cause}?apiKey=${apiKey}&take=5`)
      if (!res.ok) {
        console.error(`Failed to fetch cause: ${cause}`)
        continue
      }
      const data = await res.json()
      
      const nonprofits = data.nonprofits || []
      for (const np of nonprofits) {
        campaignsToUpsert.push({
          slug: np.slug,
          name: np.name,
          description: np.description || '',
          logo_url: np.logoUrl || '',
          cause_category: cause,
          building_type: details.building,
          // Start with rank 0, could be updated later by other cron jobs
          internal_rank: 0,
          updated_at: new Date().toISOString()
        })
      }
    }

    if (campaignsToUpsert.length > 0) {
      const { error } = await supabaseAdmin
        .from('campaigns')
        .upsert(campaignsToUpsert, { onConflict: 'slug' })
      
      if (error) throw error
    }

    return NextResponse.json({ success: true, synced: campaignsToUpsert.length })
  } catch (error: any) {
    console.error('Campaign sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
