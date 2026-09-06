'use client'

import { useCityStore } from '@/stores/useCityStore'
import { CityStatsPanel } from '@/components/city/CityStatsPanel'
import { Map, Trophy, User, Settings, ArrowLeft, Plus, Minus } from 'lucide-react'

export function CityHUD() {
  const store = useCityStore()

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-4">
      <div className="flex justify-between items-start w-full">
        <CityStatsPanel />
        
        {store.isVisitingCity && (
          <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-6 py-3 rounded-2xl shadow-lg border border-white/10 flex flex-col items-center gap-2">
            <span className="font-medium text-lg">Visiting {store.visitingCityName}</span>
            <button 
              onClick={() => store.exitVisitMode()}
              className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to My City
            </button>
          </div>
        )}

        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={() => store.openModal('campaigns')}
            className="flex items-center gap-2 bg-black/70 hover:bg-black/80 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            <Map className="w-4 h-4" />
            <span className="text-sm font-medium">Campaigns</span>
          </button>
          <button 
            onClick={() => store.openModal('leaderboard')}
            className="flex items-center gap-2 bg-black/70 hover:bg-black/80 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">Leaderboard</span>
          </button>
          <button 
            onClick={() => store.openModal('profile')}
            className="flex items-center gap-2 bg-black/70 hover:bg-black/80 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Profile</span>
          </button>
          <button 
            onClick={() => store.openModal('settings')}
            className="flex items-center gap-2 bg-black/70 hover:bg-black/80 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-8 right-6 pointer-events-auto flex flex-col gap-2 bg-black/60 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white/10">
        <button 
          onClick={() => store.zoomCamera(0.25)}
          className="p-2 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-colors active:scale-95"
          title="Zoom In"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="h-px w-full bg-white/10" />
        <button 
          onClick={() => store.zoomCamera(-0.25)}
          className="p-2 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-colors active:scale-95"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

