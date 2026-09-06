# Implementation Plan

- [x] **Phase 1 (Foundation)**
  - [x] Initialize Next.js project
  - [x] Set up Tailwind CSS & shadcn/ui
  - [x] Set up Supabase Auth
  - [x] Create Postgres Schema (profiles, cities, buildings, webhook_events)
  - [x] Implement Row Level Security (RLS) on all public tables
  - [x] Create User Profiles UI and flow

- [x] **Phase 2 (The City)**
  - [x] Integrate Phaser 4
  - [x] Implement 40x40 isometric grid rendering
  - [x] Implement terrain and camera controls (pan, zoom)
  - [x] Implement plot selection logic (click to select empty grid)
  - [ ] Implement building registry and visual assets

- [x] **Phase 3 (Donation Pipeline)**
  - [x] Create `POST /api/donate/intent` API route
  - [x] Integrate Every.org API for checkout URL generation
  - [x] Create idempotent webhook handler `POST /api/webhooks/every`
  - [ ] Write unit tests for webhook handler and placement logic

- [ ] **Phase 4 (Realtime & Game)**
  - [ ] Implement Supabase Realtime subscriptions in Next.js/Zustand
  - [ ] Sync Zustand state with Phaser game instance
  - [ ] Implement Phaser construction animations on receiving real-time events
  - [ ] Update city stats based on new buildings

- [ ] **Phase 5 (Social & Progression)**
  - [ ] Implement Leaderboards (People & Causes)
  - [ ] Implement User Gifting
  - [ ] Implement Quests & Achievements
  - [ ] Implement Public URLs for cities

- [ ] **Phase 6 (Continuous Testing & Polish)**
  - [ ] Run functional tests (verify no hydration errors, build failures, UI regressions)
  - [ ] Simulate end-to-end "Wow" Core Loop locally
