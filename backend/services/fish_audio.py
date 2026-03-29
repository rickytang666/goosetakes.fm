import os
import uuid
import httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

FISH_API_KEY = os.getenv("FISH_AUDIO_API_KEY")
FISH_TTS_URL = "https://api.fish.audio/v1/tts"

VOICE_IDS = {
    "TRUMP": "4d5fa13d58824062a669e37665626dba",
    "ELON": "03397b4c4be74759b72533b663fbd001",
    "GORDON": "e605a2a42b0a44ccb7af2e42e1676c92",
}

SPEAKER_STYLE: dict[str, dict] = {
    "TRUMP": {
        "prefix": "(angry)(furious)",
        "prosody": {"speed": 1.1, "volume": 5},
    },
    "ELON": {
        "prefix": "(calm)(indifferent)",
        "prosody": {"speed": 1.0, "volume": 0},
    },
    "GORDON": {
        "prefix": "(angry)(shouting)",
        "prosody": {"speed": 1.0, "volume": 4},
    },
}

AUDIO_DIR = Path(__file__).parent.parent / "static" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


async def synthesize_line(speaker: str, line: str) -> str:
    """returns relative url path to the saved audio clip"""
    voice_id = VOICE_IDS[speaker]
    style = SPEAKER_STYLE[speaker]
    styled_text = f"{style['prefix']}{line}"
    filename = f"{uuid.uuid4()}.mp3"
    filepath = AUDIO_DIR / filename

    async with httpx.AsyncClient() as client:
        r = await client.post(
            FISH_TTS_URL,
            headers={"Authorization": f"Bearer {FISH_API_KEY}"},
            json={
                "text": styled_text,
                "reference_id": voice_id,
                "format": "mp3",
                "normalize": False,
                "prosody": style["prosody"],
            },
            timeout=30,
        )
        r.raise_for_status()
        filepath.write_bytes(r.content)

    return f"/static/audio/{filename}"
