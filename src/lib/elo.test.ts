import { describe, it, expect } from "vitest";
import { calculateEloChange, getKFactor, calculateTableEloChanges } from "./elo";

describe("getKFactor", () => {
  it("returns 32 for new players with less than 30 games", () => {
    expect(getKFactor(0)).toBe(32);
    expect(getKFactor(15)).toBe(32);
    expect(getKFactor(29)).toBe(32);
  });

  it("returns 24 for intermediate players with 30-100 games", () => {
    expect(getKFactor(30)).toBe(24);
    expect(getKFactor(50)).toBe(24);
    expect(getKFactor(100)).toBe(24);
  });

  it("returns 16 for experienced players with more than 100 games", () => {
    expect(getKFactor(101)).toBe(16);
    expect(getKFactor(500)).toBe(16);
  });
});

describe("calculateEloChange", () => {
  it("returns positive change when player wins against equal opponents", () => {
    const change = calculateEloChange({
      playerRating: 1500,
      opponentRatings: [1500, 1500, 1500],
      playerMahjongs: 3,
      opponentMahjongs: [1, 1, 1],
      kFactor: 32,
    });
    expect(change).toBeGreaterThan(0);
  });

  it("returns negative change when player loses against equal opponents", () => {
    const change = calculateEloChange({
      playerRating: 1500,
      opponentRatings: [1500, 1500, 1500],
      playerMahjongs: 0,
      opponentMahjongs: [3, 3, 3],
      kFactor: 32,
    });
    expect(change).toBeLessThan(0);
  });

  it("returns zero total change when player ties against equal opponents", () => {
    const change = calculateEloChange({
      playerRating: 1500,
      opponentRatings: [1500, 1500, 1500],
      playerMahjongs: 2,
      opponentMahjongs: [2, 2, 2],
      kFactor: 32,
    });
    expect(change).toBe(0);
  });

  it("returns less positive change when winning against weaker opponents", () => {
    const changeVsEqual = calculateEloChange({
      playerRating: 1500,
      opponentRatings: [1500, 1500, 1500],
      playerMahjongs: 3,
      opponentMahjongs: [1, 1, 1],
      kFactor: 32,
    });
    const changeVsWeaker = calculateEloChange({
      playerRating: 1500,
      opponentRatings: [1300, 1300, 1300],
      playerMahjongs: 3,
      opponentMahjongs: [1, 1, 1],
      kFactor: 32,
    });
    expect(changeVsWeaker).toBeLessThan(changeVsEqual);
  });

  it("returns more positive change when winning against stronger opponents", () => {
    const changeVsEqual = calculateEloChange({
      playerRating: 1500,
      opponentRatings: [1500, 1500, 1500],
      playerMahjongs: 3,
      opponentMahjongs: [1, 1, 1],
      kFactor: 32,
    });
    const changeVsStronger = calculateEloChange({
      playerRating: 1500,
      opponentRatings: [1700, 1700, 1700],
      playerMahjongs: 3,
      opponentMahjongs: [1, 1, 1],
      kFactor: 32,
    });
    expect(changeVsStronger).toBeGreaterThan(changeVsEqual);
  });

  it("handles mixed results correctly with some wins and some losses", () => {
    const change = calculateEloChange({
      playerRating: 1500,
      opponentRatings: [1500, 1500, 1500],
      playerMahjongs: 2,
      opponentMahjongs: [1, 2, 3],
      kFactor: 32,
    });
    // Beat first opponent, tied second, lost to third
    // Expected: win (1) + tie (0.5) + loss (0)
    // Against equal opponents, expected is 0.5 each = 1.5 total
    // Actual is 1 + 0.5 + 0 = 1.5
    // Net change should be 0
    expect(change).toBe(0);
  });

  it("calculates correct change for clear win scenario", () => {
    // Player at 1500 beats all three 1500-rated opponents
    // Expected per opponent = 0.5, Actual = 1 (win)
    // Change per opponent = K * (1 - 0.5) = 32 * 0.5 = 16
    // Total change = 3 * 16 = 48
    const change = calculateEloChange({
      playerRating: 1500,
      opponentRatings: [1500, 1500, 1500],
      playerMahjongs: 5,
      opponentMahjongs: [2, 1, 0],
      kFactor: 32,
    });
    expect(change).toBe(48);
  });

  it("calculates correct change for clear loss scenario", () => {
    // Player at 1500 loses to all three 1500-rated opponents
    // Expected per opponent = 0.5, Actual = 0 (loss)
    // Change per opponent = K * (0 - 0.5) = 32 * -0.5 = -16
    // Total change = 3 * -16 = -48
    const change = calculateEloChange({
      playerRating: 1500,
      opponentRatings: [1500, 1500, 1500],
      playerMahjongs: 0,
      opponentMahjongs: [5, 3, 1],
      kFactor: 32,
    });
    expect(change).toBe(-48);
  });
});

