'use client'

import { useCityStore } from '@/stores/useCityStore'
import { useState } from 'react'
import { X, Heart, ExternalLink } from 'lucide-react'
import { getBuildingEntry } from '@/game/config/buildingRegistry'

export function BuildingModal() {
  const store = useCityStore()
  const [tab, setTab] = useState<'overview' | 'donations'>('overview')

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

  // Filter donations for this specific building
  const buildingDonations = store.donations.filter(d => d.campaignSlug === b.campaignSlug).reverse()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={(e) => { e.stopPropagation(); store.closeBuildingModal(); }}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div 
        className="relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto scrollbar-hide bg-[#FAFAFA] text-[#1E1E24] rounded-[2rem] p-6 shadow-[8px_8px_0_0_#1E1E24] border-4 border-[#1E1E24] pointer-events-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => store.closeBuildingModal()}
          className="absolute top-4 right-4 bg-white border-2 border-[#1E1E24] rounded-full p-2 text-[#1E1E24] shadow-[0_2px_0_0_#1E1E24] hover:shadow-[0_0px_0_0_#1E1E24] hover:translate-y-[2px] transition-all z-20 w-8 h-8 flex items-center justify-center font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="relative w-[calc(100%+3rem)] h-56 -mt-6 -mx-6 mb-6 bg-[#EBF3FF] rounded-t-[1.75rem] flex items-end justify-center overflow-hidden border-b-4 border-[#1E1E24] flex-shrink-0">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"></div>
           <img 
             src={`/assets/buildings/${b.cause}_lvl${b.level}.png`} 
             alt={entry.displayName}
             className="relative z-10 w-full h-[90%] object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] origin-bottom pb-4"
             onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/buildings/building_new_placeholder.png'
             }}
           />
        </div>

        <div className="mb-4 flex-shrink-0">
          <h2 className="text-3xl font-black text-[#1E1E24] mb-3 pr-6 tracking-tight leading-tight">{entry.displayName}</h2>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-[#4285F4]/20 text-[#4285F4] border-2 border-[#4285F4] rounded-full text-xs font-bold uppercase tracking-wider">
              {b.cause}
            </span>
          </div>
          <p className="text-[#1E1E24] font-black font-medium text-lg leading-snug mb-1">{b.campaignName}</p>
          {b.organizationName && (
            <p className="text-sm text-[#64646F] font-bold">{b.organizationName}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-shrink-0">
          <button 
            onClick={() => setTab('overview')}
            className={`flex-1 py-3 px-4 font-black rounded-2xl border-2 transition-all ${tab === 'overview' ? 'bg-[#FFD166] border-[#1E1E24] text-[#1E1E24] shadow-[0_4px_0_0_#1E1E24]' : 'bg-white border-[#E1E1E8] text-[#A1A1AA] hover:bg-gray-50'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setTab('donations')}
            className={`flex-1 py-3 px-4 font-black rounded-2xl border-2 transition-all ${tab === 'donations' ? 'bg-[#4285F4] border-[#1E1E24] text-white shadow-[0_4px_0_0_#1E1E24]' : 'bg-white border-[#E1E1E8] text-[#A1A1AA] hover:bg-gray-50'}`}
          >
            Donations
          </button>
        </div>

        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6 flex-shrink-0">
              <div className="bg-white rounded-2xl p-3 border-2 border-[#E1E1E8] shadow-sm">
                <div className="text-xs text-[#64646F] font-bold mb-1 font-medium">Total Donated</div>
                <div className="font-bold text-[#00A36C] font-black text-lg">{formatMoney(b.totalDonated)}</div>
              </div>
              <div className="bg-white rounded-2xl p-3 border-2 border-[#E1E1E8] shadow-sm">
                <div className="text-xs text-[#64646F] font-bold mb-1 font-medium">Donations</div>
                <div className="font-bold text-lg">{b.donationCount}</div>
              </div>

              {b.lastDonationAt && (
                <div className="bg-white rounded-2xl p-3 border-2 border-[#E1E1E8] shadow-sm col-span-2">
                  <div className="text-xs text-[#64646F] font-bold mb-1 font-medium">Last Donation</div>
                  <div className="font-semibold text-sm mt-1">{formatDate(b.lastDonationAt)}</div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border-2 border-[#E1E1E8] shadow-sm mb-6 flex-shrink-0">
              <div className="mb-4">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-sm font-bold text-[#1E1E24] font-black">Level {b.level}</span>
                  <span className="text-xs font-medium text-[#64646F] font-bold">{formatMoney(b.totalDonated)} / {formatMoney(nextLevelAmount)}</span>
                </div>
                <div className="h-4 w-full bg-[#E1E1E8] rounded-full overflow-hidden border-2 border-[#1E1E24] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                  <div 
                    className="h-full bg-[#4285F4] transition-all duration-500 border-r-2 border-[#1E1E24]" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-right mt-1 text-[10px] text-[#4285F4] font-black tracking-wide uppercase">
                  {formatMoney(nextLevelAmount - b.totalDonated)} to next level
                </div>
              </div>
              
              <div className="text-xs text-[#64646F] font-bold mb-2 font-medium">Building Evolution</div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#E1E1E8] scrollbar-track-transparent snap-x">
                {Array.from({ length: b.level + 1 }).map((_, i) => {
                  const level = i + 1;
                  const isNext = level === b.level + 1;
                  
                  return (
                    <div 
                      key={level} 
                      className={`flex-none w-[140px] h-[140px] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border-2 ${isNext ? 'border-dashed border-[#A1A1AA] bg-[#F4F4F5]' : 'border-[#1E1E24] bg-white shadow-[0_4px_0_0_#1E1E24]'} snap-center`}
                    >
                      {isNext ? (
                         <div className="text-center p-3">
                           <span className="text-3xl opacity-40 block mb-2">?</span>
                           <span className="text-xs font-bold text-[#A1A1AA] leading-snug block">Reach {formatMoney(nextLevelAmount)}<br/>to reveal</span>
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
                           <div className="absolute bottom-2 right-2 bg-[#FFD166] border-2 border-[#1E1E24] text-[#1E1E24] shadow-[0_2px_0_0_#1E1E24] px-2 py-0.5 rounded-md text-xs font-black">
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
                className="w-full py-3 px-4 bg-[#00A36C] hover:bg-[#008A5B] text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all border-2 border-[#1E1E24] shadow-[0_4px_0_0_#1E1E24] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#1E1E24] flex-shrink-0"
              >
                <Heart className="w-5 h-5 fill-current" />
                Donate $25 Again
              </button>
            )}
          </>
        )}

        {tab === 'donations' && (
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#E1E1E8] scrollbar-track-transparent">
            {buildingDonations.length === 0 ? (
              <p className="text-center text-[#A1A1AA] font-bold py-8">No donations found.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {buildingDonations.map((d, i) => (
                  <div key={d.donationId || i} className="bg-white border-2 border-[#1E1E24] rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_0_0_#1E1E24]">
                    <div>
                      <div className="text-[#1E1E24] font-black">
                        {d.donatedById ? "🎁 Gifted Donation" : `Donation #${d.sequence}`}
                      </div>
                      <div className="text-xs text-[#64646F] font-bold mt-0.5">{formatDate(d.createdAt)}</div>
                      {d.donorMessage && (
                        <div className="text-sm font-medium italic mt-2 text-[#4285F4]">"{d.donorMessage}"</div>
                      )}
                    </div>
                    <div className="font-black text-xl text-[#00A36C] bg-[#EBF3FF] border-2 border-[#E1E1E8] px-3 py-1 rounded-xl">
                      {formatMoney(d.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
