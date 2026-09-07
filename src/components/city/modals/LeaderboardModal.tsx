'use client'

import { useCityStore } from '@/stores/useCityStore'
import { useState, useEffect } from 'react'

export function LeaderboardModal() {
  const store = useCityStore()
  const [allTime, setAllTime] = useState<any[]>([])
  const [daily, setDaily] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'daily' | 'allTime'>('daily')

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => {
        // d.allTime and d.daily (or fallback if API didn't have it yet)
        setAllTime(d.allTime || d.leaderboard || [])
        setDaily(d.daily || [])
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  const leaders = tab === 'allTime' ? allTime : daily

  // Find user's rank and amount
  const userRank = leaders.findIndex(u => u.userId === store.userId)
  const topUser = leaders[0]
  const amountToNumberOne = topUser && userRank !== 0 
    ? (topUser.totalDonated - (userRank >= 0 ? leaders[userRank].totalDonated : 0)) + 1
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
        onClick={(e) => { e.stopPropagation(); store.closeModal(); }}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div 
        className="relative bg-[#FAFAFA] text-[#1E1E24] rounded-[2rem] p-6 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto border-4 border-[#1E1E24] shadow-[8px_8px_0_0_#1E1E24] pointer-events-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-3xl font-black tracking-tight">🏆 Leaderboard</h2>
            <div className="text-sm text-[#A1A1AA] font-bold mt-1 uppercase tracking-wider">Outgive to become #1</div>
          </div>
          <button onClick={store.closeModal} className="bg-white border-2 border-[#1E1E24] rounded-full p-2 text-[#1E1E24] shadow-[0_2px_0_0_#1E1E24] hover:shadow-[0_0px_0_0_#1E1E24] hover:translate-y-[2px] transition-all z-10 w-8 h-8 flex items-center justify-center font-bold">✕</button>
        </div>

        {/* Gamified Tabs */}
        <div className="flex gap-2 mb-6 flex-shrink-0">
          <button 
            onClick={() => setTab('daily')}
            className={`flex-1 py-3 px-4 font-black rounded-2xl border-2 transition-all ${tab === 'daily' ? 'bg-[#FFD166] border-[#1E1E24] text-[#1E1E24] shadow-[0_4px_0_0_#1E1E24]' : 'bg-white border-[#1E1E24] text-[#64646F] shadow-[0_4px_0_0_#A1A1AA] hover:shadow-[0_4px_0_0_#1E1E24] hover:text-[#1E1E24]'}`}
          >
            🔥 Daily 24h
          </button>
          <button 
            onClick={() => setTab('allTime')}
            className={`flex-1 py-3 px-4 font-black rounded-2xl border-2 transition-all ${tab === 'allTime' ? 'bg-[#4285F4] border-[#1E1E24] text-white shadow-[0_4px_0_0_#1E1E24]' : 'bg-white border-[#1E1E24] text-[#64646F] shadow-[0_4px_0_0_#A1A1AA] hover:shadow-[0_4px_0_0_#1E1E24] hover:text-[#1E1E24]'}`}
          >
            🌟 All-Time
          </button>
        </div>



                {/* Competitor Banner (Simplified) */}
        {!loading && amountToNumberOne > 0 && (
          <div className="bg-[#FFE5E5] border-2 border-[#1E1E24] rounded-2xl p-4 mb-6 flex items-center justify-between shadow-[4px_4px_0_0_#1E1E24] flex-shrink-0">
            <div>
              <div className="text-[#1E1E24] font-black text-lg">Steal the #1 Spot!</div>
              <div className="text-[#64646F] font-bold text-sm mt-0.5">Donate <span className="font-black text-[#00A36C]">${amountToNumberOne.toLocaleString()}</span> more to pass {topUser.displayName || topUser.username}</div>
            </div>
            <button 
              onClick={() => store.openModal('campaigns')}
              className="px-5 py-2.5 bg-[#FF4A4A] hover:bg-[#E53E3E] text-white font-black rounded-xl border-2 border-[#1E1E24] shadow-[0_4px_0_0_#1E1E24] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#1E1E24] transition-all"
            >
              Outgive!
            </button>
          </div>
        )}

        {/* The List */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#E1E1E8] scrollbar-track-transparent">
          {loading ? (
            <p className="text-center text-[#A1A1AA] font-bold py-8 animate-pulse">Loading top cities...</p>
          ) : leaders.length === 0 ? (
            <p className="text-center text-[#A1A1AA] font-bold py-8">No donations yet. Be the first!</p>
          ) : (
            <div className="flex flex-col gap-4">
              {leaders.map((u, i) => {
                const isMe = u.userId === store.userId
                const isFirst = i === 0;
                return (
                  <div key={u.userId} className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    isFirst 
                      ? 'bg-[#FFFBEB] border-[#1E1E24] shadow-[4px_4px_0_0_#1E1E24]' 
                      : isMe 
                        ? 'bg-[#EBF3FF] border-[#4285F4] shadow-[0_4px_0_0_#4285F4]' 
                        : 'bg-white border-[#1E1E24] shadow-[4px_4px_0_0_#A1A1AA] hover:shadow-[4px_4px_0_0_#1E1E24]'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${i === 0 ? 'bg-[#FFD166] text-[#1E1E24] border-2 border-[#1E1E24] shadow-[2px_2px_0_0_#1E1E24] scale-110' : i === 1 ? 'bg-[#E1E1E8] text-[#1E1E24] border-2 border-[#1E1E24] shadow-[2px_2px_0_0_#1E1E24]' : i === 2 ? 'bg-[#FFA114] text-[#1E1E24] border-2 border-[#1E1E24] shadow-[2px_2px_0_0_#1E1E24]' : 'bg-white text-[#1E1E24] border-2 border-[#1E1E24] shadow-[2px_2px_0_0_#1E1E24]'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <div className="font-black text-lg text-[#1E1E24]">
                              {u.displayName || u.username}
                            </div>
                            {isMe && <span className="text-[10px] bg-[#4285F4] text-white px-2 py-0.5 rounded-md border-2 border-[#1E1E24] shadow-[0_2px_0_0_#1E1E24] uppercase tracking-wider font-black">You</span>}
                            {u.socialLink && (
                              <a href={u.socialLink.startsWith('http') ? u.socialLink : `https://${u.socialLink}`} target="_blank" rel="noreferrer" className="text-xs bg-white text-[#4285F4] border-2 border-[#1E1E24] shadow-[0_2px_0_0_#1E1E24] px-2 py-0.5 rounded-lg font-black hover:translate-y-[2px] hover:shadow-none transition-all" onClick={(e) => e.stopPropagation()}>
                                Link ↗
                              </a>
                            )}
                          </div>
                          {u.displayName && <div className="text-xs font-bold text-[#A1A1AA]">@{u.username}</div>}
                          {u.bio && <div className="text-sm text-[#64646F] font-bold mt-0.5 line-clamp-1 italic">"{u.bio}"</div>}
                          {tab === 'allTime' && (
                             <div className="text-sm text-[#64646F] font-bold mt-1">{u.campaignsSupported} Campaigns • {u.causesSupported} Causes</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-[#A1A1AA] font-black uppercase tracking-wider mb-1">Donated</div>
                        <div className="font-black text-[#00A36C] text-2xl">${u.totalDonated.toLocaleString()}</div>
                      </div>
                      {(!isMe && u.allowVisits) && (
                        <button 
                          onClick={() => store.visitCity(u.userId)}
                          className="px-4 py-2 bg-[#FAFAFA] hover:bg-[#E1E1E8] text-[#1E1E24] text-sm font-black rounded-xl transition-all border-2 border-[#1E1E24] shadow-[0_4px_0_0_#1E1E24] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#1E1E24]"
                        >
                          Visit
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