describe("calculateTableEloChanges", () => {
  it("calculates ELO changes for all players at a table", () => {
    const players = [
      { userId: "player1", rating: 1500, gamesPlayed: 10, mahjongs: 5 },
      { userId: "player2", rating: 1500, gamesPlayed: 50, mahjongs: 3 },
      { userId: "player3", rating: 1500, gamesPlayed: 150, mahjongs: 2 },
      { userId: "player4", rating: 1500, gamesPlayed: 25, mahjongs: 1 },
    ];

    const results = calculateTableEloChanges(players);

    expect(results).toHaveLength(4);

    // Player 1 (5 mahjongs) beat everyone - should have positive change
    expect(results.find((r) => r.userId === "player1")!.eloChange).toBeGreaterThan(0);

    // Player 4 (1 mahjong) lost to everyone - should have negative change
    expect(results.find((r) => r.userId === "player4")!.eloChange).toBeLessThan(0);
  });

  it("returns correct structure with userId, eloBefore, eloAfter, eloChange", () => {
    const players = [
      { userId: "player1", rating: 1500, gamesPlayed: 10, mahjongs: 3 },
      { userId: "player2", rating: 1500, gamesPlayed: 50, mahjongs: 2 },
      { userId: "player3", rating: 1500, gamesPlayed: 150, mahjongs: 1 },
      { userId: "player4", rating: 1500, gamesPlayed: 25, mahjongs: 0 },
    ];

    const results = calculateTableEloChanges(players);

    results.forEach((result) => {
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("eloBefore");
      expect(result).toHaveProperty("eloAfter");
      expect(result).toHaveProperty("eloChange");
      expect(result.eloBefore).toBe(1500);
      expect(result.eloAfter).toBe(result.eloBefore + result.eloChange);
    });
  });

  it("uses correct K-factor based on games played", () => {
    // New player (K=32) vs experienced player (K=16) with same result
    const newPlayer = [
      { userId: "new", rating: 1500, gamesPlayed: 5, mahjongs: 5 },
      { userId: "exp", rating: 1500, gamesPlayed: 200, mahjongs: 0 },
    ];

    const results = calculateTableEloChanges(newPlayer);
    const newPlayerResult = results.find((r) => r.userId === "new")!;
    const expPlayerResult = results.find((r) => r.userId === "exp")!;

    // New player gains more (K=32) than experienced player loses (K=16)
    expect(newPlayerResult.eloChange).toBe(16); // 32 * (1 - 0.5) = 16
    expect(expPlayerResult.eloChange).toBe(-8); // 16 * (0 - 0.5) = -8
  });

  it("handles ties correctly", () => {
    const players = [
      { userId: "player1", rating: 1500, gamesPlayed: 50, mahjongs: 2 },
      { userId: "player2", rating: 1500, gamesPlayed: 50, mahjongs: 2 },
    ];

    const results = calculateTableEloChanges(players);

    // Both players tied with equal ratings, no change
    expect(results[0].eloChange).toBe(0);
    expect(results[1].eloChange).toBe(0);
  });

  it("calculates correctly for 2-player table", () => {
    const players = [
      { userId: "winner", rating: 1500, gamesPlayed: 50, mahjongs: 5 },
      { userId: "loser", rating: 1500, gamesPlayed: 50, mahjongs: 2 },
    ];

    const results = calculateTableEloChanges(players);

    // Winner gains what loser loses (same K-factor for both)
    const winnerChange = results.find((r) => r.userId === "winner")!.eloChange;
    const loserChange = results.find((r) => r.userId === "loser")!.eloChange;

    expect(winnerChange).toBe(12); // 24 * (1 - 0.5) = 12
    expect(loserChange).toBe(-12); // 24 * (0 - 0.5) = -12
  });

  it("handles asymmetric rating changes when K-factors differ", () => {
    // A new player (K=32) beating an experienced player (K=16)
    // The sum of changes won't be zero
    const players = [
      { userId: "new", rating: 1500, gamesPlayed: 10, mahjongs: 3 },
      { userId: "exp", rating: 1500, gamesPlayed: 200, mahjongs: 1 },
    ];

    const results = calculateTableEloChanges(players);
    const newChange = results.find((r) => r.userId === "new")!.eloChange;
    const expChange = results.find((r) => r.userId === "exp")!.eloChange;

    // New player: 32 * (1 - 0.5) = 16
    // Experienced player: 16 * (0 - 0.5) = -8
    expect(newChange).toBe(16);
    expect(expChange).toBe(-8);
    expect(newChange + expChange).not.toBe(0); // Asymmetric
  });
});
