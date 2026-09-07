'use client'

import { useCityStore } from '@/stores/useCityStore'
import { useState, useEffect } from 'react'

export function CampaignsModal() {
  const store = useCityStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [liveResults, setLiveResults] = useState<any[]>([])
  const [isSearchingLive, setIsSearchingLive] = useState(false)
  const [isGifting, setIsGifting] = useState(false)
  const [giftRecipient, setGiftRecipient] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [isProcessingGift, setIsProcessingGift] = useState(false)
  const [giftStatus, setGiftStatus] = useState<string | null>(null)

  // Filter local campaigns

  const parseDescription = (desc: string) => {
    try {
      if (desc.startsWith('{')) {
        return JSON.parse(desc);
      }
    } catch(e) {}
    return { originalDescription: desc, isTrending: false };
  };

  const trendingCampaigns = store.campaigns.filter(c => parseDescription(c.description || '').isTrending);
  
  const localCampaigns = store.campaigns.filter(c => {
    const isTrending = parseDescription(c.description || '').isTrending;
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
    if (isGifting) {
      if (!giftRecipient.trim()) {
        setGiftStatus('Please enter a username or email.')
        return
      }
      setIsProcessingGift(true)
      setGiftStatus('Processing gift...')
      try {
        const payload = {
          recipient: giftRecipient.trim(),
          message: giftMessage.trim() || undefined,
          campaignSlug: campaign.slug,
          campaignName: campaign.name,
          organizationName: campaign.name,
          cause: detectCause(campaign),
          amount: amount
        }
        const res = await fetch('/api/donate/gift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (res.ok && data.success) {
          if (data.status === 'gifted_email') {
            setGiftStatus(`Gift sent! We invited ${giftRecipient}.`)
          } else {
            setGiftStatus(`Gift successful! ${giftRecipient}'s city grew.`)
          }
          setTimeout(() => {
            setIsGifting(false)
            setGiftRecipient('')
            setGiftMessage('')
            setGiftStatus(null)
          }, 4000)
        } else {
          setGiftStatus(data.error || 'Failed to send gift.')
        }
      } catch (err) {
        console.error(err)
        setGiftStatus('Network error while processing gift.')
      } finally {
        setIsProcessingGift(false)
      }
      return
    }

    // Normal flow
    try {
      const payload = {
        cityId: store.cityId,
        campaignSlug: campaign.slug,
        campaignName: campaign.name,
        organizationName: campaign.name,
        cause: detectCause(campaign),
        amount: amount,
      }

      const res = await fetch('/api/donate/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (!data.success) {
        alert('Failed to initialize donation')
        return
      }

      if (data.isTestMode) {
        // Simulate webhook
        const fakeWebhookPayload = {
          chargeId: `ch_simulated_${Date.now()}`,
          status: 'succeeded',
          amount: amount,
          nonprofit: { slug: campaign.slug },
          partnerMetadata: data.metadata
        }

        const whRes = await fetch('/api/webhooks/every', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fakeWebhookPayload)
        })
        
        const whData = await whRes.json()
        if (whData.success) {
          window.location.reload()
        } else {
          alert('Simulation failed. Check console.')
        }
      } else {
        // Redirect to Every.org checkout
        window.location.href = data.checkoutUrl
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
        className="relative bg-[#FAFAFA] text-[#1E1E24] rounded-[2rem] p-6 max-w-4xl w-full mx-auto max-h-[85vh] overflow-y-auto border-4 border-[#1E1E24] shadow-[8px_8px_0_0_#1E1E24] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black tracking-tight text-[#1E1E24]">🏛 Expand Your City</h2>
          <button onClick={store.closeModal} className="bg-white border-2 border-[#1E1E24] rounded-full p-2 text-[#1E1E24] shadow-[0_2px_0_0_#1E1E24] hover:shadow-[0_0px_0_0_#1E1E24] hover:translate-y-[2px] transition-all z-10 w-8 h-8 flex items-center justify-center font-bold">✕</button>
        </div>
        
        <p className="text-[#64646F] font-bold mb-6">Search for causes or charities. Every donation adds or upgrades a building in your city.</p>
        
        <input 
          type="text" 
          placeholder="Search causes (e.g. Health, Water) or specific charities..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border-4 border-[#1E1E24] text-[#1E1E24] placeholder:text-[#A1A1AA] font-bold rounded-2xl px-4 py-4 mb-4 focus:outline-none focus:border-[#4285F4] focus:ring-0 shadow-[4px_4px_0_0_#1E1E24]"
        />

        {/* Gift Donation Card / Toggle */}
        <div className="mb-6 bg-[#EBF3FF] border-4 border-[#1E1E24] rounded-2xl p-4 shadow-[4px_4px_0_0_#1E1E24]">
          <div 
            className="flex items-center justify-between cursor-pointer select-none" 
            onClick={() => {
              setIsGifting(!isGifting)
              setGiftStatus(null)
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <h3 className="font-black text-[#1E1E24] text-base leading-tight">Donate on Behalf of Someone</h3>
                <p className="text-xs font-bold text-[#4285F4] mt-0.5">Gift a building to a friend using username or email</p>
              </div>
            </div>
            <button
              type="button"
              className={`w-14 h-8 rounded-full border-2 border-[#1E1E24] p-0.5 transition-colors relative ${isGifting ? 'bg-[#4285F4]' : 'bg-[#E1E1E8]'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white border-2 border-[#1E1E24] shadow-[0_2px_0_0_#1E1E24] transition-transform ${isGifting ? 'translate-x-6 bg-[#FFD166]' : 'translate-x-0'}`} />
            </button>
          </div>
          
          {isGifting && (
            <div className="mt-4 pt-4 border-t-2 border-[#1E1E24]/10 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-black text-[#1E1E24] mb-1 uppercase tracking-wider">Recipient (Username or Email)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Alice or friend@example.com" 
                  value={giftRecipient}
                  onChange={(e) => setGiftRecipient(e.target.value)}
                  className="w-full bg-white border-2 border-[#1E1E24] text-[#1E1E24] placeholder:text-[#A1A1AA] rounded-xl px-4 py-2.5 font-bold shadow-[0_2px_0_0_#1E1E24] focus:outline-none focus:translate-y-[1px] focus:shadow-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#1E1E24] mb-1 uppercase tracking-wider">Personal Message (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Here's a building for your city! 🎉" 
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full bg-white border-2 border-[#1E1E24] text-[#1E1E24] placeholder:text-[#A1A1AA] rounded-xl px-4 py-2.5 font-bold shadow-[0_2px_0_0_#1E1E24] focus:outline-none focus:translate-y-[1px] focus:shadow-none transition-all text-sm"
                />
              </div>

              {giftStatus && (
                <div className={`text-sm font-black p-2.5 rounded-xl border-2 border-[#1E1E24] shadow-[0_2px_0_0_#1E1E24] text-center ${
                  giftStatus.includes('successful') || giftStatus.includes('sent')
                    ? 'bg-[#E6F9F0] text-[#00A36C]' 
                    : 'bg-[#FFF0F0] text-[#FF4A4A]'
                }`}>
                  {giftStatus}
                </div>
              )}
            </div>
          )}
        </div>


        {trendingCampaigns.length > 0 && !searchTerm && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🔥</span>
              <h3 className="text-xl font-bold text-transparent text-[#FFA114]">Trending Global Crises</h3>
              <span className="ml-auto text-xs font-bold bg-[#FFE8CC] text-[#FFA114] px-2 py-1 rounded-md border-2 border-[#FFA114]">AI Aggregated</span>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent snap-x">
              {trendingCampaigns.map(c => {
                const meta = parseDescription(c.description || '');
                return (
                  <div key={c.slug} className="flex-none w-[320px] bg-[#FFF4E5] rounded-3xl p-5 border-4 border-[#FFA114] flex flex-col snap-center shadow-[4px_4px_0_0_#FFA114] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#FFA114]"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs font-bold text-[#FFA114] uppercase tracking-wider">{meta.eventName || 'Emergency Event'}</div>
                    </div>
                    <div className="font-bold text-lg leading-tight mb-2 text-[#1E1E24]">{c.name}</div>
                    <div className="text-sm text-[#64646F] font-bold flex-grow mb-4 leading-snug">{meta.researchSummary || meta.originalDescription}</div>
                    
                    <div className="flex gap-2 mt-auto">
                      <button onClick={() => handleDonate(c, 10)} className="flex-1 bg-white hover:bg-orange-50 border-2 border-[#FFA114] text-[#FFA114] shadow-[0_2px_0_0_#FFA114] hover:translate-y-[2px] hover:shadow-none py-2 rounded-lg text-sm font-medium transition-colors">
                        $10
                      </button>
                      <button onClick={() => handleDonate(c, 25)} className="flex-1 bg-white hover:bg-orange-50 border-2 border-[#FFA114] text-[#FFA114] shadow-[0_2px_0_0_#FFA114] hover:translate-y-[2px] hover:shadow-none py-2 rounded-lg text-sm font-medium transition-colors">
                        $25
                      </button>
                      <button onClick={() => handleDonate(c, 50)} className="flex-1 bg-[#FFA114] hover:bg-[#E58900] text-[#1E1E24] py-2 rounded-xl border-2 border-[#1E1E24] shadow-[0_4px_0_0_#1E1E24] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#1E1E24] transition-all font-black text-sm">
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
            <div key={c.slug} className="bg-white rounded-3xl p-5 border-4 border-[#E1E1E8] flex flex-col justify-between shadow-[4px_4px_0_0_#E1E1E8] hover:border-[#00A36C] transition-colors">
              <div>
                <div className="font-semibold text-lg">{c.name}</div>
                <div className="text-xs text-[#00A36C] font-black font-medium tracking-wide uppercase mt-1">{c.cause_category}</div>
                <div className="text-sm text-[#64646F] font-bold mt-2 line-clamp-2">{c.description || ''}</div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleDonate(c, 10)} className="flex-1 bg-white hover:bg-emerald-50 border-2 border-[#00A36C] text-[#00A36C] shadow-[0_2px_0_0_#00A36C] hover:translate-y-[2px] hover:shadow-none py-2 rounded-lg text-sm font-medium transition-colors">
                  $10
                </button>
                <button onClick={() => handleDonate(c, 25)} className="flex-1 bg-white hover:bg-emerald-50 border-2 border-[#00A36C] text-[#00A36C] shadow-[0_2px_0_0_#00A36C] hover:translate-y-[2px] hover:shadow-none py-2 rounded-lg text-sm font-medium transition-colors">
                  $25
                </button>
                <button onClick={() => handleDonate(c, 50)} className="flex-1 bg-[#00A36C] hover:bg-[#008A5B] text-white py-2 rounded-xl border-2 border-[#1E1E24] shadow-[0_4px_0_0_#1E1E24] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#1E1E24] transition-all font-black text-sm">
                  $50
                </button>
              </div>
            </div>
          ))}

          {liveResults.map(c => (
            <div key={c.slug} className="bg-[#F9F0FF] rounded-3xl p-5 border-4 border-[#B959FF] flex flex-col justify-between shadow-[4px_4px_0_0_#B959FF]">
              <div>
                <div className="text-xs text-[#B959FF] font-black font-bold tracking-wide uppercase mb-1">Global Every.org Match</div>
                <div className="font-semibold text-lg">{c.name}</div>
                <div className="text-sm text-[#64646F] font-bold mt-2 line-clamp-2">{c.description || ''}</div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleDonate(c, 10)} className="flex-1 bg-white hover:bg-purple-50 border-2 border-[#B959FF] text-[#B959FF] shadow-[0_2px_0_0_#B959FF] hover:translate-y-[2px] hover:shadow-none py-2 rounded-lg text-sm font-medium transition-colors">
                  $10
                </button>
                <button onClick={() => handleDonate(c, 25)} className="flex-1 bg-white hover:bg-purple-50 border-2 border-[#B959FF] text-[#B959FF] shadow-[0_2px_0_0_#B959FF] hover:translate-y-[2px] hover:shadow-none py-2 rounded-lg text-sm font-medium transition-colors">
                  $25
                </button>
                <button onClick={() => handleDonate(c, 50)} className="flex-1 bg-[#B959FF] hover:bg-[#9F48E0] text-white py-2 rounded-xl border-2 border-[#1E1E24] shadow-[0_4px_0_0_#1E1E24] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#1E1E24] transition-all font-black text-sm">
                  $50
                </button>
              </div>
            </div>
          ))}
        </div>

        {isSearchingLive && (
          <p className="text-center text-[#64646F] font-bold mt-4 animate-pulse">Searching global nonprofits...</p>
        )}

        {localCampaigns.length === 0 && liveResults.length === 0 && !isSearchingLive && (
          <p className="text-center text-[#A1A1AA] font-bold py-8">No campaigns found.</p>
        )}
      </div>
    </div>
  )
}
