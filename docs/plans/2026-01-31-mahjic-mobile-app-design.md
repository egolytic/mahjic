# Mahjic Mobile App Design

**Date:** January 31, 2026
**Status:** Approved

---

## Overview

A native mobile app for recording Mahjong games with minimal friction. Players connect at the table via QR code (or NFC sticker), enter results, and ratings update instantly.

**Core principle:** The "Game On" screen is 90% of the app. Everything else fades away.

---

## Platform Decision

**React Native with Expo**

- Required for iOS NFC support (web NFC doesn't exist on iOS)
- Expo provides expo-nfc, expo-camera, Expo Push
- Thin client - all ELO calculation and storage on existing mahjic.org API
- Real-time sync via Supabase Realtime

---

## Table Linking

### Primary: QR Code (Day 1)

1. Host taps "Start Table" → generates QR + 6-char code (e.g., `MAH-7X2`)
2. Others tap "Join Table" → scan QR or enter code manually
3. All phones vibrate when connected → "Game On" screen

### Enhanced: NFC Sticker (Upgrade Path)

- $0.20 sticker sits on table with Mahjic logo
- Host starts table → session linked to sticker ID
- Others tap sticker → instant join
- Sticker URL: `mahjic.org/t/STICKER_ID`

Both methods land on the same "Game On" screen.

---

## Scoring Flow

### Enter Result

1. Tap "Enter Result"
2. Pick winner (tap their face) OR tap "Wall Game"
3. Optional: tap line number on visual NMJL card
4. Submit

### Confirmation

- Other players receive push notification
- Options: ✓ Confirm | ✗ Dispute | ⏭ Skip
- **2 of 3 confirms** → recorded, ratings update
- **Dispute** → flagged for review but still recorded provisionally
- **30 sec timeout** → whoever voted wins

### Feedback

All phones flash rating change: "+8" green, "-3" red.

---

## Player Scenarios

### Minimum Requirements

- 2 phones minimum at table
- 4 phones: standard 2 of 3 confirmation
- 3 phones + 1 proxy: standard 2 of 3
- 2 phones + 2 proxies: both must confirm (2 of 2)
- 1 phone: not allowed (no confirmation possible)

### Proxy Players

For players without phones:

1. **Add by Email** - Creates provisional Mahjic ID, they claim later
2. **Add Guest** - Name only, no rating saved

Proxy owner manages their seat and enters results for them.

### Claiming Provisional IDs

After session, proxy receives email with claim link to mahjic.org/claim/[token] (existing flow).

---

## Session Model

- **Open-ended** - Start when ready, end when done
- No round tracking or timers
- Players know how many games to play based on context

---

## Mahjic ID & Verification

### Unverified (Free)

- Can play and build rating
- Do NOT appear on public leaderboards
- Gray "M" badge

### Verified ($20/year)

- Appear on mahjic.org/leaderboard
- Blue checkmark badge
- Stripe Identity verification (already built)
- Government ID + selfie matching

---

## UI Screens

### Home (Logged In)

```
┌─────────────────────────┐
│    [Your Rating: 1247]  │
│         ✓ Verified      │
│                         │
│  ┌───────────────────┐  │
│  │   START TABLE     │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │    JOIN TABLE     │  │
│  └───────────────────┘  │
│                         │
│  Club: Columbus Mahj ▸  │
└─────────────────────────┘
```

### Game On (Primary Screen)

```
┌─────────────────────────┐
│  Session: 47min  •  End │
├─────────────────────────┤
│   [Amy]      [Bob]      │
│   1198 +4    1302 -2    │
│                         │
│   [You]      [Carol]    │
│   1247 +8    1156 -10   │
├─────────────────────────┤
│     [ ENTER RESULT ]    │
└─────────────────────────┘
```

---

## Admin View (Bam Good Time Only)

**Who sees this:** Only club admins who have set up a club on bamgoodtime.com. Regular Mahjic users never see admin features.

**Where it lives:** In the Bam Good Time admin dashboard (bamgoodtime.com), NOT in the Mahjic mobile app. The app is player-focused only.

### Table Arrangement Tool

- Auto-arrange by rating (balanced tables)
- Snake draft option
- Shuffle for casual
- Drag & drop manual override
- Pulls player ratings from Mahjic API

### Live Tournament View

- Real-time scores from all tables
- Running leaderboard
- Data pulled from Mahjic API

### Access Control

- Must be authenticated as club admin on bamgoodtime.com
- Only sees players who are members of their club or checked into their event
- Cannot see or modify other clubs' data

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo (React Native) |
| State | Zustand |
| Real-time | Supabase Realtime |
| NFC | expo-nfc |
| QR/Camera | expo-camera, expo-barcode-scanner |
| Push | Expo Push Notifications |
| API | mahjic.org/api/v1 (existing) |

---

## Offline Handling

- Games stored locally first
- Sync when back online
- Can play in airplane mode
- Ratings update on reconnect

---

## Implementation Order

1. **Expo project setup** - Scaffold app, auth flow
2. **QR linking** - Start/join table flow
3. **Game On screen** - Core gameplay loop
4. **Scoring + confirmation** - Push notifications
5. **Proxy players** - Add by email/guest
6. **NFC sticker support** - Enhanced linking
7. **Admin dashboard integration** - Bam Good Time seating tool

---

## Open Questions (Resolved)

- ~~Platform?~~ → Native (Expo) for NFC
- ~~Linking method?~~ → QR primary, NFC sticker upgrade
- ~~Confirmation model?~~ → 2 of 3 majority + dispute flag
- ~~Session model?~~ → Open-ended

---

## Related Documents

- `/Users/sterlinglcannon/Desktop/Mahjic_App/mahjic_app_concept.md`
- `/Users/sterlinglcannon/Desktop/Mahjic_App/bam_good_time_master_plan.md`
- `/Users/sterlinglcannon/Desktop/Mahjic/src/lib/elo.ts` (existing ELO algorithm)
- `/Users/sterlinglcannon/Desktop/Mahjic/src/lib/stripe.ts` (existing verification)
