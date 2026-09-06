'use client'

import dynamic from 'next/dynamic'
import { useCityStore } from '@/stores/useCityStore'
import { CityHUD } from '@/components/city/CityHUD'
import { BuildingModal } from '@/components/city/modals/BuildingModal'

const PhaserGame = dynamic(() => import('@/components/game/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen flex items-center justify-center bg-[#1a1a2e]">
      <div className="text-center">
        <div className="text-white text-2xl font-bold mb-4">Outgive City</div>
        <div className="text-gray-400 animate-pulse">Initializing...</div>
      </div>
    </div>
  ),
})

export default function PhaserWrapper() {
  const store = useCityStore()
  const { showBuildingModal, activeModal, isVisitingCity, visitingUserId } = store

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Layer 1: Phaser canvas (full viewport) */}
      <PhaserGame key={isVisitingCity ? visitingUserId : 'my_city'} />

      {/* Layer 2: HUD overlay (doesn't block game input) */}
      <CityHUD />

      {/* Layer 3: Building details modal */}
      {showBuildingModal && <BuildingModal />}

      {/* Layer 4: Full-screen modals (campaigns, leaderboard, etc.) */}
      {activeModal === 'campaigns' && <CampaignsModal />}
      {activeModal === 'leaderboard' && <LeaderboardModal />}
      {activeModal === 'profile' && <ProfileModal />}
      {activeModal === 'settings' && <SettingsModal />}
    </div>
  )
}

// Temporary placeholder modals — will be replaced with full implementations in Phase 3 & 4
import { CampaignsModal } from '@/components/city/modals/CampaignsModal'

import { LeaderboardModal } from '@/components/city/modals/LeaderboardModal'
import { ProfileModal } from '@/components/city/modals/ProfileModal'
import { SettingsModal } from '@/components/city/modals/SettingsModal'
