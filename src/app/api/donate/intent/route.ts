import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { cityId, campaignSlug, campaignName, organizationName, cause, amount } = body

    if (!cityId || !campaignSlug || !cause || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Construct Every.org partner metadata
    const metadata = {
      cityId,
      campaignSlug,
      campaignName: campaignName || '',
      organizationName: organizationName || '',
      cause,
      donorId: user.id,
    }
    const encodedMetadata = Buffer.from(JSON.stringify(metadata)).toString('base64')

    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true' || process.env.TEST_MODE === 'true'

    if (isTestMode) {
      return NextResponse.json({
        success: true,
        isTestMode: true,
        metadata: encodedMetadata
      })
    }

    // Generate checkout URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const checkoutUrl = `https://www.every.org/${campaignSlug}#/donate?amount=${amount}&partner_metadata=${encodedMetadata}&success_url=${encodeURIComponent(baseUrl + '/?donation=success')}&exit_url=${encodeURIComponent(baseUrl + '/?donation=cancelled')}`

    return NextResponse.json({
      success: true,
      isTestMode: false,
      checkoutUrl,
    })
  } catch (error: any) {
    console.error('Donation intent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
