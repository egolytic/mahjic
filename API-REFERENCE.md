# Mahjic API Reference

Base URL: `https://api.mahjic.org/v1`

---

## Authentication

All write endpoints require a Verified Source API key.

```
Authorization: Bearer {your_api_key}
```

Get your API key by becoming a Verified Source at: https://mahjic.org/become-a-source

---

## Sessions (Submit Games)

### Submit Session (Auth Required)

Submit game results for one or more rounds.

```
POST /sessions
```

**Request body:**
```json
{
  "session_date": "2026-01-31",
  "game_type": "league",
  "rounds": [
    {
      "players": [
        { "email": "alice@example.com", "games_played": 4, "mahjongs": 2, "points": 125 },
        { "email": "bob@example.com", "games_played": 4, "mahjongs": 1, "points": 80 },
        { "email": "carol@example.com", "games_played": 4, "mahjongs": 1, "points": 45 },
        { "email": "dave@example.com", "games_played": 4, "mahjongs": 0, "points": -50 }
      ],
      "wall_games": 0
    }
  ]
}
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `session_date` | Yes | ISO date (YYYY-MM-DD) |
| `game_type` | Yes | `social`, `league`, or `tournament` |
| `rounds` | Yes | Array of rounds |
| `rounds[].players` | Yes | 2-4 players |
| `rounds[].players[].email` | Yes | Player email. Prefix with `PRIVATE:` or `ANON:` for privacy modes |
| `rounds[].players[].games_played` | Yes | Number of games in this round |
| `rounds[].players[].mahjongs` | Yes | Games won by this player |
| `rounds[].players[].points` | League/Tournament | Points scored (required for league/tournament) |
| `rounds[].wall_games` | Yes | Games with no winner |

**Privacy prefixes:**
- `alice@example.com` — Normal (public profile)
- `PRIVATE:alice@example.com` — Private mode (rated but hidden from search/leaderboards)
- `ANON:PlayerNick` — Anonymous (local to your source only, no Mahjic ID)

**Validation:**
- `sum(all mahjongs) + wall_games = games_played`
- All players must have same `games_played` value

**Response:**
```json
{
  "session_id": "sess_abc123",
  "results": [
    {
      "mahjic_id": "MJ-001",
      "email": "alice@example.com",
      "is_new_player": false,
      "rating_before": 1600,
      "rating_after": 1618,
      "rating_change": 18,
      "verified_rating_before": 1580,
      "verified_rating_after": 1592,
      "verified_rating_change": 12,
      "games_played_total": 47
    },
    {
      "mahjic_id": "MJ-045",
      "email": "bob@example.com",
      "is_new_player": true,
      "rating_before": 1500,
      "rating_after": 1488,
      "rating_change": -12,
      "verified_rating_before": 1500,
      "verified_rating_after": 1500,
      "verified_rating_change": 0,
      "games_played_total": 1
    }
  ]
}
```

---

## Players

### Get Player

```
GET /players/{mahjic_id}
```

**Response:**
```json
{
  "mahjic_id": "MJ-001",
  "display_name": "Alice",
  "rating": 1618,
  "verified_rating": 1592,
  "games_played": 47,
  "tier": "verified",
  "is_private": false,
  "joined_at": "2025-06-15"
}
```

**Notes:**
- Private players return `404`
- Anonymous players don't have Mahjic IDs

### Get Player Rating History

```
GET /players/{mahjic_id}/history
```

**Query params:**
- `from` — Start date (ISO 8601)
- `to` — End date (ISO 8601)
- `limit` — Max records (default 100)

**Response:**
```json
{
  "mahjic_id": "MJ-001",
  "history": [
    { "date": "2026-01-31", "rating": 1618, "verified_rating": 1592 },
    { "date": "2026-01-24", "rating": 1600, "verified_rating": 1580 },
    { "date": "2026-01-17", "rating": 1585, "verified_rating": 1570 }
  ]
}
```

### Search Players

```
GET /players/search?q={query}
```

Returns players matching display name. Only returns non-private players.

---

## Leaderboards

### Global Leaderboard

```
GET /leaderboard
```

**Query params:**
- `limit` — Number of players (default 50, max 200)
- `offset` — Pagination offset
- `min_games` — Minimum games played (default 10)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "mahjic_id": "MJ-042",
      "display_name": "TileQueen",
      "verified_rating": 1892,
      "games_played": 234
    },
    {
      "rank": 2,
      "mahjic_id": "MJ-001",
      "display_name": "Alice",
      "verified_rating": 1845,
      "games_played": 187
    }
  ],
  "total": 1247
}
```

**Notes:**
- Only Verified players appear on leaderboards
- Ranked by `verified_rating` (games against other Verified players only)

### Regional Leaderboard

```
GET /leaderboard/{region}
```

Regions: `northeast`, `southeast`, `midwest`, `southwest`, `west`, `international`

### Source Leaderboard

```
GET /sources/{source_id}/leaderboard
```

Returns rankings for players who have played at a specific Verified Source.

---

## Verified Sources

### List Sources

```
GET /sources
```

**Query params:**
- `region` — Filter by region

### Get Source

```
GET /sources/{source_id}
```

**Response:**
```json
{
  "source_id": "bam-good-time",
  "name": "BAM Good Time",
  "type": "platform",
  "location": "Columbus, GA",
  "region": "southeast",
  "games_submitted": 1247,
  "active_players": 89,
  "website": "https://bamgoodtime.com",
  "joined_at": "2025-01-01"
}
```

---

## Embeddable Widgets

### Player Rating Badge

Embed a player's rating on any website:

```html
<iframe
  src="https://mahjic.org/embed/player/MJ-001/badge"
  width="200"
  height="80"
  frameborder="0">
</iframe>
```

### Leaderboard Widget

```html
<iframe
  src="https://mahjic.org/embed/source/bam-good-time/leaderboard"
  width="400"
  height="500"
  frameborder="0">
</iframe>
```

### Rating Chart

```html
<iframe
  src="https://mahjic.org/embed/player/MJ-001/chart"
  width="600"
  height="300"
  frameborder="0">
</iframe>
```

---

## Webhooks

Register webhook URLs to receive real-time updates.

### Events

| Event | Description |
|-------|-------------|
| `session.submitted` | New session recorded |
| `rating.updated` | Player rating changed |
| `player.verified` | Player upgraded to Verified tier |

### Webhook Payload

```json
{
  "event": "rating.updated",
  "timestamp": "2026-01-31T19:35:00Z",
  "data": {
    "mahjic_id": "MJ-001",
    "old_rating": 1600,
    "new_rating": 1618,
    "session_id": "sess_abc123"
  }
}
```

---

## Rate Limits

- **Public endpoints:** 60 requests/minute
- **Authenticated:** 300 requests/minute

Exceeding limits returns `429 Too Many Requests`.

---

## Errors

Standard HTTP status codes. Error responses include:

```json
{
  "error": {
    "code": "player_not_found",
    "message": "No player exists with ID MJ-invalid",
    "status": 404
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `invalid_session` | Session data failed validation |
| `player_not_found` | Player ID doesn't exist |
| `source_not_verified` | Your source isn't approved yet |
| `invalid_api_key` | API key is invalid or expired |
| `rate_limit_exceeded` | Too many requests |

---

*Full API documentation: docs.mahjic.org (coming soon)*
