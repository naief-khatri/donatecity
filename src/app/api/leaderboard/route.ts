import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cities')
    .select(`
      id,
      owner_id,
      total_donated,
      campaigns_supported,
      causes_supported,
      profiles!cities_owner_id_fkey (
        username
      )
    `)
    .order('total_donated', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mapped = data.map((c: any) => {
    let rawUsername = c.profiles?.username || 'Anonymous'
    const isAnonymous = rawUsername.includes('___ANON')
    const allowVisits = !rawUsername.includes('___NOVISIT')
    const cleanUsername = rawUsername.replace('___ANON', '').replace('___NOVISIT', '')

    return {
      userId: c.owner_id,
      cityId: c.id,
      username: isAnonymous ? 'Anonymous' : cleanUsername,
      allowVisits,
      totalDonated: c.total_donated,
      campaignsSupported: c.campaigns_supported,
      causesSupported: c.causes_supported,
    }
  })

  return NextResponse.json({ leaderboard: mapped })
}
