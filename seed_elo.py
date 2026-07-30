#!/usr/bin/env python3
"""Seed Elo engine with 2024 season results for NFL, NBA, MLB"""
import requests
import json
import time

ELO_URL = "http://localhost:8091/elo/update"

# NFL 2024 season results (key games, weeks 1-18 + playoffs)
NFL_2024 = [
    # Week 1
    ("Kansas City Chiefs", "Baltimore Ravens"),
    ("Philadelphia Eagles", "Green Bay Packers"),
    ("Buffalo Bills", "Arizona Cardinals"),
    ("Detroit Lions", "Los Angeles Rams"),
    ("Minnesota Vikings", "New York Giants"),
    ("Pittsburgh Steelers", "Atlanta Falcons"),
    ("Miami Dolphins", "Jacksonville Jaguars"),
    ("Cincinnati Bengals", "New England Patriots"),
    ("Houston Texans", "Indianapolis Colts"),
    ("Chicago Bears", "Tennessee Titans"),
    ("San Francisco 49ers", "New York Jets"),
    ("Seattle Seahawks", "Denver Broncos"),
    ("Dallas Cowboys", "Cleveland Browns"),
    ("Tampa Bay Buccaneers", "Washington Commanders"),
    # Week 2
    ("Buffalo Bills", "Miami Dolphins"),
    ("Minnesota Vikings", "San Francisco 49ers"),
    ("Detroit Lions", "Tampa Bay Buccaneers"),
    ("Green Bay Packers", "Indianapolis Colts"),
    ("Los Angeles Chargers", "Carolina Panthers"),
    ("Pittsburgh Steelers", "Denver Broncos"),
    ("New York Jets", "Tennessee Titans"),
    ("Kansas City Chiefs", "Cincinnati Bengals"),
    ("Washington Commanders", "New York Giants"),
    ("Baltimore Ravens", "Las Vegas Raiders"),
    ("Seattle Seahawks", "New England Patriots"),
    ("Arizona Cardinals", "Los Angeles Rams"),
    # Week 3-5 key games
    ("Minnesota Vikings", "Houston Texans"),
    ("Detroit Lions", "Arizona Cardinals"),
    ("Buffalo Bills", "Jacksonville Jaguars"),
    ("Kansas City Chiefs", "Atlanta Falcons"),
    ("Philadelphia Eagles", "New Orleans Saints"),
    ("Baltimore Ravens", "Dallas Cowboys"),
    ("Green Bay Packers", "Tennessee Titans"),
    ("Washington Commanders", "Cincinnati Bengals"),
    ("Minnesota Vikings", "Green Bay Packers"),
    ("Detroit Lions", "Seattle Seahawks"),
    ("Buffalo Bills", "Houston Texans"),
    ("Kansas City Chiefs", "New Orleans Saints"),
    # Weeks 6-10
    ("Detroit Lions", "Dallas Cowboys"),
    ("Minnesota Vikings", "New York Jets"),
    ("Buffalo Bills", "New York Jets"),
    ("Kansas City Chiefs", "San Francisco 49ers"),
    ("Philadelphia Eagles", "Cleveland Browns"),
    ("Baltimore Ravens", "Tampa Bay Buccaneers"),
    ("Green Bay Packers", "Houston Texans"),
    ("Washington Commanders", "Carolina Panthers"),
    ("Detroit Lions", "Green Bay Packers"),
    ("Minnesota Vikings", "Indianapolis Colts"),
    ("Buffalo Bills", "Miami Dolphins"),
    ("Kansas City Chiefs", "Tampa Bay Buccaneers"),
    ("Philadelphia Eagles", "Jacksonville Jaguars"),
    ("Baltimore Ravens", "Denver Broncos"),
    # Weeks 11-14
    ("Detroit Lions", "Jacksonville Jaguars"),
    ("Minnesota Vikings", "Tennessee Titans"),
    ("Buffalo Bills", "Kansas City Chiefs"),
    ("Philadelphia Eagles", "Washington Commanders"),
    ("Baltimore Ravens", "Pittsburgh Steelers"),
    ("Green Bay Packers", "San Francisco 49ers"),
    ("Detroit Lions", "Indianapolis Colts"),
    ("Minnesota Vikings", "Chicago Bears"),
    ("Buffalo Bills", "San Francisco 49ers"),
    ("Philadelphia Eagles", "Los Angeles Rams"),
    ("Kansas City Chiefs", "Las Vegas Raiders"),
    ("Baltimore Ravens", "Philadelphia Eagles"),
    # Weeks 15-18
    ("Detroit Lions", "Buffalo Bills"),
    ("Minnesota Vikings", "Seattle Seahawks"),
    ("Kansas City Chiefs", "Houston Texans"),
    ("Philadelphia Eagles", "Pittsburgh Steelers"),
    ("Green Bay Packers", "New Orleans Saints"),
    ("Baltimore Ravens", "New York Giants"),
    ("Washington Commanders", "Philadelphia Eagles"),
    ("Detroit Lions", "Chicago Bears"),
    ("Minnesota Vikings", "Detroit Lions"),
    ("Buffalo Bills", "New England Patriots"),
    ("Kansas City Chiefs", "Pittsburgh Steelers"),
    ("Green Bay Packers", "Minnesota Vikings"),
    # Playoffs
    ("Buffalo Bills", "Denver Broncos"),
    ("Philadelphia Eagles", "Green Bay Packers"),
    ("Baltimore Ravens", "Pittsburgh Steelers"),
    ("Houston Texans", "Los Angeles Chargers"),
    ("Detroit Lions", "Washington Commanders"),
    ("Kansas City Chiefs", "Houston Texans"),
    ("Philadelphia Eagles", "Los Angeles Rams"),
    ("Buffalo Bills", "Baltimore Ravens"),
    ("Kansas City Chiefs", "Buffalo Bills"),
    ("Philadelphia Eagles", "Washington Commanders"),
    # Super Bowl
    ("Philadelphia Eagles", "Kansas City Chiefs"),
]

