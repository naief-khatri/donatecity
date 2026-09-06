import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { slug, name, description, logo_url, cause_category, building_type } = body

    if (!slug || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    
    // Add to our DB (if it already exists, do nothing or update)
    const { error } = await supabaseAdmin
      .from('campaigns')
      .upsert({
        slug,
        name,
        description: description || '',
        logo_url: logo_url || '',
        cause_category: cause_category || 'other',
        building_type: building_type || 'Monument',
        internal_rank: 1, // Start with rank 1 since a user searched for it
      }, { onConflict: 'slug' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Add campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
