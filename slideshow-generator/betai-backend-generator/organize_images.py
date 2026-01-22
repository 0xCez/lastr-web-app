import os
import re
import shutil
import zipfile
from pathlib import Path

ZIP_PATH = "APP pics - BET AI.zip"
TARGET_ROOT = Path("backend_generator/images/apps")

def normalize_name(name: str) -> str:
    """
    Transforme 'BetSpark 1.jpg' -> 'betspark'
    Transforme 'Roto Grinders 2.jpeg' -> 'rotogrinders'
    """
    name = name.lower()
    name = re.sub(r"[^\w\s]", "", name)
    name = name.strip()
    parts = name.split()
    return "".join(parts[:-1])  # retire le numéro avant .jpg

def organize_images():
    print("📦 Unzipping ZIP...")
    extract_path = Path("unzipped_images")
    extract_path.mkdir(exist_ok=True)

    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(extract_path)

    print("📁 ZIP extracted at:", extract_path)

    # On trouve tous les fichiers images
    image_files = list(extract_path.rglob("*.*"))
    print(f"🔍 Found {len(image_files)} images")

    for img in image_files:
        if not img.is_file():
            continue

        filename = img.name
        print("➡️ Processing:", filename)

        # identifier app_id
        app_id = normalize_name(filename)
        if not app_id:
            print("❌ Could not parse app name:", filename)
            continue

        # dossier cible
        target_folder = TARGET_ROOT / app_id
        target_folder.mkdir(parents=True, exist_ok=True)

        # Extraire numéro de l'image (ex: 1, 2, 3, 4)
        m = re.search(r"(\d+)", filename)
        index = m.group(1) if m else "1"

        new_path = target_folder / f"{index}.jpg"

        print(f"   -> Saving as: {new_path}")

        shutil.copy(img, new_path)

    print("\n✅ DONE. All images organized.")
    print("Images placed inside:", TARGET_ROOT)


if __name__ == "__main__":
    organize_images()
