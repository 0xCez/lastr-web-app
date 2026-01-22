import json
from pathlib import Path

ROOT = Path(__file__).parent
OUTPUT_JSON = ROOT / "output.json"
PREVIEW_HTML = ROOT / "preview.html"


def load_output():
    if not OUTPUT_JSON.exists():
        raise FileNotFoundError(
            "output.json introuvable. Lance d'abord `python generate.py`."
        )
    with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


def render_slide(idx, slide):
    text_html = slide["text"].replace("\n", "<br>")
    img_path = slide.get("image", "")
    img_src = f"file://{img_path}"
    return f"""
    <section class="slide">
        <div class="slide-index">Slide {idx}</div>
        <img src="{img_src}" alt="Slide {idx}">
        <p>{text_html}</p>
    </section>
    """


def build_html(data):
    slides = "\n".join(
        render_slide(i + 1, slide)
        for i, slide in enumerate(data.get("slides", []))
    )
    hook = data.get("hook", "Hook manquant")

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <title>Preview Lastr</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #0a0a0a;
            color: #f5f5f5;
            margin: 0;
            padding: 32px;
        }}
        h1 {{
            font-size: 28px;
            margin-bottom: 24px;
        }}
        .slides {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
        }}
        .slide {{
            background: #161616;
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 0 24px rgba(0,0,0,0.4);
        }}
        .slide-index {{
            font-weight: 600;
            color: #7dd3fc;
            margin-bottom: 8px;
        }}
        img {{
            width: 100%;
            border-radius: 12px;
            margin-bottom: 12px;
        }}
        p {{
            white-space: pre-line;
            line-height: 1.5;
        }}
    </style>
</head>
<body>
    <h1>{hook}</h1>
    <div class="slides">
        {slides}
    </div>
</body>
</html>
"""


def generate_preview():
    data = load_output()
    html = build_html(data)
    PREVIEW_HTML.write_text(html, encoding="utf-8")
    return PREVIEW_HTML


if __name__ == "__main__":
    path = generate_preview()
    print(f"✅ Preview généré: {path}")

