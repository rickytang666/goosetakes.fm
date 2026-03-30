import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.fish_audio import synthesize_line, AUDIO_DIR

router = APIRouter(prefix="/tts")

CONCURRENCY = 3  # lower to 2 if 429s persist
_sem: asyncio.Semaphore | None = None


def get_sem() -> asyncio.Semaphore:
    global _sem
    if _sem is None:
        _sem = asyncio.Semaphore(CONCURRENCY)
    return _sem


class ScriptLine(BaseModel):
    speaker: str
    line: str


class SynthesizeRequest(BaseModel):
    script: list[ScriptLine]


def _clear_audio_dir():
    for f in AUDIO_DIR.glob("*.mp3"):
        f.unlink(missing_ok=True)


async def _synthesize_with_sem(speaker: str, line: str) -> str:
    async with get_sem():
        return await synthesize_line(speaker, line)


@router.post("/synthesize")
async def synthesize(req: SynthesizeRequest):
    _clear_audio_dir()
    try:
        urls = await asyncio.gather(*[
            _synthesize_with_sem(line.speaker, line.line)
            for line in req.script
        ])
        return {
            "clips": [
                {"speaker": line.speaker, "line": line.line, "audio_url": url}
                for line, url in zip(req.script, urls)
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
