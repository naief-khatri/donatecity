'use client'

import { useCityStore } from '@/stores/useCityStore'
import { CityStatsPanel } from '@/components/city/CityStatsPanel'
import { Map, Trophy, User, Settings, ArrowLeft, Plus, Minus, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export function CityHUD() {
  const store = useCityStore()
  const [lastRank, setLastRank] = useState<number | null>(null)
  const [toast, setToast] = useState<{message: string, amountToReclaim: number, attackerName: string} | null>(null)

  useEffect(() => {
    if (!store.userId) return

    let isSubscribed = true
    const checkRank = async () => {
      try {
        const res = await fetch('/api/leaderboard')
        const data = await res.json()
        if (!data.daily) return
        
        const myRankIndex = data.daily.findIndex((u: any) => u.userId === store.userId)
        if (myRankIndex === -1) return
        
        const myRank = myRankIndex + 1

        setLastRank(prev => {
          if (prev !== null && myRank > prev) {
            // Rank dropped! (e.g. from 1 to 2)
            const attacker = data.daily[myRankIndex - 1]
            if (attacker && isSubscribed) {
              const amountDiff = attacker.totalDonated - data.daily[myRankIndex].totalDonated + 1
              setToast({
                message: "You just lost your spot!",
                attackerName: attacker.displayName || attacker.username,
                amountToReclaim: amountDiff
              })
              // Auto hide toast after 10s
              setTimeout(() => setToast(null), 10000)
            }
          }
          return myRank
        })
      } catch (e) {
        console.error("Leaderboard poll error", e)
      }
    }

    // Initial check
    checkRank()
    
    // Poll every 30s
    const interval = setInterval(checkRank, 30000)
    return () => {
      isSubscribed = false
      clearInterval(interval)
    }
  }, [store.userId])


  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4">
        <CityStatsPanel />
        
        {store.isVisitingCity && (
          <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 bg-[#FFF4E5] text-[#1E1E24] px-6 py-4 rounded-3xl border-4 border-[#1E1E24] shadow-[6px_6px_0_0_#1E1E24] flex flex-col items-center gap-3">
            <span className="font-black text-lg uppercase tracking-wider">Visiting {store.visitingCityName}</span>
            <button 
              onClick={() => store.exitVisitMode()}
              className="flex items-center gap-2 text-sm bg-white text-[#1E1E24] border-2 border-[#1E1E24] px-4 py-2 rounded-xl transition-all font-bold shadow-[0_4px_0_0_#1E1E24] hover:shadow-[0_2px_0_0_#1E1E24] hover:translate-y-[2px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to My City
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pointer-events-auto">
          <button 
            onClick={() => store.openModal('campaigns')}
            className="flex items-center gap-2 bg-[#4285F4] text-white border-2 border-[#1E1E24] px-4 py-3 rounded-2xl shadow-[0_4px_0_0_#1E1E24] hover:shadow-[0_2px_0_0_#1E1E24] hover:translate-y-[2px] transition-all font-bold"
          >
            <Map className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Campaigns</span>
          </button>
          <button 
            onClick={() => store.openModal('leaderboard')}
            className="flex items-center gap-2 bg-[#FFD166] text-[#1E1E24] border-2 border-[#1E1E24] px-4 py-3 rounded-2xl shadow-[0_4px_0_0_#1E1E24] hover:shadow-[0_2px_0_0_#1E1E24] hover:translate-y-[2px] transition-all font-bold"
          >
            <Trophy className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Leaderboard</span>
          </button>
          <button 
            onClick={() => store.openModal('profile')}
            className="flex items-center gap-2 bg-white text-[#1E1E24] border-2 border-[#1E1E24] px-4 py-3 rounded-2xl shadow-[0_4px_0_0_#1E1E24] hover:shadow-[0_2px_0_0_#1E1E24] hover:translate-y-[2px] transition-all font-bold"
          >
            <User className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Profile</span>
          </button>
          <button 
            onClick={() => store.openModal('settings')}
            className="flex items-center gap-2 bg-white text-[#1E1E24] border-2 border-[#1E1E24] px-4 py-3 rounded-2xl shadow-[0_4px_0_0_#1E1E24] hover:shadow-[0_2px_0_0_#1E1E24] hover:translate-y-[2px] transition-all font-bold"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Settings</span>
          </button>
        </div>
      </div>

      
      {/* Gamified Outgive Toast */}
      {toast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-bounce">
          <div className="bg-[#FFE5E5] border-4 border-[#FF4A4A] rounded-3xl p-5 shadow-[8px_8px_0_0_#FF4A4A] flex flex-col items-center gap-3 min-w-[320px]">
            <div className="flex items-center gap-2 text-[#FF4A4A] font-black text-xl">
              <AlertCircle className="w-6 h-6" />
              {toast.message}
            </div>
            <div className="text-center font-bold text-[#1E1E24]">
              <span className="underline decoration-2">{toast.attackerName}</span> passed you on the Daily Leaderboard!
            </div>
            <button 
              onClick={() => {
                setToast(null)
                store.openModal('campaigns')
              }}
              className="w-full py-3 bg-[#FF4A4A] hover:bg-[#E53E3E] text-white rounded-xl font-black border-2 border-[#1E1E24] shadow-[0_4px_0_0_#1E1E24] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#1E1E24] transition-all text-lg mt-2"
            >
              Donate ${toast.amountToReclaim} to Outgive!
            </button>
          </div>
        </div>
      )}

      {/* Zoom Controls */}

      <div className="absolute bottom-8 right-6 pointer-events-auto flex flex-col gap-2 bg-white p-2 rounded-2xl border-4 border-[#1E1E24] shadow-[4px_4px_0_0_#1E1E24]">
        <button 
          onClick={() => store.zoomCamera(0.25)}
          className="p-3 text-[#1E1E24] bg-[#F4F4F5] hover:bg-[#E1E1E8] border-2 border-transparent hover:border-[#1E1E24] rounded-xl transition-all active:scale-95 flex items-center justify-center"
          title="Zoom In"
        >
          <Plus className="w-5 h-5 font-bold" />
        </button>
        <button 
          onClick={() => store.zoomCamera(-0.25)}
          className="p-3 text-[#1E1E24] bg-[#F4F4F5] hover:bg-[#E1E1E8] border-2 border-transparent hover:border-[#1E1E24] rounded-xl transition-all active:scale-95 flex items-center justify-center"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5 font-bold" />
        </button>
      </div>
    </div>
  )
}
