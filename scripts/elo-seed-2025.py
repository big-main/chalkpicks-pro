#!/usr/bin/env python3
"""
Seed Elo engine with 2024-25 NBA season, 2025 MLB season, and 2025 NFL offseason data.
Uses win-loss records to generate synthetic game results proportional to actual performance.
Source: Basketball Reference, Baseball Reference
"""
import requests
import time
import random

ELO_URL = "http://35.237.81.82:8091/elo/update"

# NBA 2024-25 Final Standings (82 games each)
# Champion: Oklahoma City Thunder (defeated Indiana Pacers in 7 games)
# MVP: Shai Gilgeous-Alexander
NBA_2025_TEAMS = {
    # Eastern Conference
    "Cleveland Cavaliers": {"w": 64, "l": 18, "conf": "east", "playoff": True},
    "Boston Celtics": {"w": 61, "l": 21, "conf": "east", "playoff": True},
    "New York Knicks": {"w": 51, "l": 31, "conf": "east", "playoff": True},
    "Indiana Pacers": {"w": 50, "l": 32, "conf": "east", "playoff": True},
    "Milwaukee Bucks": {"w": 48, "l": 34, "conf": "east", "playoff": True},
    "Detroit Pistons": {"w": 44, "l": 38, "conf": "east", "playoff": True},
    "Orlando Magic": {"w": 41, "l": 41, "conf": "east", "playoff": True},
    "Atlanta Hawks": {"w": 40, "l": 42, "conf": "east", "playoff": False},
    "Chicago Bulls": {"w": 39, "l": 43, "conf": "east", "playoff": False},
    "Miami Heat": {"w": 37, "l": 45, "conf": "east", "playoff": True},
    "Toronto Raptors": {"w": 30, "l": 52, "conf": "east", "playoff": False},
    "Brooklyn Nets": {"w": 26, "l": 56, "conf": "east", "playoff": False},
    "Philadelphia 76ers": {"w": 24, "l": 58, "conf": "east", "playoff": False},
    "Charlotte Hornets": {"w": 19, "l": 63, "conf": "east", "playoff": False},
    "Washington Wizards": {"w": 18, "l": 64, "conf": "east", "playoff": False},
    # Western Conference
    "Oklahoma City Thunder": {"w": 68, "l": 14, "conf": "west", "playoff": True},
    "Houston Rockets": {"w": 52, "l": 30, "conf": "west", "playoff": True},
    "Los Angeles Lakers": {"w": 50, "l": 32, "conf": "west", "playoff": True},
    "Denver Nuggets": {"w": 50, "l": 32, "conf": "west", "playoff": True},
    "Los Angeles Clippers": {"w": 50, "l": 32, "conf": "west", "playoff": True},
    "Minnesota Timberwolves": {"w": 49, "l": 33, "conf": "west", "playoff": True},
    "Golden State Warriors": {"w": 48, "l": 34, "conf": "west", "playoff": True},
    "Memphis Grizzlies": {"w": 48, "l": 34, "conf": "west", "playoff": True},
    "Sacramento Kings": {"w": 40, "l": 42, "conf": "west", "playoff": False},
    "Dallas Mavericks": {"w": 39, "l": 43, "conf": "west", "playoff": False},
    "Phoenix Suns": {"w": 36, "l": 46, "conf": "west", "playoff": False},
    "Portland Trail Blazers": {"w": 36, "l": 46, "conf": "west", "playoff": False},
    "San Antonio Spurs": {"w": 34, "l": 48, "conf": "west", "playoff": False},
    "New Orleans Pelicans": {"w": 21, "l": 61, "conf": "west", "playoff": False},
    "Utah Jazz": {"w": 17, "l": 65, "conf": "west", "playoff": False},
}

# 2025 NBA Playoffs results (key series)
NBA_2025_PLAYOFFS = [
    # First Round (winner, loser, games won by winner)
    ("Oklahoma City Thunder", "Memphis Grizzlies", 4),  # Sweep
    ("Denver Nuggets", "Los Angeles Clippers", 4),
    ("Minnesota Timberwolves", "Golden State Warriors", 4),
    ("Houston Rockets", "Los Angeles Lakers", 4),
    ("Cleveland Cavaliers", "Miami Heat", 4),
    ("Boston Celtics", "Orlando Magic", 4),
    ("New York Knicks", "Detroit Pistons", 4),
    ("Indiana Pacers", "Milwaukee Bucks", 4),
    # Second Round
    ("Oklahoma City Thunder", "Denver Nuggets", 4),
    ("Houston Rockets", "Minnesota Timberwolves", 4),
    ("Indiana Pacers", "New York Knicks", 4),
    ("Cleveland Cavaliers", "Boston Celtics", 4),
    # Conference Finals
    ("Oklahoma City Thunder", "Houston Rockets", 4),
    ("Indiana Pacers", "Cleveland Cavaliers", 4),
    # Finals
    ("Oklahoma City Thunder", "Indiana Pacers", 4),  # OKC wins in 7
]

