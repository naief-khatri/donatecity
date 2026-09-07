import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { recipient, message, campaignSlug, campaignName, organizationName, cause, amount } = await req.json()
    if (!recipient || !amount || !campaignSlug) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabaseAdmin = createAdminClient()
    let targetUserId = null

    if (recipient.includes('@')) {
      const { data, error } = await supabaseAdmin.rpc('get_user_id_by_email', { p_email: recipient })
      if (!error && data) targetUserId = data
    } else {
      // If it has an @ at the start, remove it
      const cleanUsername = recipient.startsWith('@') ? recipient.substring(1) : recipient
      const { data, error } = await supabaseAdmin.from('profiles').select('id').eq('username', cleanUsername).single()
      if (!error && data) targetUserId = data.id
    }

    if (targetUserId) {
      // User exists! Insert into donations directly.
      const { data: cityData } = await supabaseAdmin.from('cities').select('id, total_donated').eq('owner_id', targetUserId).single()
      if (!cityData) return NextResponse.json({ error: 'Target city not found' }, { status: 404 })

      // Get sequence
      const { data: maxSeqData } = await supabaseAdmin.from('donations').select('sequence').eq('city_id', cityData.id).order('sequence', { ascending: false }).limit(1).single()
      const nextSequence = (maxSeqData?.sequence || 0) + 1
      
      const chargeId = `gift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      const { error: insertError } = await supabaseAdmin.from('donations').insert({
        user_id: targetUserId,
        city_id: cityData.id,
        campaign_slug: campaignSlug,
        campaign_name: campaignName,
        organization_name: organizationName,
        cause: cause,
        amount: amount,
        charge_id: chargeId,
        sequence: nextSequence,
        donated_by_id: user.id,
        donor_message: message
      })
      if (insertError) throw insertError

      // Update stats
      const { data: allDonations } = await supabaseAdmin.from('donations').select('campaign_slug, cause').eq('city_id', cityData.id)
      
      let uniqueCampaigns = 1; let uniqueCauses = 1;
      if (allDonations) {
        uniqueCampaigns = new Set(allDonations.map((d: any) => d.campaign_slug)).size
        uniqueCauses = new Set(allDonations.map((d: any) => d.cause)).size
      }

      await supabaseAdmin.from('cities').update({
        total_donated: Number(cityData.total_donated || 0) + Number(amount),
        campaigns_supported: uniqueCampaigns,
        causes_supported: uniqueCauses
      }).eq('id', cityData.id)

      return NextResponse.json({ success: true, status: 'donated' })
    } else {
      // User doesn't exist, must be an email
      if (!recipient.includes('@')) {
        return NextResponse.json({ error: 'Username not found. Try an email address to gift an invite!' }, { status: 404 })
      }

      // Insert into gifted_donations
      const chargeId = `gift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const { error: insertError } = await supabaseAdmin.from('gifted_donations').insert({
        target_email: recipient,
        donated_by_id: user.id,
        donor_message: message,
        campaign_slug: campaignSlug,
        campaign_name: campaignName,
        organization_name: organizationName,
        cause: cause,
        amount: amount,
        charge_id: chargeId
      })
      if (insertError) throw insertError

      // Simulate sending email
      console.log(`\n\n[MOCK EMAIL SENT] To: ${recipient}. "Someone gifted you a building! Claim it by signing up for Donate City."\n\n`)

      return NextResponse.json({ success: true, status: 'gifted_email' })
    }
  } catch (error: any) {
    console.error('Gift processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
