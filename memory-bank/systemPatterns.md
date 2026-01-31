# System Patterns - CRITICAL KNOWLEDGE

**This file contains patterns learned the hard way. READ THIS FIRST.**

---

## PROJECT STATUS

This project is currently in **DESIGN PHASE** - no code has been written yet. The patterns below are from the design spec and lessons learned from BAM Good Time.

---

## MAHJONG GAME LOGIC

### Game Outcomes
Each game has exactly ONE outcome:
- One player mahjongs (wins), OR
- Wall game (nobody wins - pot exhausted)

### Validation Rule
```
sum(all players' mahjongs) + wall_games = games_played
```

**Example:** 6 games played
- Alice: 2 mahjongs
- Bob: 2 mahjongs
- Carol: 1 mahjong
- Dave: 0 mahjongs
- Wall games: 1
- Total: 2 + 2 + 1 + 0 + 1 = 6 ✓

### Round Definition
A "round" = same people playing X games together. NOT individual games.

League night example:
- Round 1: Alice, Bob, Carol, Dave play 4 games → compare, calculate ELO
- Round 2: Alice, Eve, Frank, George play 4 games → compare, calculate ELO

---

## PRIVACY EMAIL PREFIXES

When submitting player emails:

| Prefix | Example | Effect |
|--------|---------|--------|
| (none) | `alice@ex.com` | Normal - public profile |
| `PRIVATE:` | `PRIVATE:alice@ex.com` | Rated but hidden from search/leaderboards |
| `ANON:` | `ANON:PlayerNick` | Local only, no Mahjic ID, no email stored |

---

## TWO RATING SYSTEM

**Problem:** Someone could create fake provisional accounts and farm rating.

**Solution:** Two separate ratings:

| Rating | Games Counted | Purpose |
|--------|---------------|---------|
| Mahjic Rating | All games | Personal tracking |
| Verified Rating | Only vs Verified players | Leaderboards |

Leaderboard only shows Verified Rating, which only includes games against ID-verified players.

---

## VERIFIED SOURCE TRUST MODEL

- Only Verified Sources can submit games
- Games without a Verified Source don't count
- This is the trust layer that makes ratings credible
- Manual review for now, Claude agent later

---

## ELO CALCULATION PATTERNS (from BAM Good Time)

### Pairwise Comparison
Each player compared against each tablemate (not just positions):
- 4 players = 6 pairwise comparisons
- 3 players = 3 pairwise comparisons
- 2 players = 1 pairwise comparison

### Win Rate, Not Raw Mahjongs
```
Win rate = mahjongs / games_played
```
This handles variable game counts (some tables play 4 games, others play 8).

### K-Factor Based on Experience
New players' ratings move faster, experienced players are more stable.

### Points Bonus is Secondary
Points bonus (±5 cap) is added ON TOP of win-rate ELO, not replacing it.

---

## LESSONS FROM BAM GOOD TIME

### Environment Variables
If deploying to Vercel, use `printf '%s'` not `echo` to avoid trailing newlines.

### Auth Cookies
If cross-subdomain auth needed, set cookies with `domain=.mahjic.org`.

### RLS Policies
Use SECURITY DEFINER functions for admin checks to avoid infinite recursion.

### Date Handling
Parse dates with timezone safety - `new Date("2026-01-26")` can show wrong day.

---

## API DESIGN PATTERNS

### Session Submission Response
Return BOTH old and new ratings so the source can display changes:
```json
{
  "results": [
    {
      "mahjic_id": "MJ-001",
      "rating_before": 1600,
      "rating_after": 1618,
      "rating_change": 18,
      "verified_rating_before": 1580,
      "verified_rating_after": 1592,
      "verified_rating_change": 12
    }
  ]
}
```

### Player Creation on Submission
If email doesn't exist, create Provisional player automatically. Don't require pre-registration.

### Idempotency
Consider adding session deduplication to prevent double-submission of the same games.

---

## FUTURE CONSIDERATIONS

### NFC App
When building the mobile NFC app:
- Need to handle offline capability
- Sync when back online
- Conflict resolution if same game submitted multiple ways
