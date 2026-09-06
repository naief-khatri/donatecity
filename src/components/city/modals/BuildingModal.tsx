'use client'

import { useCityStore } from '@/stores/useCityStore'
import { X, Heart, ExternalLink } from 'lucide-react'
import { getBuildingEntry } from '@/game/config/buildingRegistry'

export function BuildingModal() {
  const store = useCityStore()

  if (!store.showBuildingModal || !store.selectedBuilding) {
    return null
  }

  const b = store.selectedBuilding
  // Fallback to cause string if entry not found to avoid crashing
  const entry = getBuildingEntry(b.cause) || { displayName: b.cause }
  
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDonateAgain = async () => {
    try {
      const metadata = {
        cityId: store.cityId,
        campaignSlug: b.campaignSlug,
        campaignName: b.campaignName,
        cause: b.cause,
        donorId: store.userId,
      }
      const encodedMetadata = Buffer.from(JSON.stringify(metadata)).toString('base64')

      const fakeWebhookPayload = {
        chargeId: `ch_simulated_${Date.now()}`,
        status: 'succeeded',
        amount: 25, // Default $25 for quick upgrades
        nonprofit: { slug: b.campaignSlug },
        partnerMetadata: encodedMetadata
      }

      const res = await fetch('/api/webhooks/every', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fakeWebhookPayload)
      })
      
      const data = await res.json()
      if (data.success) {
        window.location.reload()
      } else {
        alert('Simulation failed. Check console.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={(e) => { e.stopPropagation(); store.closeBuildingModal(); }}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div 
        className="relative w-full max-w-[400px] bg-gray-900/95 backdrop-blur-md text-white rounded-2xl p-6 shadow-2xl border border-white/10 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => store.closeBuildingModal()}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 mt-2">
          <h2 className="text-2xl font-bold mb-3 pr-6 leading-tight">{entry.displayName}</h2>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider">
              {b.cause}
            </span>
          </div>
          <p className="text-gray-200 font-medium text-lg leading-snug mb-1">{b.campaignName}</p>
          {b.organizationName && (
            <p className="text-sm text-gray-400">{b.organizationName}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-gray-400 mb-1 font-medium">Total Donated</div>
            <div className="font-bold text-green-400 text-lg">{formatMoney(b.totalDonated)}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-gray-400 mb-1 font-medium">Donations</div>
            <div className="font-bold text-lg">{b.donationCount}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-gray-400 mb-1 font-medium">Building Level</div>
            <div className="flex gap-1 items-center mt-1">
              {[1, 2, 3, 4].map(level => (
                <div 
                  key={level} 
                  className={`w-2.5 h-2.5 rounded-full ${level <= b.level ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 'bg-gray-700'}`}
                />
              ))}
              <span className="ml-1 font-bold text-sm text-blue-300">{b.level}</span>
            </div>
          </div>
          {b.lastDonationAt && (
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-gray-400 mb-1 font-medium">Last Donation</div>
              <div className="font-semibold text-sm mt-1">{formatDate(b.lastDonationAt)}</div>
            </div>
          )}
        </div>

        {!store.isVisitingCity && (
          <button 
            onClick={handleDonateAgain}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
          >
            <Heart className="w-5 h-5 fill-current" />
            Donate $25 Again
          </button>
        )}
      </div>
    </div>
  )
}
