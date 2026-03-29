import os
import uuid
import httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

FISH_API_KEY = os.getenv("FISH_AUDIO_API_KEY")
FISH_TTS_URL = "https://api.fish.audio/v1/tts"

VOICE_IDS = {
    "TRUMP": "76122219d4ce4c69a572e80c945c747d",
    "ELON": "03397b4c4be74759b72533b663fbd001",
    "GORDON": "e605a2a42b0a44ccb7af2e42e1676c92",
}

AUDIO_DIR = Path(__file__).parent.parent / "static" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


async def synthesize_line(speaker: str, line: str) -> str:
    """returns relative url path to the saved audio clip"""
    voice_id = VOICE_IDS[speaker]
    filename = f"{uuid.uuid4()}.mp3"
    filepath = AUDIO_DIR / filename

    async with httpx.AsyncClient() as client:
        r = await client.post(
            FISH_TTS_URL,
            headers={"Authorization": f"Bearer {FISH_API_KEY}"},
            json={"text": line, "reference_id": voice_id, "format": "mp3"},
            timeout=30,
        )
        r.raise_for_status()
        filepath.write_bytes(r.content)

    return f"/static/audio/{filename}"
