import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('*')
    .eq('owner_id', userId)
    .single()

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', userId).single()
  if (profile?.username?.includes('___NOVISIT')) {
    return NextResponse.json({ error: 'This user has disabled visits' }, { status: 403 })
  }

  if (cityError || !city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 })
  }

  const { data: donations } = await supabase
    .from('donations')
    .select('*')
    .eq('city_id', city.id)
    .order('sequence', { ascending: true })
    
  return NextResponse.json({
    city,
    donations: donations || []
  })
}
