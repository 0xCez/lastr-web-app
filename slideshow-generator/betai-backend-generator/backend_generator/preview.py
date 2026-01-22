import json
from pathlib import Path

from generate import generate_one_post


ROOT = Path(__file__).parent
OUTPUT_HTML = ROOT / "preview.html"


def build_html(post: dict) -> str:
    """Create a simple HTML preview for the generated post."""
    hook = post.get("hook", {})
    slides = post.get("slides", [])

    hook_text = hook.get("text", "")
    hook_image = hook.get("image", "")

    slides_html = []
    for s in slides:
        slides_html.append(
            f"""
        <div class="slide">
            <img src="{s.get('image','')}" alt="{s.get('app_name','')}" />
            <div class="overlay">
                <div class="category">{s.get('category_label','')}</div>
                <div class="app">{s.get('app_name','')}</div>
                <div class="text">{s.get('overlay_text','')}</div>
            </div>
        </div>
        """
        )

    slides_html_str = "\n".join(slides_html)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BetAI Post Preview</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #050509;
      color: #fff;
    }}
    .container {{
      max-width: 420px;
      margin: 20px auto 60px auto;
      border-radius: 24px;
      background: #0a0a12;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }}
    .hook, .slide {{
      position: relative;
      width: 100%;
      aspect-ratio: 9 / 16;
      overflow: hidden;
      background: #111;
    }}
    .hook img, .slide img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }}
    .hook-overlay, .overlay {{
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 18px 16px 22px 16px;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 55%, transparent 100%);
      box-sizing: border-box;
    }}
    .hook-text {{
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1.2;
    }}
    .category {{
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #9ca3af;
      margin-bottom: 6px;
    }}
    .app {{
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 4px;
    }}
    .text {{
      font-size: 14px;
      line-height: 1.3;
      color: #e5e7eb;
    }}
    .slides-wrapper {{
      border-top: 1px solid rgba(255,255,255,0.06);
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="hook">
      <img src="{hook_image}" alt="hook" />
      <div class="hook-overlay">
        <div class="hook-text">{hook_text}</div>
      </div>
    </div>
    <div class="slides-wrapper">
      {slides_html_str}
    </div>
  </div>
</body>
</html>
"""


def main():
    post = generate_one_post()
    html = build_html(post)
    OUTPUT_HTML.write_text(html, encoding="utf-8")
    print(f"Preview generated at: {OUTPUT_HTML}")


if __name__ == "__main__":
    main()


