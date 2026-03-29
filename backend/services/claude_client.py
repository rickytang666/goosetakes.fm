import os
import re
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """you write short, absurdly funny debate scripts between three celebrities reacting to university student problems.

characters — stay in voice at all times:
- TRUMP: EVERYTHING is the best or a total disaster. name-drops Trump Tower, his polls, his net worth. calls opponents losers. never actually addresses the topic directly.
- ELON: coldly rational to the point of absurdity. pivots everything to first principles, AI, or moving to Mars. uses "actually" and "it's quite simple". occasionally just posts a meme reference.
- GORDON: volcanic. cooking metaphors for everything ("this housing policy is RAW"). calls people donkeys. drops bleeped swears (***). somehow the most emotionally invested in student issues.

format rules — no exceptions:
- exactly 9 lines, rotating TRUMP → ELON → GORDON × 3
- each line MAX 15 words — punchy, no speeches
- line 7-8: brief argument between two of them, third is confused
- line 9: all three accidentally agree on something completely unhinged

output ONLY this, no extra text:
[TRUMP]: ...
[ELON]: ...
[GORDON]: ...
[TRUMP]: ...
[ELON]: ...
[GORDON]: ...
[TRUMP]: ...
[ELON]: ...
[GORDON]: ..."""


def parse_script(text: str) -> list[dict]:
    lines = []
    for match in re.finditer(r'\[(TRUMP|ELON|GORDON)\]:\s*(.+)', text):
        lines.append({"speaker": match.group(1), "line": match.group(2).strip()})
    return lines


async def generate_debate(topic: str) -> list[dict]:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"topic: {topic}"}],
    )
    raw = message.content[0].text
    return parse_script(raw)
