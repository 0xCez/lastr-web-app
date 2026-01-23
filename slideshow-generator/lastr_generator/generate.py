import json
import random
from pathlib import Path
from gpt_overlay import generate_overlay_and_hook


# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------
ROOT = Path(__file__).parent
PICS_ROOT = ROOT.parent.parent / "public" / "images" / "Lastr_pics"
OUTPUT_PATH = ROOT / "output.json"


# ------------------------------------------------------------
# IMAGE CATEGORIES
# ------------------------------------------------------------
CATEGORIES = {
    "aesthetic": PICS_ROOT / "aesthetic",
    "couple": PICS_ROOT / "Couple",
    "health": PICS_ROOT / "Health",
    "muscle": PICS_ROOT / "Muscle",
    "room": PICS_ROOT / "Room",
    "mirror": PICS_ROOT / "Mirror",
    "stress": PICS_ROOT / "stress",
    "app": PICS_ROOT / "App",
}

# Image sequences per format
# Hook (slide 1) should be: aesthetic, stress, or muscle - NOT health (food pics)
# Health = food/nutrition pics - use for middle slides only
# CTA (last slide) = always app
IMAGE_SEQUENCES = {
    "tips": ["muscle", "health", "room", "couple", "mirror", "app"],
    "story": ["stress", "room", "couple", "mirror", "aesthetic", "app"],
    "reasons": ["aesthetic", "stress", "room", "couple", "mirror", "app"],
    "myth": ["muscle", "room", "health", "couple", "mirror", "app"],
    "killing": ["stress", "health", "room", "mirror", "couple", "app"],
    "pov": ["aesthetic", "couple", "mirror", "room", "muscle", "app"],
}


# ------------------------------------------------------------
# IMAGE PICKING UTILITIES
# ------------------------------------------------------------

def pick_random_image(folder: Path):
    """Pick a random image from a folder."""
    images = (
        list(folder.glob("*.jpg")) +
        list(folder.glob("*.jpeg")) +
        list(folder.glob("*.png"))
    )
    if not images:
        raise Exception(f"No images found in: {folder}")
    return str(random.choice(images))


def generate_image_sequence(route: str):
    """Return 6 image paths based on the route/format."""
    sequence = IMAGE_SEQUENCES.get(route, IMAGE_SEQUENCES["story"])
    slides = []
    for category in sequence:
        folder = CATEGORIES[category]
        slides.append(pick_random_image(folder))
    return slides


# ------------------------------------------------------------
# LOGIC FOR ROUTE SELECTION
# ------------------------------------------------------------

def choose_route():
    """
    Randomly choose between:
    - 'tips'      (5 tips to last longer)
    - 'story'     (emotional story about panic / control)
    - 'reasons'   (all the reasons why I couldn't last)
    - 'myth'      (90% of guys don't know this...)
    - 'killing'   (things killing your stamina)
    - 'pov'       (POV: you finally lasted)
    """
    return random.choice(["tips", "story", "reasons", "myth", "killing", "pov"])


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
    images = generate_image_sequence(route)
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
