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
  

  const nextLevelAmount = b.level * 50;
  const currentLevelBase = (b.level - 1) * 50;
  const progressAmount = b.totalDonated - currentLevelBase;
  const progressPercent = Math.min(100, Math.max(0, (progressAmount / 50) * 100));

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
        className="relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto scrollbar-hide bg-gray-900/95 backdrop-blur-md text-white rounded-2xl p-6 shadow-2xl border border-white/10 pointer-events-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => store.closeBuildingModal()}
          className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 transition-colors p-1.5 rounded-full z-20 backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="relative w-[calc(100%+3rem)] h-56 -mt-6 -mx-6 mb-6 bg-gradient-to-b from-blue-900/30 to-transparent rounded-t-2xl flex items-end justify-center overflow-hidden border-b border-white/5">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
           <img 
             src={`/assets/buildings/${b.cause}_lvl${b.level}.png`} 
             alt={entry.displayName}
             className="relative z-10 w-full h-[120%] object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] origin-bottom pb-2"
             onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/buildings/building_new_placeholder.png'
             }}
           />
        </div>

        <div className="mb-6">
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

          {b.lastDonationAt && (
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-gray-400 mb-1 font-medium">Last Donation</div>
              <div className="font-semibold text-sm mt-1">{formatDate(b.lastDonationAt)}</div>
            </div>
          )}
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6 flex-shrink-0">
          <div className="mb-4">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-sm font-bold text-gray-200">Level {b.level}</span>
              <span className="text-xs font-medium text-gray-400">{formatMoney(b.totalDonated)} / {formatMoney(nextLevelAmount)}</span>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-right mt-1 text-[10px] text-blue-400 font-medium tracking-wide uppercase">
              {formatMoney(nextLevelAmount - b.totalDonated)} to next level
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mb-2 font-medium">Building Evolution</div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent snap-x">
            {Array.from({ length: b.level + 1 }).map((_, i) => {
              const level = i + 1;
              const isNext = level === b.level + 1;
              
              return (
                <div 
                  key={level} 
                  className={`flex-none w-[140px] h-[140px] rounded-xl flex flex-col items-center justify-center relative overflow-hidden border ${isNext ? 'border-dashed border-gray-600 bg-gray-800/40' : 'border-blue-500/40 bg-blue-500/10'} snap-center`}
                >
                  {isNext ? (
                     <div className="text-center p-3">
                       <span className="text-3xl opacity-40 block mb-2">?</span>
                       <span className="text-xs text-gray-400 leading-snug block">Reach {formatMoney(nextLevelAmount)}<br/>to reveal</span>
                     </div>
                  ) : (
                     <>
                       <img 
                         src={`/assets/buildings/${b.cause}_lvl${level}.png`} 
                         className="w-full h-full object-contain p-2 drop-shadow-lg" 
                         alt={`Level ${level}`}
                         onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/buildings/building_new_placeholder.png'
                         }}
                       />
                       <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-bold text-blue-300 shadow-sm border border-white/10">
                         Lvl {level}
                       </div>
                     </>
                  )}
                </div>
              )
            })}
          </div>
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
