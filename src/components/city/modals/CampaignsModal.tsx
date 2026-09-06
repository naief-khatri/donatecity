'use client'

import { useCityStore } from '@/stores/useCityStore'
import { useState, useEffect } from 'react'

export function CampaignsModal() {
  const store = useCityStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [liveResults, setLiveResults] = useState<any[]>([])
  const [isSearchingLive, setIsSearchingLive] = useState(false)

  // Filter local campaigns

  const parseDescription = (desc: string) => {
    try {
      if (desc.startsWith('{')) {
        return JSON.parse(desc);
      }
    } catch(e) {}
    return { originalDescription: desc, isTrending: false };
  };

  const trendingCampaigns = store.campaigns.filter(c => parseDescription(c.description).isTrending);
  
  const localCampaigns = store.campaigns.filter(c => {
    const isTrending = parseDescription(c.description).isTrending;
    if (isTrending) return false;
    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.cause_category.toLowerCase().includes(searchTerm.toLowerCase());
  });


  // Live search effect for Every.org
  useEffect(() => {
    if (searchTerm.length < 3) {
      setLiveResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingLive(true)
      try {
        const res = await fetch(`/api/campaigns/search?q=${encodeURIComponent(searchTerm)}`)
        const data = await res.json()
        setLiveResults(data.nonprofits || [])
      } catch (e) {
        console.error(e)
      }
      setIsSearchingLive(false)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const detectCause = (campaign: any) => {
    if (campaign.cause_category) return campaign.cause_category;
    
    const text = (campaign.name + " " + (campaign.description || "")).toLowerCase();
    
    if (text.includes('wildfire') || text.includes('fire')) return 'wildfires';
    if (text.includes('climate') || text.includes('environment') || text.includes('planet')) return 'climate';
    if (text.includes('mental health') || text.includes('therapy') || text.includes('depression') || text.includes('suicide')) return 'mental-health';
    if (text.includes('water') || text.includes('ocean') || text.includes('river') || text.includes('clean water')) return 'water';
    if (text.includes('refugee') || text.includes('asylum') || text.includes('displaced')) return 'refugees';
    if (text.includes('energy') || text.includes('solar') || text.includes('power')) return 'energy';
    if (text.includes('health') || text.includes('medical') || text.includes('cancer') || text.includes('hospital') || text.includes('disease') || text.includes('clinic')) return 'health';
    if (text.includes('child') || text.includes('youth') || text.includes('kid') || text.includes('orphan')) return 'children';
    if (text.includes('food') || text.includes('hunger') || text.includes('meal') || text.includes('starvation') || text.includes('famine')) return 'food';
    if (text.includes('education') || text.includes('school') || text.includes('student') || text.includes('teacher') || text.includes('learning')) return 'education';
    if (text.includes('animal') || text.includes('dog') || text.includes('cat') || text.includes('wildlife') || text.includes('pet')) return 'animals';
    
    return 'health'; // Safe default
  };

  const handleDonate = async (campaign: any, amount: number) => {
    // We will simulate webhook call for testing
    try {
      const metadata = {
        cityId: store.cityId,
        campaignSlug: campaign.slug,
        campaignName: campaign.name,
        cause: detectCause(campaign),
        donorId: store.userId,
      }
      const encodedMetadata = Buffer.from(JSON.stringify(metadata)).toString('base64')

      const fakeWebhookPayload = {
        chargeId: `ch_simulated_${Date.now()}`,
        status: 'succeeded',
        amount: amount,
        nonprofit: { slug: campaign.slug },
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
    <div className="fixed inset-0 z-50 flex flex-col p-4 sm:p-6 md:p-8">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
        onClick={(e) => { e.stopPropagation(); store.closeModal(); }}
        onPointerDown={(e) => e.stopPropagation()}
      />
      
      <div 
        className="relative bg-gray-900/95 text-white rounded-2xl p-6 max-w-4xl w-full mx-auto max-h-[85vh] overflow-y-auto border border-white/10 shadow-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🏛 Expand Your City</h2>
          <button onClick={store.closeModal} className="text-gray-400 hover:text-white p-1">✕</button>
        </div>
        
        <p className="text-gray-400 mb-6">Search for causes or charities. Every donation adds or upgrades a building in your city.</p>
        
        <input 
          type="text" 
          placeholder="Search causes (e.g. Health, Water) or specific charities..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />


        {trendingCampaigns.length > 0 && !searchTerm && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🔥</span>
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Trending Global Crises</h3>
              <span className="ml-auto text-xs font-bold bg-white/10 px-2 py-1 rounded text-gray-400 border border-white/5">AI Aggregated</span>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent snap-x">
              {trendingCampaigns.map(c => {
                const meta = parseDescription(c.description);
                return (
                  <div key={c.slug} className="flex-none w-[320px] bg-gradient-to-b from-orange-900/40 to-black/40 rounded-xl p-5 border border-orange-500/30 flex flex-col snap-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">{meta.eventName || 'Emergency Event'}</div>
                    </div>
                    <div className="font-bold text-lg leading-tight mb-2 text-white">{c.name}</div>
                    <div className="text-sm text-gray-300 flex-grow mb-4 leading-snug">{meta.researchSummary || meta.originalDescription}</div>
                    
                    <div className="flex gap-2 mt-auto">
                      <button onClick={() => handleDonate(c, 10)} className="flex-1 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/30 text-orange-300 py-2 rounded-lg text-sm font-medium transition-colors">
                        $10
                      </button>
                      <button onClick={() => handleDonate(c, 25)} className="flex-1 bg-orange-600/40 hover:bg-orange-600/60 border border-orange-500/50 text-orange-200 py-2 rounded-lg text-sm font-medium transition-colors">
                        $25
                      </button>
                      <button onClick={() => handleDonate(c, 50)} className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-2 rounded-lg text-sm font-bold shadow-lg shadow-orange-900/50 transition-colors">
                        $50
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {localCampaigns.map(c => (
            <div key={c.slug} className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="font-semibold text-lg">{c.name}</div>
                <div className="text-xs text-emerald-400 font-medium tracking-wide uppercase mt-1">{c.cause_category}</div>
                <div className="text-sm text-gray-400 mt-2 line-clamp-2">{c.description}</div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleDonate(c, 10)} className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 py-2 rounded-lg text-sm font-medium transition-colors">
                  $10
                </button>
                <button onClick={() => handleDonate(c, 25)} className="flex-1 bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-500/50 text-emerald-300 py-2 rounded-lg text-sm font-medium transition-colors">
                  $25
                </button>
                <button onClick={() => handleDonate(c, 50)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/50 transition-colors">
                  $50
                </button>
              </div>
            </div>
          ))}

          {liveResults.map(c => (
            <div key={c.slug} className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/30 flex flex-col justify-between">
              <div>
                <div className="text-xs text-purple-400 font-bold tracking-wide uppercase mb-1">Global Every.org Match</div>
                <div className="font-semibold text-lg">{c.name}</div>
                <div className="text-sm text-gray-400 mt-2 line-clamp-2">{c.description}</div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleDonate(c, 10)} className="flex-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 py-2 rounded-lg text-sm font-medium transition-colors">
                  $10
                </button>
                <button onClick={() => handleDonate(c, 25)} className="flex-1 bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/50 text-purple-300 py-2 rounded-lg text-sm font-medium transition-colors">
                  $25
                </button>
                <button onClick={() => handleDonate(c, 50)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm font-bold shadow-lg shadow-purple-900/50 transition-colors">
                  $50
                </button>
              </div>
            </div>
          ))}
        </div>

        {isSearchingLive && (
          <p className="text-center text-gray-400 mt-4 animate-pulse">Searching global nonprofits...</p>
        )}

        {localCampaigns.length === 0 && liveResults.length === 0 && !isSearchingLive && (
          <p className="text-center text-gray-500 py-8">No campaigns found.</p>
        )}
      </div>
    </div>
  )
}
