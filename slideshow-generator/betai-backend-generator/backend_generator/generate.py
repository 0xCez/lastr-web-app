import json
import random
from pathlib import Path
from gpt_overlay import generate_marketing_content   # GPT generator

# Paths
ROOT = Path(__file__).parent
CONFIG_PATH = ROOT / "data.json"
IMAGES_ROOT = ROOT / "images"


# -------------------------------------------------------
# Load JSON config
# -------------------------------------------------------
def load_config(path=CONFIG_PATH):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# -------------------------------------------------------
# Pick hook
# -------------------------------------------------------
def pick_hook(data):
    hooks = data["hooks"]
    hook_text = random.choice(hooks)

    # Dynamically pick a random hook image from the folder
    hooks_folder = IMAGES_ROOT / "hooks"
    hook_images = (
        list(hooks_folder.glob("*.jpg"))
        + list(hooks_folder.glob("*.jpeg"))
        + list(hooks_folder.glob("*.png"))
    )

    if not hook_images:
        raise Exception(f"No hook images found in {hooks_folder}")

    hook_image = random.choice(hook_images)

    return {
        "text": hook_text,
        "image": str(hook_image),
    }


# -------------------------------------------------------
# Pick 5 distinct categories
# -------------------------------------------------------
def pick_categories(data):
    return random.sample(data["categories"], 5)


# -------------------------------------------------------
# Assign one app per category
# - BetAI must appear EXACTLY once
# - BetAI cannot appear in niche_sports
# -------------------------------------------------------
def assign_apps(data, selected_categories):
    apps_meta = data["apps"]

    # categories where BetAI is allowed AND present
    eligible = [
        c for c in selected_categories
        if c["id"] != "niche_sports" and "betai" in c["apps"]
    ]

    if not eligible:
        raise Exception("No eligible category for BetAI placement.")

    # choose category where BetAI will appear
    betai_category = random.choice(eligible)

    slides = []
    for category in selected_categories:
        cat_id = category["id"]

        # BetAI forced here
        if category is betai_category:
            app_id = "betai"

        # Niche sport apps (never BetAI)
        elif cat_id == "niche_sports":
            app_id = random.choice(category["apps"])

        # All other categories: everything EXCEPT betai
        else:
            possible_apps = [a for a in category["apps"] if a != "betai"]
            if not possible_apps:
                raise Exception(f"No valid apps in category {cat_id}.")
            app_id = random.choice(possible_apps)

        slides.append({
            "category_id": category["id"],
            "category_label": category["label"],
            "app_id": app_id,
            "app_name": apps_meta[app_id]["name"]
        })

    # Verify BetAI appears exactly once
    assert sum(1 for s in slides if s["app_id"] == "betai") == 1

    return slides


# -------------------------------------------------------
# Attach random images 1–6 for each app (dynamic)
# -------------------------------------------------------
def pick_images_for_slides(slides):
    for slide in slides:
        app_id = slide["app_id"]

        # find number of images for this app folder
        app_folder = IMAGES_ROOT / "apps" / app_id
        jpg_count = len([f for f in app_folder.glob("*.jpg")])
        png_count = len([f for f in app_folder.glob("*.png")])
        total = jpg_count + png_count

        if total == 0:
            raise Exception(f"No images found for app: {app_id}")

        # pick an index from available images
        img_index = random.randint(1, total)

        # Prefer jpg when present
        jpg_path = app_folder / f"{img_index}.jpg"
        png_path = app_folder / f"{img_index}.png"

        if jpg_path.exists():
            slide["image"] = str(jpg_path)
        elif png_path.exists():
            slide["image"] = str(png_path)
        else:
            raise Exception(f"Image {img_index} missing for app {app_id}")


# -------------------------------------------------------
# Local fallback overlay text (if GPT disabled)
# -------------------------------------------------------
def build_overlay_text(slide):
    cat = slide["category_id"]
    app = slide["app_name"]

    mapping = {
        "odds_comparison": f"For line shopping, I use {app}.",
        "stats_data": f"For live scores, I check {app} all day.",
        "bankroll_tools": f"To track every bet, I use {app}.",
        "sharp_sentiment": f"To read market sentiment, I watch {app}.",
        "ai_analysis": f"For deeper EV analysis, I trust {app}.",
        "niche_sports": f"For niche sports, I rely on {app}."
    }

    return mapping.get(cat, f"I use {app} every day.")


# -------------------------------------------------------
# Generate single post JSON
# -------------------------------------------------------
def generate_one_post():
    data = load_config()

    hook = pick_hook(data)
    selected_cats = pick_categories(data)
    slides = assign_apps(data, selected_cats)
    pick_images_for_slides(slides)

    # local overlay text (baseline) – will be replaced by GPT
    for slide in slides:
        slide["overlay_text"] = build_overlay_text(slide)

    # structured input for GPT (only text + minimal structure if needed)
    raw_post = {
        "hook": {"text": hook["text"]},
        "slides": [
            {
                "category_id": s["category_id"],
                "app_name": s["app_name"],
                "overlay_text": s["overlay_text"],
            }
            for s in slides
        ],
    }

    # send to GPT to rewrite + improve overlay texts
    gpt_output = generate_marketing_content(raw_post)

    # gpt_output expected:
    # {
    #   "hook": "<rewritten_hook_text>",
    #   "slides": [
    #       "<rewritten_slide_1_text>",
    #       ...
    #   ]
    # }

    # Merge GPT texts back into full structure with images + metadata
    final_post = {
        "hook": {
            "text": gpt_output.get("hook", hook["text"]),
            "image": hook["image"],
        },
        "slides": [],
    }

    rewritten_slides = gpt_output.get("slides", [])

    for idx, slide in enumerate(slides):
        # If GPT returned enough slide texts, use them; otherwise fall back
        rewritten_text = (
            rewritten_slides[idx]
            if idx < len(rewritten_slides)
            else slide["overlay_text"]
        )

        final_post["slides"].append(
            {
                "category_id": slide["category_id"],
                "category_label": slide["category_label"],
                "app_id": slide["app_id"],
                "app_name": slide["app_name"],
                "image": slide["image"],
                "overlay_text": rewritten_text,
            }
        )

    return final_post


# -------------------------------------------------------
# CLI execution
# -------------------------------------------------------
if __name__ == "__main__":
    post = generate_one_post()
    print(json.dumps(post, indent=2))
