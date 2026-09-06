'use client'

import { useCityStore } from '@/stores/useCityStore'
import { useState, useEffect } from 'react'

export function LeaderboardModal() {
  const store = useCityStore()
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => {
        setLeaders(d.leaderboard || [])
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
        onClick={(e) => { e.stopPropagation(); store.closeModal(); }}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div 
        className="relative bg-gray-900/95 text-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto border border-white/10 shadow-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🏆 Leaderboard</h2>
          <button onClick={store.closeModal} className="text-gray-400 hover:text-white p-1">✕</button>
        </div>
        
        {loading ? (
          <p className="text-center text-gray-500 py-8 animate-pulse">Loading top cities...</p>
        ) : (
          <div className="flex flex-col gap-3">
            {leaders.map((u, i) => (
              <div key={u.cityId} className={`flex items-center justify-between p-4 rounded-xl border ${u.userId === store.userId ? 'bg-blue-900/40 border-blue-500/50' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-yellow-950' : i === 1 ? 'bg-gray-300 text-gray-800' : i === 2 ? 'bg-amber-700 text-amber-100' : 'bg-gray-800 text-gray-400'}`}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{u.username}</div>
                    <div className="text-sm text-gray-400">{u.campaignsSupported} Campaigns • {u.causesSupported} Causes</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Donated</div>
                    <div className="font-bold text-emerald-400 text-xl">${u.totalDonated.toLocaleString()}</div>
                  </div>
                  {u.userId !== store.userId && u.allowVisits && (
                    <button 
                      onClick={() => store.visitCity(u.userId)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors border border-white/10"
                    >
                      Visit City
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
