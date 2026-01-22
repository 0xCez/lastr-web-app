import json
import random
from pathlib import Path
from gpt_overlay import generate_overlay_and_hook


# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------
ROOT = Path(__file__).parent
# Lastr_pics lives next to the Lastr/ directory, not inside it.
PICS_ROOT = ROOT.parent.parent / "Lastr_pics"
OUTPUT_PATH = ROOT / "output.json"


# ------------------------------------------------------------
# IMAGE PICKING UTILITIES
# ------------------------------------------------------------

def pick_random_image(folder: Path):
    """Pick a random JPEG/JPG image from a folder."""
    images = list(folder.glob("*.jpg")) + list(folder.glob("*.jpeg"))
    if not images:
        raise Exception(f"No images found in: {folder}")
    return str(random.choice(images))


def generate_image_sequence():
    """Return 6 image paths following the TikTok carousel rules."""
    breathing_folder = PICS_ROOT / "Breathing"
    app_folder = PICS_ROOT / "App"
    middle_candidates = [
        PICS_ROOT / "Couple",
        PICS_ROOT / "Muscle",
        PICS_ROOT / "Psycho",
        PICS_ROOT / "Room",
    ]

    slides = []

    # Slide 1 → Breathing
    slides.append(pick_random_image(breathing_folder))

    # Slides 2–5 → Routine/Anxiety/Backgrounds (random pick each time)
    for _ in range(4):
        folder = random.choice(middle_candidates)
        slides.append(pick_random_image(folder))

    # Slide 6 → App
    slides.append(pick_random_image(app_folder))

    return slides


# ------------------------------------------------------------
# LOGIC FOR ROUTE SELECTION
# ------------------------------------------------------------

def choose_route():
    """
    Randomly choose between:
    - 'tips'      (5 tips to last longer)
    - 'story'     (emotional story about panic / control)
    """
    return random.choice(["tips", "story"])


# ------------------------------------------------------------
# HOOK + SLIDES GENERATION (GPT-POWERED)
# ------------------------------------------------------------

def build_input_structure(route, image_sequence):
    """
    Build the JSON object sent to GPT. 
    GPT will rewrite all text but we give structure.
    """
    data = {
        "route": route,
        "slides": [
            {"image": img_path} for img_path in image_sequence
        ]
    }
    return data


# ------------------------------------------------------------
# MAIN GENERATOR
# ------------------------------------------------------------

def generate_post():
    route = choose_route()
    images = generate_image_sequence()
    input_json = build_input_structure(route, images)

    # Call GPT
    output = generate_overlay_and_hook(input_json)

    # Add images back into final output
    output_structured = {
        "hook": output["hook"],
        "slides": []
    }

    for i, text in enumerate(output["slides"]):
        output_structured["slides"].append({
            "text": text,
            "image": images[i]
        })

    # Save final JSON
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output_structured, f, indent=2)

    return output_structured


# ------------------------------------------------------------
# EXECUTE
# ------------------------------------------------------------

if __name__ == "__main__":
    post = generate_post()
    print(json.dumps(post, indent=2))
