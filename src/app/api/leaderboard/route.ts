import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  // 1. Fetch All-Time from cities table
  const { data: allTimeData, error: allTimeError } = await supabase
    .from('cities')
    .select(`
      id,
      owner_id,
      total_donated,
      campaigns_supported,
      causes_supported,
      profiles!cities_owner_id_fkey (
        username,
        display_name,
        bio,
        social_link
      )
    `)
    .order('total_donated', { ascending: false })
    .limit(50)

  if (allTimeError) {
    console.error('All-time leaderboard error:', allTimeError)
    return NextResponse.json({ error: allTimeError.message }, { status: 500 })
  }

  const mapUser = (c: any) => {
    let rawUsername = c.profiles?.username || 'Anonymous'
    const isAnonymous = rawUsername.includes('___ANON')
    const allowVisits = !rawUsername.includes('___NOVISIT')
    const cleanUsername = rawUsername.replace('___ANON', '').replace('___NOVISIT', '')

    return {
      userId: c.owner_id,
      cityId: c.id,
      username: isAnonymous ? 'Anonymous' : cleanUsername,
      displayName: isAnonymous ? null : c.profiles?.display_name,
      bio: isAnonymous ? null : c.profiles?.bio,
      socialLink: isAnonymous ? null : c.profiles?.social_link,
      allowVisits,
      totalDonated: Number(c.total_donated) || 0,
      campaignsSupported: c.campaigns_supported,
      causesSupported: c.causes_supported,
    }
  }

  const allTime = allTimeData.map(mapUser)

  // 2. Fetch Daily from donations table (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const { data: donations, error: dailyError } = await supabase
    .from('donations')
    .select(`
      user_id,
      city_id,
      amount,
      profiles!donations_user_id_fkey (
        username,
        display_name,
        bio,
        social_link
      )
    `)
    .gte('created_at', oneDayAgo)

  if (dailyError) {
    console.error('Daily leaderboard error:', dailyError)
  }

  // Aggregate daily by user
  const dailyMap = new Map<string, any>()
  
  if (donations) {
    for (const d of donations) {
      const uId = d.user_id
      if (!dailyMap.has(uId)) {
        const p: any = d.profiles
        let rawUsername = p?.username || 'Anonymous'
        const isAnonymous = rawUsername.includes('___ANON')
        const allowVisits = !rawUsername.includes('___NOVISIT')
        const cleanUsername = rawUsername.replace('___ANON', '').replace('___NOVISIT', '')
        
        dailyMap.set(uId, {
          userId: uId,
          cityId: d.city_id,
          username: isAnonymous ? 'Anonymous' : cleanUsername,
          displayName: isAnonymous ? null : p?.display_name,
          bio: isAnonymous ? null : p?.bio,
          socialLink: isAnonymous ? null : p?.social_link,
          allowVisits,
          totalDonated: 0,
          campaignsSupported: 0,
          causesSupported: 0,
        })
      }
      
      const userStats = dailyMap.get(uId)
      userStats.totalDonated += Number(d.amount)
    }
  }

  const daily = Array.from(dailyMap.values())
    .sort((a, b) => b.totalDonated - a.totalDonated)
    .slice(0, 50)

  return NextResponse.json({ 
    allTime,
    daily 
  })
}
