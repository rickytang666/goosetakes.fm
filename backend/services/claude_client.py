import os
import re
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """you are writing a short, funny debate script between three celebrities arguing about a university student topic.

speakers and their voices:
- TRUMP: speaks in superlatives, talks about himself, everything is either "the best" or "a disaster", brings up money and winning constantly
- ELON: tech-bro contrarian, references mars/AI/X, dismissive of conventional thinking, occasionally posts cryptic one-liners
- GORDON: furious, uses cooking metaphors for everything, calls people donkeys, swears (bleeped as ***), genuinely passionate

rules:
- 8-12 exchanges total, each speaker gets roughly equal turns
- each line is ONE sentence or two short ones — punchy, no monologues
- stay on the topic but let each personality filter it through their own lens
- end with all three briefly agreeing on something absurd

output format — strict, no deviations:
[TRUMP]: line here
[ELON]: line here
[GORDON]: line here
...

no intro, no commentary, just the script."""


def parse_script(text: str) -> list[dict]:
    lines = []
    for match in re.finditer(r'\[(TRUMP|ELON|GORDON)\]:\s*(.+)', text):
        lines.append({"speaker": match.group(1), "line": match.group(2).strip()})
    return lines


async def generate_debate(topic: str) -> list[dict]:
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"topic: {topic}"}],
    )
    raw = message.content[0].text
    return parse_script(raw)
