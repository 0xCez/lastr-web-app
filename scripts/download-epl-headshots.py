#!/usr/bin/env python3
"""
Download EPL (Premier League) player headshots from api-sports.io
Uses only built-in modules (no pip install needed)
"""

import os
import re
import time
import json
import urllib.request

API_SPORTS_KEY = "77fea40da4ce95b70120be298555b660"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "epl-players")

# All 20 EPL teams with their api-sports.io IDs and codes
EPL_TEAMS = [
    {"id": 42, "code": "arsenal", "name": "Arsenal"},
    {"id": 66, "code": "aston_villa", "name": "Aston Villa"},
    {"id": 35, "code": "bournemouth", "name": "AFC Bournemouth"},
    {"id": 51, "code": "brighton", "name": "Brighton"},
    {"id": 49, "code": "chelsea", "name": "Chelsea"},
    {"id": 52, "code": "crystal_palace", "name": "Crystal Palace"},
    {"id": 45, "code": "everton", "name": "Everton"},
    {"id": 36, "code": "fulham", "name": "Fulham"},
    {"id": 57, "code": "ipswich", "name": "Ipswich Town"},
    {"id": 46, "code": "leicester", "name": "Leicester City"},
    {"id": 40, "code": "liverpool", "name": "Liverpool"},
    {"id": 50, "code": "manchester_city", "name": "Manchester City"},
    {"id": 33, "code": "manchester_united", "name": "Manchester United"},
    {"id": 34, "code": "newcastle", "name": "Newcastle"},
    {"id": 65, "code": "nottingham_forest", "name": "Nottingham Forest"},
    {"id": 41, "code": "southampton", "name": "Southampton"},
    {"id": 47, "code": "tottenham", "name": "Tottenham"},
    {"id": 48, "code": "west_ham", "name": "West Ham"},
    {"id": 39, "code": "wolves", "name": "Wolverhampton"},
    {"id": 55, "code": "brentford", "name": "Brentford"},
]

# Current EPL season
SEASON = 2024

def sanitize_name(name):
    """Convert player name to safe filename."""
    return re.sub(r'[^a-z0-9]', '_', name.lower())

def get_team_squad(team_id):
    """Fetch squad/players for a team from api-sports.io football API."""
    url = f"https://v3.football.api-sports.io/players/squads?team={team_id}"
    req = urllib.request.Request(url, headers={
        "x-rapidapi-key": API_SPORTS_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io"
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        if not data.get("response") or len(data["response"]) == 0:
            return []
        # Squad endpoint returns team info with players array
        team_data = data["response"][0]
        players = team_data.get("players", [])
        result = []
        for player in players:
            result.append({
                "id": player.get("id"),
                "name": player.get("name"),
                "photo": player.get("photo")  # Direct photo URL from api-sports
            })
        return result
    except Exception as e:
        print(f"  Error fetching squad for team {team_id}: {e}")
        return []

def download_image(url, filepath):
    """Download image from URL to filepath."""
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            with open(filepath, "wb") as f:
                f.write(resp.read())
        return True
    except Exception as e:
        print(f"    Download error: {e}")
        return False

def main():
    print("=" * 60)
    print("EPL Player Headshot Downloader")
    print("=" * 60)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Season: {SEASON}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    total_downloaded = 0
    total_skipped = 0
    total_failed = 0

    for team in EPL_TEAMS:
        team_id = team["id"]
        team_code = team["code"]
        team_name = team["name"]
        team_dir = os.path.join(OUTPUT_DIR, team_code)
        os.makedirs(team_dir, exist_ok=True)

        print(f"\n{team_name} ({team_code})")
        print("-" * 40)

        players = get_team_squad(team_id)
        if not players:
            print("  No players found")
            continue

        print(f"  Found {len(players)} players")
        time.sleep(0.5)  # Rate limiting between teams

        for player in players:
            if not player.get("photo") or not player.get("name"):
                continue

            filename = f"{sanitize_name(player['name'])}.png"
            filepath = os.path.join(team_dir, filename)

            if os.path.exists(filepath):
                total_skipped += 1
                continue

            photo_url = player["photo"]
            # api-sports returns URLs like https://media.api-sports.io/football/players/123.png

            if download_image(photo_url, filepath):
                print(f"  + {player['name']}")
                total_downloaded += 1
            else:
                print(f"  - {player['name']} (failed)")
                total_failed += 1

            time.sleep(0.2)  # Rate limiting between downloads

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Downloaded: {total_downloaded}")
    print(f"Skipped (already existed): {total_skipped}")
    print(f"Failed: {total_failed}")
    print(f"\nImages saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
