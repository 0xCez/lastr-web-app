import os
import json
import re
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def clean_json_output(text):
    """Clean GPT output, remove ```json and extract JSON."""
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)
    text = text.strip()

    # Try direct parse
    try:
        return json.loads(text)
    except:
        pass

    # Try extract JSON object
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            pass

    raise ValueError("GPT output could not be parsed as JSON:\n" + text)


def generate_marketing_content(post_json, locale="en"):
    """
    post_json = {
        "hook": { "text": "...", "image": "..." },
        "slides": [
            { "category_id": "...", "app_name": "...", "image": "..." },
            ...
        ]
    }
    """

    prompt = f"""
SYSTEM ROLE:
You are a senior marketing strategist specialized in sports betting apps, bettor psychology,
performance marketing, and TikTok attention engineering.

OBJECTIVE:
Rewrite and improve:
1. The HOOK (make it sharp, edgy, scroll-stopping, conversion-focused)
2. The overlay texts (TikTok slides) with punchy, viral phrasing.

CONSTRAINTS:
- Keep it SHORT, AGGRESSIVE, and CLEAR.
- NO corporate tone. Talk like a bettor who's seen everything.
- Keep same meaning but make 10x more powerful.
- Written in {locale.upper()} only.
- For app slides, the description MUST be exactly one line, purely factual, NO questions, NO question-then-answer format.

INPUT JSON:
{json.dumps(post_json, indent=2)}

OUTPUT FORMAT (MANDATORY):
Return ONLY this JSON:

{{
  "hook": "<rewritten_hook_text>",
  "slides": [
      "<rewritten_slide_1_text>",
      "<rewritten_slide_2_text>",
      "<rewritten_slide_3_text>",
      "<rewritten_slide_4_text>",
      "<rewritten_slide_5_text>"
  ]
}}
"""

    # ✔️ New API format (2025)
    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    # ✔️ New API output
    raw_output = response.output_text

    # Parse → Clean → JSON
    return clean_json_output(raw_output)