# NBA 2024-25 season results (key games through playoffs)
NBA_2024 = [
    # Regular season key matchups
    ("Boston Celtics", "New York Knicks"),
    ("Oklahoma City Thunder", "Denver Nuggets"),
    ("Cleveland Cavaliers", "Orlando Magic"),
    ("Houston Rockets", "Memphis Grizzlies"),
    ("Golden State Warriors", "Los Angeles Lakers"),
    ("Dallas Mavericks", "Phoenix Suns"),
    ("Milwaukee Bucks", "Indiana Pacers"),
    ("Minnesota Timberwolves", "Sacramento Kings"),
    ("Boston Celtics", "Philadelphia 76ers"),
    ("Oklahoma City Thunder", "Los Angeles Clippers"),
    ("Cleveland Cavaliers", "Milwaukee Bucks"),
    ("Houston Rockets", "San Antonio Spurs"),
    ("Denver Nuggets", "Minnesota Timberwolves"),
    ("Dallas Mavericks", "Los Angeles Lakers"),
    ("Golden State Warriors", "Phoenix Suns"),
    ("New York Knicks", "Brooklyn Nets"),
    ("Boston Celtics", "Cleveland Cavaliers"),
    ("Oklahoma City Thunder", "Houston Rockets"),
    ("Denver Nuggets", "Dallas Mavericks"),
    ("Milwaukee Bucks", "Boston Celtics"),
    ("Minnesota Timberwolves", "Golden State Warriors"),
    ("New York Knicks", "Philadelphia 76ers"),
    ("Cleveland Cavaliers", "Indiana Pacers"),
    ("Houston Rockets", "Oklahoma City Thunder"),
    # Playoffs
    ("Oklahoma City Thunder", "Denver Nuggets"),
    ("Boston Celtics", "Orlando Magic"),
    ("Cleveland Cavaliers", "Milwaukee Bucks"),
    ("New York Knicks", "Detroit Pistons"),
    ("Houston Rockets", "Golden State Warriors"),
    ("Dallas Mavericks", "Memphis Grizzlies"),
    ("Minnesota Timberwolves", "Los Angeles Lakers"),
    ("Oklahoma City Thunder", "Dallas Mavericks"),
    ("Boston Celtics", "New York Knicks"),
    ("Cleveland Cavaliers", "Indiana Pacers"),
    ("Houston Rockets", "Minnesota Timberwolves"),
    ("Oklahoma City Thunder", "Houston Rockets"),
    ("Boston Celtics", "Cleveland Cavaliers"),
    # Finals
    ("Oklahoma City Thunder", "Boston Celtics"),
]

