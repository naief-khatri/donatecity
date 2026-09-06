'use client'

import { useCityStore } from '@/stores/useCityStore'

export function ProfileModal() {
  const store = useCityStore()
  const { cityName, cityLevel, totalDonated, campaignsSupported, causesSupported, userEmail, buildings } = store

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
          <h2 className="text-2xl font-bold">👤 Profile</h2>
          <button onClick={store.closeModal} className="text-gray-400 hover:text-white p-1">✕</button>
        </div>
        <div className="text-sm text-gray-400 mb-6 pb-6 border-b border-white/10">{userEmail}</div>
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center"><span className="text-gray-400">City Name</span><span className="font-semibold">{cityName}</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-400">Level</span><span className="font-semibold">{cityLevel}</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-400">Total Donated</span><span className="font-bold text-emerald-400">${totalDonated.toLocaleString()}</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-400">Campaigns</span><span className="font-semibold">{campaignsSupported}</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-400">Causes</span><span className="font-semibold">{causesSupported}</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-400">Buildings</span><span className="font-semibold">{buildings.length}</span></div>
        </div>
        <form action="/login" method="get">
          <button type="submit" className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl py-3 text-sm font-bold transition-colors">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
