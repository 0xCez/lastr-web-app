#!/usr/bin/env python3
"""
Download NBA headshots for players returned by api-sports.io
Uses only built-in modules (no pip install needed)
"""

import os
import re
import time
import json
import urllib.request

API_SPORTS_KEY = "77fea40da4ce95b70120be298555b660"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "nba-players")
NBA_CDN_URL = "https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"

NBA_TEAMS = [
    {"id": 1, "code": "atl"},
    {"id": 2, "code": "bos"},
    {"id": 4, "code": "bkn"},
    {"id": 5, "code": "cha"},
    {"id": 6, "code": "chi"},
    {"id": 7, "code": "cle"},
    {"id": 8, "code": "dal"},
    {"id": 9, "code": "den"},
    {"id": 10, "code": "det"},
    {"id": 11, "code": "gsw"},
    {"id": 14, "code": "hou"},
    {"id": 15, "code": "ind"},
    {"id": 16, "code": "lac"},
    {"id": 17, "code": "lal"},
    {"id": 19, "code": "mem"},
    {"id": 20, "code": "mia"},
    {"id": 21, "code": "mil"},
    {"id": 22, "code": "min"},
    {"id": 23, "code": "nop"},
    {"id": 24, "code": "nyk"},
    {"id": 25, "code": "okc"},
    {"id": 26, "code": "orl"},
    {"id": 27, "code": "phi"},
    {"id": 28, "code": "phx"},
    {"id": 29, "code": "por"},
    {"id": 30, "code": "sac"},
    {"id": 31, "code": "sas"},
    {"id": 38, "code": "tor"},
    {"id": 40, "code": "uta"},
    {"id": 41, "code": "was"},
]

def sanitize_name(name):
    return re.sub(r'[^a-z0-9]', '_', name.lower())

def get_team_players(team_id):
    url = f"https://v2.nba.api-sports.io/players/statistics?season=2024&team={team_id}"
    req = urllib.request.Request(url, headers={
        "x-rapidapi-key": API_SPORTS_KEY,
        "x-rapidapi-host": "v2.nba.api-sports.io"
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        if not data.get("response"):
            return []
        seen = set()
        players = []
        for game in data["response"]:
            player = game.get("player", {})
            pid = player.get("id")
            if pid and pid not in seen:
                seen.add(pid)
                name = f"{player.get('firstname', '')} {player.get('lastname', '')}".strip()
                players.append({"id": pid, "name": name})
        return players
    except Exception as e:
        print(f"  Error fetching team {team_id}: {e}")
        return []

def download_image(player_id, filepath):
    url = NBA_CDN_URL.format(player_id=player_id)
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            with open(filepath, "wb") as f:
                f.write(resp.read())
        return True
    except:
        return False

def main():
    print("=" * 60)
    print("API-Sports NBA Headshot Downloader")
    print("=" * 60)

    total_downloaded = 0
    total_skipped = 0
    total_failed = 0

    for team in NBA_TEAMS:
        team_id = team["id"]
        team_code = team["code"]
        team_dir = os.path.join(OUTPUT_DIR, team_code)
        os.makedirs(team_dir, exist_ok=True)

        print(f"\n{team_code.upper()} (ID: {team_id})")

        players = get_team_players(team_id)
        if not players:
            print("  No players found")
            continue

        time.sleep(0.5)

        for player in players[:20]:
            filename = f"{sanitize_name(player['name'])}.png"
            filepath = os.path.join(team_dir, filename)

            if os.path.exists(filepath):
                total_skipped += 1
                continue

            if download_image(player["id"], filepath):
                print(f"  + {player['name']}")
                total_downloaded += 1
            else:
                print(f"  - {player['name']} (failed)")
                total_failed += 1

            time.sleep(0.3)

    print("\n" + "=" * 60)
    print(f"Downloaded: {total_downloaded}")
    print(f"Skipped (existed): {total_skipped}")
    print(f"Failed: {total_failed}")

if __name__ == "__main__":
    main()
