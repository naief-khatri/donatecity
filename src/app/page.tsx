import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CityView from '@/components/city/CityView'
import type { ServerCityData } from '@/game/types/cityTypes'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's city with extended columns
  const { data: city } = await supabase
    .from('cities')
    .select('id, owner_id, name, layout_version, city_level, total_donated, campaigns_supported, causes_supported')
    .eq('owner_id', user.id)
    .single()

  if (!city) {
    // City should auto-create on signup via trigger, but handle edge case
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#1a1a2e] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Setting up your city...</h1>
          <p className="text-gray-400">Please refresh the page. If this persists, your database migrations may need to be applied.</p>
        </div>
      </div>
    )
  }

  // Fetch city buildings
  const { data: buildings } = await supabase
    .from('city_buildings')
    .select('*')
    .eq('city_id', city.id)
    .order('plot_index', { ascending: true })

  // Fetch user's donations
  const { data: donations } = await supabase
    .from('donations')
    .select('id, campaign_slug, campaign_name, organization_name, cause, amount, sequence, created_at')
    .eq('user_id', user.id)
    .order('sequence', { ascending: true })

  // Fetch active campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, slug, name, description, logo_url, cause_category, building_type, is_active')
    .eq('is_active', true)
    .order('internal_rank', { ascending: false })
    .limit(50)

  const serverData: ServerCityData = {
    city: {
      id: city.id,
      owner_id: city.owner_id,
      name: city.name,
      layout_version: city.layout_version ?? 1,
      city_level: city.city_level ?? 1,
      total_donated: city.total_donated ?? 0,
      campaigns_supported: city.campaigns_supported ?? 0,
      causes_supported: city.causes_supported ?? 0,
    },
    buildings: buildings ?? [],
    donations: donations ?? [],
    campaigns: campaigns ?? [],
    user: {
      id: user.id,
      email: user.email ?? '',
    },
  }

  return <CityView serverData={serverData} />
}
