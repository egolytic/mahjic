# Mahjic API Reference

Base URL: `https://api.mahjic.org/v1`

---

## Authentication

Most read endpoints are public. Write endpoints require an API key.

```
Authorization: Bearer {your_api_key}
```

Get your API key at: https://mahjic.org/developers

---

## Players

### Get Player

```
GET /players/{player_id}
```

**Response:**
```json
{
  "id": "mj_abc123",
  "username": "TileQueen",
  "rating": 1587,
  "rd": 45,
  "volatility": 0.06,
  "games_played": 142,
  "provisional": false
}
```

### Get Player Rating History

```
GET /players/{player_id}/history
```

**Query params:**
- `from` — Start date (ISO 8601)
- `to` — End date (ISO 8601)
- `limit` — Max records (default 100)

**Response:**
```json
{
  "player_id": "mj_abc123",
  "history": [
    { "date": "2025-01-20", "rating": 1587, "rd": 45 },
    { "date": "2025-01-15", "rating": 1572, "rd": 48 },
    { "date": "2025-01-10", "rating": 1560, "rd": 52 }
  ]
}
```

### Search Players

```
GET /players/search?q={query}
```

Returns players matching username or display name.


---

## Games

### Submit Game Result (Auth Required)

```
POST /games
```

**Request body:**
```json
{
  "timestamp": "2025-01-20T19:30:00Z",
  "players": [
    { "player_id": "mj_abc123", "position": 1, "score": 50 },
    { "player_id": "mj_def456", "position": 2, "score": 25 },
    { "player_id": "mj_ghi789", "position": 3, "score": 0 },
    { "player_id": "mj_jkl012", "position": 4, "score": -25 }
  ]
}
```

**Notes:**
- `position` is required (1-4)
- `score` is optional (for margin-weighted calculations)
- Players must exist or be created first

**Response:**
```json
{
  "id": "game_xyz789",
  "status": "processed",
  "rating_changes": [
    { "player_id": "mj_abc123", "old_rating": 1572, "new_rating": 1587, "change": 15 },
    { "player_id": "mj_def456", "old_rating": 1610, "new_rating": 1605, "change": -5 },
    { "player_id": "mj_ghi789", "old_rating": 1480, "new_rating": 1475, "change": -5 },
    { "player_id": "mj_jkl012", "old_rating": 1520, "new_rating": 1515, "change": -5 }
  ]
}
```

### Bulk Submit Games (Auth Required)

```
POST /games/bulk
```

Submit up to 100 games in one request. Same format as single game, but in an array.

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
    { "rank": 1, "player_id": "mj_xyz", "username": "MahJestic", "rating": 1892, "games_played": 234 },
    { "rank": 2, "player_id": "mj_abc", "username": "TileQueen", "rating": 1845, "games_played": 187 }
  ],
  "total": 1247
}
```

### Regional Leaderboard

```
GET /leaderboard/{region}
```

Regions: `northeast`, `southeast`, `midwest`, `southwest`, `west`, `international`

### League Leaderboard

```
GET /leagues/{league_id}/leaderboard
```

Returns rankings for players active in a specific league.


---

## Leagues

### List Leagues

```
GET /leagues
```

**Query params:**
- `verified` — Filter to verified leagues only (boolean)
- `region` — Filter by region

### Get League

```
GET /leagues/{league_id}
```

**Response:**
```json
{
  "id": "league_columbus_mj",
  "name": "Columbus Mahjong League",
  "location": "Columbus, GA",
  "region": "southeast",
  "verified": true,
  "games_submitted": 847,
  "active_players": 32,
  "website": "https://example.com",
  "created_at": "2024-06-01"
}
```

### Register League (Auth Required)

```
POST /leagues
```

Requires organizer account.

---

## Embeddable Widgets

### Player Rating Badge

Embed a player's rating on any website:

```html
<iframe 
  src="https://mahjic.org/embed/player/mj_abc123/badge" 
  width="200" 
  height="80" 
  frameborder="0">
</iframe>
```

### Leaderboard Widget

```html
<iframe 
  src="https://mahjic.org/embed/league/league_columbus_mj/leaderboard" 
  width="400" 
  height="500" 
  frameborder="0">
</iframe>
```

### Rating Chart

```html
<iframe 
  src="https://mahjic.org/embed/player/mj_abc123/chart" 
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
| `game.submitted` | New game recorded |
| `rating.updated` | Player rating changed |
| `player.milestone` | Player hit rating milestone (1600, 1700, etc.) |

### Webhook Payload

```json
{
  "event": "rating.updated",
  "timestamp": "2025-01-20T19:35:00Z",
  "data": {
    "player_id": "mj_abc123",
    "old_rating": 1572,
    "new_rating": 1587,
    "game_id": "game_xyz789"
  }
}
```

---

## Rate Limits

- **Public endpoints:** 60 requests/minute
- **Authenticated:** 300 requests/minute
- **Bulk endpoints:** 10 requests/minute

Exceeding limits returns `429 Too Many Requests`.

---

## Errors

Standard HTTP status codes. Error responses include:

```json
{
  "error": {
    "code": "player_not_found",
    "message": "No player exists with ID mj_invalid",
    "status": 404
  }
}
```

---

*Full API documentation: docs.mahjic.org (coming soon)*
