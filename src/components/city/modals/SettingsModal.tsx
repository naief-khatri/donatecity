'use client'

import { useCityStore } from '@/stores/useCityStore'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export function SettingsModal() {
  const store = useCityStore()
  const [isAnon, setIsAnon] = useState(false)
  const [allowVisits, setAllowVisits] = useState(true)
  const [originalUsername, setOriginalUsername] = useState('')
  
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [socialLink, setSocialLink] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, bio, social_link')
        .eq('id', user.id)
        .single()
        
      if (profile) {
        const username = profile.username || ''
        setIsAnon(username.includes('___ANON'))
        setAllowVisits(!username.includes('___NOVISIT'))
        setOriginalUsername(username.replace('___ANON', '').replace('___NOVISIT', ''))
        
        setDisplayName(profile.display_name || '')
        setBio(profile.bio || '')
        setSocialLink(profile.social_link || '')
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  const saveSettings = async (overrideAnon?: boolean, overrideVisits?: boolean) => {
    setSaving(true)
    setSaveSuccess(false)
    const newAnon = overrideAnon !== undefined ? overrideAnon : isAnon
    const newVisits = overrideVisits !== undefined ? overrideVisits : allowVisits
    
    if (overrideAnon !== undefined) setIsAnon(overrideAnon)
    if (overrideVisits !== undefined) setAllowVisits(overrideVisits)
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isAnonymous: newAnon, 
          allowVisits: newVisits, 
          originalUsername,
          displayName,
          bio,
          socialLink
        })
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      console.error(err)
      alert("Could not save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
        onClick={(e) => { e.stopPropagation(); store.closeModal(); }}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div 
        className="relative bg-[#FAFAFA] text-[#1E1E24] rounded-[2rem] p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border-4 border-[#1E1E24] shadow-[8px_8px_0_0_#1E1E24] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black tracking-tight">⚙ Settings</h2>
          <button onClick={store.closeModal} className="bg-white border-2 border-[#1E1E24] rounded-full p-2 text-[#1E1E24] shadow-[0_2px_0_0_#1E1E24] hover:shadow-[0_0px_0_0_#1E1E24] hover:translate-y-[2px] transition-all z-10 w-8 h-8 flex items-center justify-center font-bold">✕</button>
        </div>
        
        {loading ? (
          <div className="text-center text-[#A1A1AA] font-bold py-4 animate-pulse">Loading settings...</div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Custom Profile Section */}
            <div className="bg-white rounded-3xl p-5 border-4 border-[#E1E1E8] flex flex-col gap-4 shadow-sm relative overflow-hidden">
              {isAnon && (
                <div className="absolute inset-0 bg-[#FAFAFA]/90 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                   <div className="text-3xl mb-2">👻</div>
                   <div className="font-black text-[#1E1E24] mb-1">Ghost Mode Active</div>
                   <div className="text-sm font-bold text-[#64646F]">Your profile details are hidden from the public leaderboard.</div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-black text-[#1E1E24] mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={originalUsername}
                  maxLength={30}
                  className="w-full bg-[#FAFAFA] border-2 border-[#E1E1E8] text-[#1E1E24] placeholder:text-[#A1A1AA] font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-[#4285F4] focus:ring-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-[#1E1E24] mb-1">Short Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Building a greener world!"
                  maxLength={100}
                  rows={2}
                  className="w-full bg-[#FAFAFA] border-2 border-[#E1E1E8] text-[#1E1E24] placeholder:text-[#A1A1AA] font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-[#4285F4] focus:ring-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-[#1E1E24] mb-1">Social Link</label>
                <input 
                  type="url" 
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                  placeholder="https://x.com/username"
                  className="w-full bg-[#FAFAFA] border-2 border-[#E1E1E8] text-[#1E1E24] placeholder:text-[#A1A1AA] font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-[#4285F4] focus:ring-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] transition-colors"
                />
              </div>

              <button 
                onClick={() => saveSettings()}
                disabled={saving || isAnon}
                className="w-full py-3 px-4 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-2xl font-black transition-all border-2 border-[#1E1E24] shadow-[0_4px_0_0_#1E1E24] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#1E1E24] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : saveSuccess ? 'Saved! ✓' : 'Save Profile'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-black text-[#1E1E24] mb-1">Anonymous Mode</div>
                <div className="text-xs text-[#64646F] font-bold">Hide your name on the leaderboard</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isAnon}
                  disabled={saving}
                  onChange={(e) => saveSettings(e.target.checked, allowVisits)}
                />
                <div className="bg-[#E1E1E8] border-2 border-[#1E1E24] h-7 w-12 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#1E1E24] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border-2 after:border-[#1E1E24] hover:after:scale-95 after:bg-white after:border-[#1E1E24] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4285F4]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-black text-[#1E1E24] mb-1">Allow City Visits</div>
                <div className="text-xs text-[#64646F] font-bold">Let others explore your city</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={allowVisits}
                  disabled={saving}
                  onChange={(e) => saveSettings(isAnon, e.target.checked)}
                />
                <div className="bg-[#E1E1E8] border-2 border-[#1E1E24] h-7 w-12 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#1E1E24] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border-2 after:border-[#1E1E24] hover:after:scale-95 after:bg-white after:border-[#1E1E24] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A36C]"></div>
              </label>
            </div>
            
            <div className="mt-2 pt-6 border-t-2 border-[#E1E1E8]">
              <form action="/api/auth/logout" method="POST">
                <button 
                  type="submit"
                  className="w-full py-3 px-4 font-black transition-colors bg-[#FFE5E5] hover:bg-[#FFD1D1] text-[#FF4A4A] border-2 border-[#1E1E24] shadow-[0_4px_0_0_#1E1E24] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#1E1E24] rounded-2xl"
                >
                  Log Out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
