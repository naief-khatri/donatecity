import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { GoogleGenAI } from '@google/genai'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if ((process.env.NODE_ENV as string) !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if ((process.env.NODE_ENV as string) !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const rssRes = await fetch('https://news.google.com/rss/search?q=crisis+OR+disaster+OR+humanitarian+OR+emergency&hl=en-US&gl=US&ceid=US:en');
    const rssText = await rssRes.text();
    const titlesMatch = rssText.match(/<title>(.*?)<\/title>/g);
    const titles = titlesMatch ? titlesMatch.map(t => t.replace(/<\/?title>/g, '')).slice(1, 20).join('\n') : '';

    if (!titles) throw new Error('Could not fetch news');

    const ai = new GoogleGenAI({ apiKey: process.env.NANO_BANANA_API_KEY });
    const prompt = `
You are an AI research assistant for a charity application.
Here are the latest global news headlines regarding crises, disasters, and humanitarian emergencies:
${titles}

Based on these headlines, identify the top 5 most critical and distinct events that require urgent donations.
For each event, provide:
1. A short, compelling research summary (2-3 sentences) explaining the impact and how donations help.
2. A broad, 1-2 word search query that is guaranteed to find relevant non-profits on Every.org (e.g., "Wildfire", "Morocco", "Sudan", "Refugee", "Hunger"). Do not use highly specific long phrases.
3. A cause category. You MUST choose exactly one from this list: "climate", "mental-health", "water", "wildfires", "refugees", "energy", "health", "children", "food", "education", "animals".

Respond STRICTLY in this JSON format, nothing else:
[
  {
    "eventName": "Name of the Event",
    "researchSummary": "...",
    "searchQuery": "...",
    "causeCategory": "valid_category_from_list"
  }
]
`;

    // Wait, gemini-3.1-flash-image is for images. Let's use gemini-3.1-flash or gemini-2.5-flash or just whatever works.
    // The previous generation route used `gemini-3.1-flash-image`. If it's the only one, maybe it does text too?
    // Usually Nano Banana has `gemini-3.6-flash`. Let's try that, or we can use `ai.models.generateContent` with `gemini-3.5-flash` or just `gemini-pro`.
    // Actually, GoogleGenAI model names are `gemini-2.5-flash` or `gemini-2.0-flash`. The previous test gave:
    // "This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.6-flash"
    // So we MUST use `gemini-3.6-flash` !!
    const aiRes = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });
    
    let aiText = aiRes.text || '[]';
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const events = JSON.parse(aiText);

    const supabaseAdmin = createAdminClient();
    const everyApiKey = process.env.EVERY_ORG_API_KEY;
    let campaignsToUpsert = [];

    for (const event of events) {
      if (campaignsToUpsert.length >= 2) break; // Limit to exactly 2 events as requested
      
      const searchRes = await fetch(`https://partners.every.org/v0.2/search/${encodeURIComponent(event.searchQuery)}?apiKey=${everyApiKey}&take=1`);
      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      const np = searchData.nonprofits && searchData.nonprofits[0];
      
      if (np) {
        campaignsToUpsert.push({
          slug: np.slug,
          name: np.name,
          description: JSON.stringify({
            isTrending: true,
            eventName: event.eventName,
            researchSummary: event.researchSummary,
            originalDescription: np.description || ''
          }),
          logo_url: np.logoUrl || '',
          cause_category: event.causeCategory || 'health', // Fallback to health if model fails
          building_type: 'Community Center',
          internal_rank: 100,
          is_active: true,
          updated_at: new Date().toISOString()
        });
      }
    }

    if (campaignsToUpsert.length > 0) {
      await supabaseAdmin.from('campaigns').update({ cause_category: 'past_trending', internal_rank: 0 }).like('cause_category', 'trending_%');
      const { error } = await supabaseAdmin.from('campaigns').upsert(campaignsToUpsert, { onConflict: 'slug' });
      if (error) throw error;
    }

    return NextResponse.json({ success: true, events: campaignsToUpsert });
  } catch (error: any) {
    console.error('Trending sync error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
