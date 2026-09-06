# Architecture

## Overview
Outgive is a gamified charitable giving platform. Users donate via Every.org, and their confirmed donations create permanent buildings in a personal or community 40x40 isometric city.

## Tech Stack
- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Game Engine**: Phaser 4
- **State Management**: Zustand
- **Backend & DB**: Supabase (Postgres, Auth, Realtime, Storage) + Next.js API Routes
- **Donation API**: Every.org

## Architectural Hard Rules
- **Separation of Concerns**: React owns the UI. Phaser 4 owns the game canvas (isometric projection, city rendering, camera, animations). City tiles are NOT React components.
- **Server Authority**: The client never creates confirmed donations or permanent buildings. All confirmed state comes from the Every.org webhook.
- **Idempotency**: Webhook processing must be idempotent. Prevent race conditions on city plots using Postgres `UNIQUE(city_id, grid_x, grid_y)`.
- **Security**: Implement Row Level Security (RLS) on all public tables. The `SUPABASE_SERVICE_ROLE_KEY` must never reach the browser.
- **No TODOs**: Write complete, production-ready code.

## Database Schema (Postgres / Supabase)

### Table: `profiles`
- `id` (uuid, PK) - references `auth.users`
- `username` (text, unique)
- `created_at` (timestamp)

### Table: `cities`
- `id` (uuid, PK)
- `owner_id` (uuid, FK to `profiles.id`)
- `name` (text)
- `created_at` (timestamp)

### Table: `buildings`
- `id` (uuid, PK)
- `city_id` (uuid, FK to `cities.id`)
- `grid_x` (int)
- `grid_y` (int)
- `building_type` (text) - e.g., 'School', 'Hospital'
- `charity_id` (text) - Every.org charity identifier
- `amount` (numeric)
- `donor_id` (uuid, FK to `profiles.id`, nullable for anon)
- `created_at` (timestamp)
- **Constraint**: `UNIQUE(city_id, grid_x, grid_y)`

### Table: `webhook_events`
- `id` (uuid, PK)
- `event_type` (text)
- `payload` (jsonb)
- `processed_at` (timestamp)
- `status` (text) - 'pending', 'success', 'error'
- `charge_id` (text, unique) - to ensure idempotency

## API Contracts

### `POST /api/donate/intent`
Initiates a donation process.
**Request**:
```json
{
  "cityId": "uuid",
  "gridX": 5,
  "gridY": 10,
  "buildingType": "Hospital",
  "charityId": "redcross",
  "amount": 100
}
```
**Response**:
```json
{
  "success": true,
  "intentId": "uuid",
  "checkoutUrl": "https://every.org/..."
}
```

### `POST /api/webhooks/every`
Handles Every.org webhooks.
**Payload** (Every.org specific format, typically includes charge id, status, amount, and custom metadata):
```json
{
  "chargeId": "ch_123",
  "status": "succeeded",
  "amount": 100,
  "metadata": {
    "cityId": "uuid",
    "gridX": "5",
    "gridY": "10",
    "buildingType": "Hospital",
    "donorId": "uuid"
  }
}
```

## Real-time Event Payloads (Supabase Realtime)

**Channel**: `city-[cityId]`
**Event**: `building_created`
**Payload**:
```json
{
  "id": "uuid",
  "city_id": "uuid",
  "grid_x": 5,
  "grid_y": 10,
  "building_type": "Hospital",
  "charity_id": "redcross",
  "amount": 100,
  "donor_id": "uuid",
  "created_at": "timestamp"
}
```
