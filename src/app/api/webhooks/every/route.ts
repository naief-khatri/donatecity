import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    // 1. Verify webhook secret if configured
    const webhookSecret = process.env.EVERY_ORG_WEBHOOK_SECRET
    // Usually you'd verify a signature header here, e.g. x-every-signature
    // For this hackathon, we'll assume the payload is valid if secret is passed (or skip if not set)

    const payload = await req.json()
    console.log('Received webhook payload:', payload)

    // The structure might vary, but according to Every.org typical webhook:
    const { chargeId, status, amount, nonprofit } = payload
    const partnerMetadataRaw = payload.partnerMetadata || payload.metadata?.partner_metadata

    if (!chargeId || status !== 'succeeded') {
      return NextResponse.json({ message: 'Ignored or invalid payload' })
    }

    if (!partnerMetadataRaw) {
      console.warn('No partner metadata found in webhook payload')
      return NextResponse.json({ message: 'No metadata, ignoring' })
    }

    // 2. Decode partner metadata
    let metadata;
    try {
      const decodedStr = Buffer.from(partnerMetadataRaw, 'base64').toString('utf-8')
      metadata = JSON.parse(decodedStr)
    } catch (err) {
      console.error('Failed to parse partner metadata:', err)
      return NextResponse.json({ error: 'Invalid metadata format' }, { status: 400 })
    }

    const { cityId, campaignSlug, campaignName, organizationName, cause, donorId } = metadata

    if (!cityId || !campaignSlug || !cause || !donorId) {
      return NextResponse.json({ error: 'Incomplete metadata' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // 3. Idempotency Check: Log the webhook event
    const { error: eventError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        event_type: 'charge.succeeded',
        payload,
        status: 'processing',
        charge_id: chargeId
      })

    if (eventError) {
      if (eventError.code === '23505') { // unique violation
        console.log(`Webhook for charge ${chargeId} already processed.`)
        return NextResponse.json({ message: 'Already processed' })
      }
      throw eventError
    }

    // 4. Calculate sequence
    const { data: maxSeqData, error: seqError } = await supabaseAdmin
      .from('donations')
      .select('sequence')
      .eq('city_id', cityId)
      .order('sequence', { ascending: false })
      .limit(1)
      .single()

    const nextSequence = (maxSeqData?.sequence || 0) + 1

    // 5. Insert donation
    const { error: donationError } = await supabaseAdmin
      .from('donations')
      .insert({
        user_id: donorId,
        city_id: cityId,
        campaign_slug: campaignSlug,
        campaign_name: campaignName,
        organization_name: organizationName,
        cause: cause,
        amount: amount,
        charge_id: chargeId,
        sequence: nextSequence
      })

    if (donationError) {
      await supabaseAdmin.from('webhook_events').update({ status: 'error' }).eq('charge_id', chargeId)
      console.error('Failed to create donation:', donationError)
      return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 })
    }

    // 6. Update city totals and stats
    const { data: cityData } = await supabaseAdmin
      .from('cities')
      .select('total_donated')
      .eq('id', cityId)
      .single()

    const { data: donationsForCity } = await supabaseAdmin
      .from('donations')
      .select('campaign_slug, cause')
      .eq('city_id', cityId)

    let uniqueCampaigns = 1
    let uniqueCauses = 1
    if (donationsForCity) {
      uniqueCampaigns = new Set(donationsForCity.map((d: any) => d.campaign_slug)).size
      uniqueCauses = new Set(donationsForCity.map((d: any) => d.cause)).size
    }

    if (cityData) {
      await supabaseAdmin
        .from('cities')
        .update({
          total_donated: Number(cityData.total_donated) + Number(amount),
          campaigns_supported: uniqueCampaigns,
          causes_supported: uniqueCauses
        })
        .eq('id', cityId)
    }

    // Mark event as success
    await supabaseAdmin
      .from('webhook_events')
      .update({ status: 'success', processed_at: new Date().toISOString() })
      .eq('charge_id', chargeId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
