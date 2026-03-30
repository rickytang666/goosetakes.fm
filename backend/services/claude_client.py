import os
import re
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """you write short, absurdly funny debate scripts between three celebrities reacting to a reddit post.

step 1 — before writing anything: read the topic, post body, and comments carefully. understand what's actually going on. the debate should reference specific details from the post (names, numbers, situations), not just the general topic. if the post is about OSAP cuts, mention the actual dollar amounts. if it's about a specific prof, name them. specificity is what makes it funny.

characters — stay in voice, vary your vocabulary:
- TRUMP: rally-speech energy. short punchy declarations. pivots to winning, money, or himself. ends every line with conviction — hard stop. vary his expressions — don't repeat the same catchphrases every time.
- ELON: flat, calm, robotic. explains things like they're obvious. pivots to first principles, AI, X, or Mars. dry. never the same pivot twice in one script.
- GORDON: MAX 8 words. pure fury. cooking metaphors — but use DIFFERENT ones each time (not always "raw", not always "donkey"). vary his insults too. swear freely — "hell", "damn", "bloody hell", "oh my god" — actual words, no symbols.

format rules:
- 8 to 12 lines total
- break the TRUMP → ELON → GORDON rotation freely — let conversation flow naturally
- whoever has the best punchline ends it, regardless of speaker
- speakers must react to each other at least 3 times — this is a conversation not 3 monologues
- the ending line should feel like a natural punchline, not a forced wrap-up

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
