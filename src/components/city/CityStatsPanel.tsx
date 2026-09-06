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
    <div className="bg-black/70 backdrop-blur-sm text-white rounded-xl p-4 min-w-[200px] pointer-events-auto border border-white/5">
      <div className="text-xs text-gray-400 font-semibold mb-1 tracking-wider uppercase">
        {store.isVisitingCity ? 'VISITING' : 'YOUR CITY'}
      </div>
      <div className="font-bold text-xl mb-1">{store.cityName}</div>
      <div className="text-sm font-medium text-blue-400 mb-3">Lv. {store.cityLevel}</div>
      <hr className="border-white/20 mb-3" />
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="text-gray-300">Total Donated</span>
        <span className="font-semibold text-green-400">{formatMoney(store.totalDonated || 0)}</span>
      </div>
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="text-gray-300">Campaigns</span>
        <span className="font-semibold">{store.campaignsSupported || 0}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-300">Causes</span>
        <span className="font-semibold">{store.causesSupported || 0}</span>
      </div>
    </div>
  )
}