# MLB 2024 season results (key games)
MLB_2024 = [
    ("Los Angeles Dodgers", "San Diego Padres"),
    ("Philadelphia Phillies", "Atlanta Braves"),
    ("New York Yankees", "Baltimore Orioles"),
    ("Milwaukee Brewers", "Chicago Cubs"),
    ("Cleveland Guardians", "Minnesota Twins"),
    ("Houston Astros", "Seattle Mariners"),
    ("Los Angeles Dodgers", "San Francisco Giants"),
    ("Philadelphia Phillies", "New York Mets"),
    ("New York Yankees", "Boston Red Sox"),
    ("Milwaukee Brewers", "St. Louis Cardinals"),
    ("Cleveland Guardians", "Detroit Tigers"),
    ("Houston Astros", "Texas Rangers"),
    ("Los Angeles Dodgers", "Arizona Diamondbacks"),
    ("Philadelphia Phillies", "Miami Marlins"),
    ("New York Yankees", "Toronto Blue Jays"),
    ("Atlanta Braves", "Chicago Cubs"),
    ("Baltimore Orioles", "Tampa Bay Rays"),
    ("San Diego Padres", "San Francisco Giants"),
    # Playoffs
    ("Los Angeles Dodgers", "San Diego Padres"),
    ("New York Yankees", "Kansas City Royals"),
    ("Cleveland Guardians", "Detroit Tigers"),
    ("Philadelphia Phillies", "New York Mets"),
    ("New York Mets", "Philadelphia Phillies"),
    ("Los Angeles Dodgers", "New York Mets"),
    ("New York Yankees", "Cleveland Guardians"),
    # World Series
    ("Los Angeles Dodgers", "New York Yankees"),
]

def seed_sport(sport, games):
    success = 0
    failed = 0
    for winner, loser in games:
        try:
            resp = requests.post(ELO_URL, json={
                "sport": sport,
                "winner": winner,
                "loser": loser
            }, timeout=5)
            if resp.status_code == 200:
                success += 1
            else:
                failed += 1
        except Exception as e:
            failed += 1
    return success, failed

print("Seeding Elo engine with 2024 historical data...")
print(f"\n--- NFL 2024 ({len(NFL_2024)} games) ---")
s, f = seed_sport("nfl", NFL_2024)
print(f"  Success: {s}, Failed: {f}")

print(f"\n--- NBA 2024-25 ({len(NBA_2024)} games) ---")
s, f = seed_sport("nba", NBA_2024)
print(f"  Success: {s}, Failed: {f}")

print(f"\n--- MLB 2024 ({len(MLB_2024)} games) ---")
s, f = seed_sport("mlb", MLB_2024)
print(f"  Success: {s}, Failed: {f}")

# Print final ratings
print("\n--- Final Elo Ratings ---")
for sport in ["nfl", "nba", "mlb"]:
    resp = requests.get(f"http://localhost:8091/elo/ratings?sport={sport}")
    data = resp.json()
    print(f"\n{sport.upper()} Top 5:")
    for team in data["ratings"][:5]:
        print(f"  {team['team']}: {team['rating']}")

print("\nDone!")
