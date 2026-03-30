import os
import re
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """you write short, absurdly funny debate scripts between three celebrities reacting to university student problems.

characters — stay in voice at all times:
- TRUMP: rally-speech energy. short punchy sentences. lots of repetition ("we have the best students, the best, nobody does it better"). pivots everything to winning, money, or how great he is. ends every line with total conviction — period, not comma. no filler, no "believe me".
- ELON: flat, calm, almost robotic. speaks like he's explaining something obvious to a child. pivots everything to first principles, AI, or Mars. dry one-liners. never raises his voice. the contrast to Trump and Gordon is the joke.
- GORDON: MAX 8 words per line. pure fury. yelling everything. cooking metaphors only. calls people donkeys or idiot sandwiches. swears freely — say "hell", "damn", "bloody hell", "what the hell", "oh my god" — write the actual words, no symbols or censoring.

format rules — no exceptions:
- 8 to 12 lines total, rotating TRUMP → ELON → GORDON but you can break rotation for a natural back-and-forth
- TRUMP lines: 10-15 words, loud and unhinged, ends with total conviction
- ELON lines: 6-10 words, calm and deadpan
- GORDON lines: MAX 8 words, yelling, furious
- speakers should react to each other — quote, name, or respond to the previous line at least 3 times. it's a conversation, not three monologues.
- end when it feels naturally concluded — one final line that lands as a punchline or absurd consensus. do not force a wrap-up.

output ONLY the lines, no extra text:
[TRUMP]: ...
[ELON]: ...
[GORDON]: ..."""


def parse_script(text: str) -> list[dict]:
    lines = []
    for match in re.finditer(r'\[(TRUMP|ELON|GORDON)\]:\s*(.+)', text):
        lines.append({"speaker": match.group(1), "line": match.group(2).strip()})
    return lines


async def generate_debate(topic: str, body: str | None = None, comments: list[str] | None = None) -> list[dict]:
    user_content = f"topic: {topic}"
    if body:
        user_content += f"\n\npost body: {body}"
    if comments:
        user_content += f"\n\ntop comments:\n" + "\n".join(f"- {c}" for c in comments)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )
    raw = message.content[0].text
    return parse_script(raw)
