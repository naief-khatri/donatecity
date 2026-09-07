'use client'

import { useCityStore } from '@/stores/useCityStore'

export function CityStatsPanel() {
  const store = useCityStore()

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="bg-[#FAFAFA] text-[#1E1E24] rounded-3xl p-4 min-w-[200px] max-w-[240px] pointer-events-auto border-4 border-[#1E1E24] shadow-[4px_4px_0_0_#1E1E24] relative">
      <div className="absolute -top-3 -right-3 bg-[#FFD166] border-2 border-[#1E1E24] text-[#1E1E24] text-xs font-black px-3 py-1 rounded-full shadow-[2px_2px_0_0_#1E1E24] transform rotate-3">
        Lv. {store.cityLevel}
      </div>
      <div className="text-xs text-[#A1A1AA] font-black mb-1 tracking-widest uppercase">
        {store.isVisitingCity ? 'VISITING' : 'YOUR CITY'}
      </div>
      <div className="font-black text-xl mb-3 truncate" title={store.cityName}>{store.cityName}</div>
      <div className="h-1 w-full bg-[#E1E1E8] rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-[#4285F4] w-3/4 rounded-full border-r-2 border-[#1E1E24]"></div>
      </div>
      <div className="flex justify-between items-center text-sm mb-2 font-bold">
        <span className="text-[#64646F]">Total Donated</span>
        <span className="font-black text-[#00A36C]">{formatMoney(store.totalDonated || 0)}</span>
      </div>
      <div className="flex justify-between items-center text-sm mb-2 font-bold">
        <span className="text-[#64646F]">Campaigns</span>
        <span className="font-black">{store.campaignsSupported || 0}</span>
      </div>
      <div className="flex justify-between items-center text-sm font-bold">
        <span className="text-[#64646F]">Causes</span>
        <span className="font-black">{store.causesSupported || 0}</span>
      </div>
    </div>
  )
}