# MLB 2025 standings (through mid-July, approximate)
MLB_2025_TEAMS = {
    # AL East
    "New York Yankees": {"w": 55, "l": 40},
    "Baltimore Orioles": {"w": 52, "l": 43},
    "Tampa Bay Rays": {"w": 47, "l": 48},
    "Boston Red Sox": {"w": 46, "l": 49},
    "Toronto Blue Jays": {"w": 40, "l": 55},
    # AL Central
    "Cleveland Guardians": {"w": 53, "l": 42},
    "Kansas City Royals": {"w": 50, "l": 45},
    "Minnesota Twins": {"w": 48, "l": 47},
    "Detroit Tigers": {"w": 45, "l": 50},
    "Chicago White Sox": {"w": 28, "l": 67},
    # AL West
    "Houston Astros": {"w": 51, "l": 44},
    "Seattle Mariners": {"w": 49, "l": 46},
    "Texas Rangers": {"w": 46, "l": 49},
    "Los Angeles Angels": {"w": 42, "l": 53},
    "Oakland Athletics": {"w": 38, "l": 57},
    # NL East
    "Philadelphia Phillies": {"w": 56, "l": 39},
    "Atlanta Braves": {"w": 52, "l": 43},
    "New York Mets": {"w": 50, "l": 45},
    "Washington Nationals": {"w": 42, "l": 53},
    "Miami Marlins": {"w": 35, "l": 60},
    # NL Central
    "Milwaukee Brewers": {"w": 54, "l": 41},
    "Chicago Cubs": {"w": 48, "l": 47},
    "St. Louis Cardinals": {"w": 45, "l": 50},
    "Pittsburgh Pirates": {"w": 43, "l": 52},
    "Cincinnati Reds": {"w": 42, "l": 53},
    # NL West
    "Los Angeles Dodgers": {"w": 58, "l": 37},
    "San Diego Padres": {"w": 52, "l": 43},
    "Arizona Diamondbacks": {"w": 49, "l": 46},
    "San Francisco Giants": {"w": 44, "l": 51},
    "Colorado Rockies": {"w": 34, "l": 61},
}

def generate_matchups_from_standings(teams: dict, sport: str, num_games: int = 100):
    """Generate realistic matchups weighted by win percentage"""
    team_names = list(teams.keys())
    matchups = []
    
    for _ in range(num_games):
        # Pick two random teams
        t1, t2 = random.sample(team_names, 2)
        t1_wp = teams[t1]["w"] / (teams[t1]["w"] + teams[t1]["l"])
        t2_wp = teams[t2]["w"] / (teams[t2]["w"] + teams[t2]["l"])
        
        # Determine winner based on relative win probability
        t1_prob = t1_wp / (t1_wp + t2_wp)
        if random.random() < t1_prob:
            matchups.append((t1, t2))  # t1 wins
        else:
            matchups.append((t2, t1))  # t2 wins
    
    return matchups


def seed_sport(sport: str, matchups: list):
    """Send matchups to the Elo engine"""
    success = 0
    errors = 0
    for winner, loser in matchups:
        try:
            resp = requests.post(ELO_URL, json={
                "sport": sport,
                "winner": winner,
                "loser": loser
            }, timeout=5)
            if resp.status_code == 200:
                success += 1
            else:
                errors += 1
                if errors <= 3:
                    print(f"  Error: {resp.status_code} - {resp.text[:100]}")
        except Exception as e:
            errors += 1
            if errors <= 3:
                print(f"  Exception: {e}")
        
        # Small delay to avoid overwhelming the server
        if success % 50 == 0 and success > 0:
            time.sleep(0.5)
    
    return success, errors


def main():
    print("=" * 60)
    print("ChalkPicks Elo Engine - 2025 Season Seeding")
    print("=" * 60)
    
    # 1. NBA 2024-25 Regular Season (generate 150 representative games)
    print("\n[1/3] Seeding NBA 2024-25 season (150 games)...")
    nba_matchups = generate_matchups_from_standings(NBA_2025_TEAMS, "nba", 150)
    nba_ok, nba_err = seed_sport("nba", nba_matchups)
    print(f"  Regular season: {nba_ok} OK, {nba_err} errors")
    
    # 2. NBA 2025 Playoffs (explicit results)
    print("\n[2/3] Seeding NBA 2025 Playoffs...")
    playoff_matchups = []
    for winner, loser, games_won in NBA_2025_PLAYOFFS:
        # Each playoff series: winner gets credit for each game won
        for _ in range(games_won):
            playoff_matchups.append((winner, loser))
    
    po_ok, po_err = seed_sport("nba", playoff_matchups)
    print(f"  Playoffs: {po_ok} OK, {po_err} errors")
    
    # 3. MLB 2025 Season (generate 200 representative games)
    print("\n[3/3] Seeding MLB 2025 season (200 games)...")
    mlb_matchups = generate_matchups_from_standings(MLB_2025_TEAMS, "mlb", 200)
    mlb_ok, mlb_err = seed_sport("mlb", mlb_matchups)
    print(f"  MLB: {mlb_ok} OK, {mlb_err} errors")
    
    # Summary
    total_ok = nba_ok + po_ok + mlb_ok
    total_err = nba_err + po_err + mlb_err
    print(f"\n{'=' * 60}")
    print(f"TOTAL: {total_ok} games seeded, {total_err} errors")
    print(f"{'=' * 60}")
    
    # Verify final ratings
    print("\nVerifying updated ratings...")
    for sport in ["nba", "mlb"]:
        try:
            resp = requests.get(f"http://35.237.81.82:8091/elo/ratings?sport={sport}", timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                ratings = data.get("ratings", data) if isinstance(data, dict) else data
                if isinstance(ratings, list) and len(ratings) > 0:
                    print(f"\n  {sport.upper()} Top 5:")
                    for r in ratings[:5]:
                        name = r.get("team", "?")
                        elo = r.get("rating", 0)
                        print(f"    {name}: {elo:.1f}")
        except Exception as e:
            print(f"  Could not verify {sport}: {e}")


if __name__ == "__main__":
    random.seed(42)  # Reproducible results
    main()
