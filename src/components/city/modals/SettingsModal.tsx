'use client'

import { useCityStore } from '@/stores/useCityStore'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export function SettingsModal() {
  const store = useCityStore()
  const [isAnon, setIsAnon] = useState(false)
  const [allowVisits, setAllowVisits] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [originalUsername, setOriginalUsername] = useState('')

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
      if (profile) {
        const username = profile.username || ''
        setIsAnon(username.includes('___ANON'))
        setAllowVisits(!username.includes('___NOVISIT'))
        setOriginalUsername(username.replace('___ANON', '').replace('___NOVISIT', ''))
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  const saveSettings = async (newAnon: boolean, newVisits: boolean) => {
    setSaving(true)
    setIsAnon(newAnon)
    setAllowVisits(newVisits)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAnonymous: newAnon, allowVisits: newVisits, originalUsername })
      })
      if (!res.ok) throw new Error('Failed to save settings')
      // Let it quietly succeed
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
        className="relative bg-gray-900/95 text-white rounded-2xl p-8 max-w-sm w-full mx-4 border border-white/10 shadow-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">⚙ Settings</h2>
          <button onClick={store.closeModal} className="text-gray-400 hover:text-white p-1">✕</button>
        </div>
        
        {loading ? (
          <div className="text-center text-gray-500 py-4 animate-pulse">Loading settings...</div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold mb-1">Anonymous Mode</div>
                <div className="text-xs text-gray-400">Hide your name on the leaderboard</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isAnon}
                  disabled={saving}
                  onChange={(e) => saveSettings(e.target.checked, allowVisits)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold mb-1">Allow City Visits</div>
                <div className="text-xs text-gray-400">Let others explore your city</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={allowVisits}
                  disabled={saving}
                  onChange={(e) => saveSettings(isAnon, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            
            {saving && <div className="text-xs text-blue-400 text-center animate-pulse mt-2">Saving...</div>}
          </div>
        )}
      </div>
    </div>
  )
}
