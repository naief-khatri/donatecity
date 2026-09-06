import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { isAnonymous, allowVisits, originalUsername } = await request.json()

  let newUsername = originalUsername
  if (isAnonymous) newUsername += '___ANON'
  if (!allowVisits) newUsername += '___NOVISIT'

  const { error } = await supabase
    .from('profiles')
    .update({ username: newUsername })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const cityName = isAnonymous ? "Anonymous's City" : `${originalUsername}'s City`
  await supabase.from('cities').update({ name: cityName }).eq('owner_id', user.id)

  return NextResponse.json({ success: true, username: newUsername, cityName })
}
