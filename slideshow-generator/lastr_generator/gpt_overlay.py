import os
import json
import re
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CTA_SENTENCES = [
    "You promised yourself this wouldn't happen again.",
    "You know exactly why you can't slip again.",
    "You remember how it felt last time — never again.",
    "You know what losing control feels like.",
    "You still hear that moment replaying in your head.",
    "You know the feeling you're trying to avoid.",
    "You know the look she gave you — don't relive it.",
    "You remember how fast confidence can disappear.",
    "You know the moment you wish you could redo.",
    "You know exactly what night you're trying to forget."
]


def clean_json_output(text: str):
    """Remove Markdown fences and extract a JSON object."""
    sanitized = re.sub(r"```json", "", text)
    sanitized = re.sub(r"```", "", sanitized).strip()

    try:
        return json.loads(sanitized)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", sanitized, re.DOTALL)
        if not match:
            raise ValueError(f"GPT output is not valid JSON:\n{text}")
        return json.loads(match.group(0))


def format_cta_slide(sentence: str, repeat_count: int) -> str:
    """Repeat the CTA sentence 8–10 times, then add the Lastr signature."""
    try:
        repeats = int(repeat_count)
    except (TypeError, ValueError):
        repeats = 8
    repeats = max(8, min(10, repeats))
    block = "\n".join(sentence for _ in range(repeats))
    return f"{block}\n\nTry Lastr."


def generate_overlay_and_hook(post_json):
    """
    Ask GPT for hook + slides. Retries up to 3 times when the model
    returns malformed output, then falls back to a deterministic script
    so the pipeline never crashes.
    """
    for attempt in range(3):
        result = _request_overlay(post_json, attempt + 1)
        if result:
            return result

    print("⚠️ Falling back to deterministic overlay copy.")
    return _fallback_overlay(post_json)


def _request_overlay(post_json, attempt):
    cta_list = json.dumps(CTA_SENTENCES, indent=2)
    prompt = f"""
SYSTEM:
You are a top-tier creative director for TikTok carousels about performance confidence.
You write hooks and overlays that feel raw, emotional, and PG-13 compliant.

ROUTES (provided in the JSON):
- "tips": hook is direct (e.g. "5 moves to last longer"). Slides 2–5 are actionable
  micro-tips (breathing, rhythm, mental control, tension). Tone = instructive.
- "story": hook is fear-based/emotional. Slides 2–5 tell a narrative:
  panic → tension → shame → realization → Lastr solution. Tone = emotional.
- "reasons": hook is self-discovery (e.g. "All the reasons why I couldn't last").
  Slides 2–5 each reveal ONE different reason for struggling with stamina (anxiety, overthinking,
  no practice, stress, poor breathing, lack of control). Each reason must be genuinely different.
  Tone = reflective, gen-z authentic, relatable.
- "myth": hook busts a common myth (e.g. "90% of guys don't know this about lasting longer").
  Slides 2–5 reveal surprising facts/myths about stamina, performance, and control that most guys
  get wrong. Each slide busts a different myth or reveals a counterintuitive truth.
  Tone = educational, eye-opening, "did you know" energy.
- "killing": hook calls out bad habits (e.g. "Things killing your stamina right now").
  Slides 2–5 each reveal ONE thing that hurts stamina (stress, poor sleep, no cardio, death grip,
  anxiety, bad breathing). Each must be different. Tone = wake-up call, direct, no fluff.
- "pov": hook is aspirational (e.g. "POV: you finally last as long as you want").
  Slides 2–5 paint the picture of what life looks like after mastering control (confidence,
  no anxiety, relaxed, she notices, you feel different). Tone = dreamy, aspirational, motivating.

TEXT RULES:
- Overlay text must stay ultra short: 1–2 punchy lines per slide (except final CTA).
- Allowed vocab: control, pressure, lasting longer, stamina, panic, fear, confidence,
  rushing, losing control, breathing, rhythm, focus.
- Forbidden: explicit sexual terms (sex, sexual, cum, penis, vagina, thrusting, etc.)
  or anything outside TikTok PG-13.

STRUCTURE:
- "hook": scroll-stopping and matching the selected route.
- "slides": exactly 5 entries (Slides 1–5) following the route logic.
  * Slide 1 references breathing/control to open the carousel.
  * Slides 2–4 continue the tips or emotional arc.
  * Slide 5 pivots to Lastr (benefit, proof, invitation).
- Slide 6 is handled separately via CTA fields below.

CTA FORMAT (MANDATORY):
- Pick one sentence from the provided CTA list.
- Return it verbatim in "cta_sentence" and choose "cta_repeats" between 8 and 10.
- I will render Slide 6 as: sentence repeated 8–10 times (one per line), blank line,
  then "Try Lastr."
- CTA sentence list:
{cta_list}

INPUT JSON:
{json.dumps(post_json, indent=2)}

OUTPUT (RETURN EXACTLY THIS JSON):
{{
  "hook": "<rewritten hook>",
  "slides": [
    "<slide_1_text>",
    "<slide_2_text>",
    "<slide_3_text>",
    "<slide_4_text>",
    "<slide_5_text>"
  ],
  "cta_sentence": "<exact sentence copied from CTA list>",
  "cta_repeats": <integer between 8 and 10>
}}
"""

    try:
        response = client.responses.create(
            model="gpt-4.1",
            input=prompt
        )
    except Exception as exc:
        print("❌ OpenAI API error:", exc)
        return None

    raw_output = response.output_text

    try:
        parsed = clean_json_output(raw_output)
    except Exception as exc:
        print("❌ INVALID JSON RETURNED (attempt", attempt, "):")
        print(raw_output)
        print(exc)
        return None

    slides = parsed.get("slides", [])
    if len(slides) != 5:
        print(f"❌ GPT did not return exactly 5 slides on attempt {attempt}: {slides}")
        return None

    hook = (parsed.get("hook") or "").strip() or post_json.get("hook")

    cta_sentence = (parsed.get("cta_sentence") or "").strip()
    if cta_sentence not in CTA_SENTENCES:
        print("⚠️ CTA sentence invalid. Falling back to default.")
        cta_sentence = CTA_SENTENCES[0]

    final_slide = format_cta_slide(cta_sentence, parsed.get("cta_repeats", 8))
    slides = [s.strip() for s in slides]
    slides.append(final_slide)

    return {
        "hook": hook,
        "slides": slides
    }


def _fallback_overlay(post_json):
    route = post_json.get("route", "story")
    if route == "tips":
        hook = "5 quick moves to last longer tonight."
        slides = [
            "Start with a deep 4-4 breath. Control begins there.",
            "Drop your shoulders. A tense body finishes faster.",
            "Lock your eyes on one point to stop racing thoughts.",
            "Switch rhythm the second you feel panic creeping in.",
            "Track every rep inside Lastr before the real moment."
        ]
    else:
        hook = "When panic hits mid-moment, here’s how you steal back control."
        slides = [
            "Breathe slow when the rush spikes.",
            "Panic tells you tonight will end the same way.",
            "Shame shows up the second you start rushing.",
            "Control returns when you rehearse the calm.",
            "Lastr is where you rebuild that calm daily."
        ]

    slides.append(format_cta_slide(CTA_SENTENCES[0], 8))
    return {
        "hook": hook,
        "slides": slides
    }

