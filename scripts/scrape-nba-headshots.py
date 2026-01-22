#!/usr/bin/env python3
"""
NBA Player Headshot Scraper
Downloads headshots from NBA CDN for all teams and their top players.
Uses nba_api to get player IDs, then downloads from cdn.nba.com
"""

import os
import time
import requests
from pathlib import Path

# Install nba_api if not present
try:
    from nba_api.stats.static import teams, players
    from nba_api.stats.endpoints import commonteamroster
except ImportError:
    print("Installing nba_api...")
    os.system("pip3 install nba_api")
    from nba_api.stats.static import teams, players
    from nba_api.stats.endpoints import commonteamroster

# Configuration
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "images" / "nba-players"
NBA_CDN_URL = "https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"
PLAYERS_PER_TEAM = 20  # Top 20 players per team
REQUEST_DELAY = 0.5  # Seconds between requests to avoid rate limiting

# NBA team codes mapping (for folder names)
TEAM_CODES = {
    "Atlanta Hawks": "atl",
    "Boston Celtics": "bos",
    "Brooklyn Nets": "bkn",
    "Charlotte Hornets": "cha",
    "Chicago Bulls": "chi",
    "Cleveland Cavaliers": "cle",
    "Dallas Mavericks": "dal",
    "Denver Nuggets": "den",
    "Detroit Pistons": "det",
    "Golden State Warriors": "gsw",
    "Houston Rockets": "hou",
    "Indiana Pacers": "ind",
    "LA Clippers": "lac",
    "Los Angeles Lakers": "lal",
    "Memphis Grizzlies": "mem",
    "Miami Heat": "mia",
    "Milwaukee Bucks": "mil",
    "Minnesota Timberwolves": "min",
    "New Orleans Pelicans": "nop",
    "New York Knicks": "nyk",
    "Oklahoma City Thunder": "okc",
    "Orlando Magic": "orl",
    "Philadelphia 76ers": "phi",
    "Phoenix Suns": "phx",
    "Portland Trail Blazers": "por",
    "Sacramento Kings": "sac",
    "San Antonio Spurs": "sas",
    "Toronto Raptors": "tor",
    "Utah Jazz": "uta",
    "Washington Wizards": "was",
}


def sanitize_filename(name: str) -> str:
    """Convert player name to safe filename.
    Must match edge function: playerName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    """
    import re
    return re.sub(r'[^a-z0-9]', '_', name.lower())


def download_image(url: str, filepath: Path) -> bool:
    """Download image from URL to filepath."""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            filepath.write_bytes(response.content)
            return True
        else:
            return False
    except Exception as e:
        print(f"  Error downloading: {e}")
        return False


def get_team_roster(team_id: int) -> list:
    """Get roster for a team using nba_api."""
    try:
        roster = commonteamroster.CommonTeamRoster(team_id=team_id)
        df = roster.get_data_frames()[0]
        # Return list of (player_id, player_name) tuples
        return [(row["PLAYER_ID"], row["PLAYER"]) for _, row in df.iterrows()]
    except Exception as e:
        print(f"  Error getting roster: {e}")
        return []


def scrape_team(team_name: str, team_id: int) -> dict:
    """Scrape headshots for a single team."""
    team_code = TEAM_CODES.get(team_name, team_name.lower().replace(" ", "_"))
    team_dir = OUTPUT_DIR / team_code
    team_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*50}")
    print(f"Team: {team_name} ({team_code})")
    print(f"{'='*50}")

    # Get roster
    roster = get_team_roster(team_id)
    if not roster:
        print(f"  Could not get roster for {team_name}")
        return {"team": team_name, "success": 0, "failed": 0, "skipped": 0}

    # Limit to top N players
    roster = roster[:PLAYERS_PER_TEAM]

    stats = {"team": team_name, "success": 0, "failed": 0, "skipped": 0}

    for player_id, player_name in roster:
        filename = f"{sanitize_filename(player_name)}.png"
        filepath = team_dir / filename

        # Skip if already downloaded
        if filepath.exists():
            print(f"  [SKIP] {player_name} - already exists")
            stats["skipped"] += 1
            continue

        # Download from NBA CDN
        url = NBA_CDN_URL.format(player_id=player_id)
        print(f"  Downloading {player_name} (ID: {player_id})...", end=" ")

        if download_image(url, filepath):
            print("OK")
            stats["success"] += 1
        else:
            print("FAILED")
            stats["failed"] += 1

        time.sleep(REQUEST_DELAY)

    return stats


def main():
    """Main entry point."""
    print("=" * 60)
    print("NBA Player Headshot Scraper")
    print("=" * 60)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Players per team: {PLAYERS_PER_TEAM}")
    print(f"Request delay: {REQUEST_DELAY}s")

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Get all NBA teams
    nba_teams = teams.get_teams()
    print(f"\nFound {len(nba_teams)} NBA teams")

    # Track overall stats
    total_stats = {"success": 0, "failed": 0, "skipped": 0}
    team_results = []

    for team in nba_teams:
        team_name = team["full_name"]
        team_id = team["id"]

        stats = scrape_team(team_name, team_id)
        team_results.append(stats)

        total_stats["success"] += stats["success"]
        total_stats["failed"] += stats["failed"]
        total_stats["skipped"] += stats["skipped"]

        # Small delay between teams
        time.sleep(1)

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total downloaded: {total_stats['success']}")
    print(f"Total failed: {total_stats['failed']}")
    print(f"Total skipped (already existed): {total_stats['skipped']}")
    print(f"\nImages saved to: {OUTPUT_DIR}")

    # Print any teams with failures
    failed_teams = [r for r in team_results if r["failed"] > 0]
    if failed_teams:
        print("\nTeams with failures:")
        for t in failed_teams:
            print(f"  - {t['team']}: {t['failed']} failed")


if __name__ == "__main__":
    import sys

    # Allow testing with single team
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print("TEST MODE: Scraping only Lakers")
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        # Lakers team_id is 1610612747
        stats = scrape_team("Los Angeles Lakers", 1610612747)
        print(f"\nTest complete: {stats}")
    else:
        main()
