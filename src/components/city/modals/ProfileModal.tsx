'use client'

import { useCityStore } from '@/stores/useCityStore'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export function ProfileModal() {
  const store = useCityStore()
  const { cityName, cityLevel, totalDonated, campaignsSupported, causesSupported, userEmail, buildings } = store
  
  const [profile, setProfile] = useState<any>(null)
  
  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    fetchProfile()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
        onClick={(e) => { e.stopPropagation(); store.closeModal(); }}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div 
        className="relative bg-[#FAFAFA] text-[#1E1E24] rounded-[2rem] p-8 max-w-sm w-full mx-4 border-4 border-[#1E1E24] shadow-[8px_8px_0_0_#1E1E24] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black tracking-tight">👤 Profile</h2>
          <button onClick={store.closeModal} className="bg-white border-2 border-[#1E1E24] rounded-full p-2 text-[#1E1E24] shadow-[0_2px_0_0_#1E1E24] hover:shadow-[0_0px_0_0_#1E1E24] hover:translate-y-[2px] transition-all z-10 w-8 h-8 flex items-center justify-center font-bold">✕</button>
        </div>
        <div className="mb-6 pb-6 border-b border-[#E1E1E8]">
          <div className="font-black text-xl text-[#1E1E24]">{(profile && profile.display_name) ? profile.display_name : 'No Display Name'}</div>
          <div className="text-sm text-[#A1A1AA] font-bold">@{profile?.username || 'loading...'}</div>
          {profile?.bio && <div className="text-sm text-[#64646F] font-bold mt-2 italic">"{profile.bio}"</div>}
          {profile?.social_link && (
            <a href={profile.social_link.startsWith('http') ? profile.social_link : `https://${profile.social_link}`} target="_blank" rel="noreferrer" className="inline-block mt-3 px-3 py-1 bg-[#EBF3FF] text-[#4285F4] text-xs font-black rounded-lg border-2 border-[#4285F4] hover:bg-[#4285F4] hover:text-white transition-colors">
              Social Link ↗
            </a>
          )}
        </div>
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center"><span className="text-[#64646F] font-bold">City Name</span><span className="font-black text-[#1E1E24]">{cityName}</span></div>
          <div className="flex justify-between items-center"><span className="text-[#64646F] font-bold">Level</span><span className="font-black text-[#1E1E24]">{cityLevel}</span></div>
          <div className="flex justify-between items-center"><span className="text-[#64646F] font-bold">Total Donated</span><span className="font-black text-[#00A36C]">${totalDonated.toLocaleString()}</span></div>
          <div className="flex justify-between items-center"><span className="text-[#64646F] font-bold">Campaigns</span><span className="font-black text-[#1E1E24]">{campaignsSupported}</span></div>
          <div className="flex justify-between items-center"><span className="text-[#64646F] font-bold">Causes</span><span className="font-black text-[#1E1E24]">{causesSupported}</span></div>
          <div className="flex justify-between items-center"><span className="text-[#64646F] font-bold">Buildings</span><span className="font-black text-[#1E1E24]">{buildings.length}</span></div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="w-full py-3 px-4 font-black transition-colors bg-[#FFE5E5] hover:bg-[#FFD1D1] text-[#FF4A4A] border-2 border-[#1E1E24] shadow-[0_4px_0_0_#1E1E24] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#1E1E24] rounded-2xl">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
