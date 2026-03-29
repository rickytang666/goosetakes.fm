from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.fish_audio import synthesize_line, AUDIO_DIR

router = APIRouter(prefix="/tts")


class ScriptLine(BaseModel):
    speaker: str
    line: str


class SynthesizeRequest(BaseModel):
    script: list[ScriptLine]


def _clear_audio_dir():
    for f in AUDIO_DIR.glob("*.mp3"):
        f.unlink(missing_ok=True)


@router.post("/synthesize")
async def synthesize(req: SynthesizeRequest):
    _clear_audio_dir()
    try:
        urls = []
        for line in req.script:
            url = await synthesize_line(line.speaker, line.line)
            urls.append(url)
        return {
            "clips": [
                {"speaker": line.speaker, "line": line.line, "audio_url": url}
                for line, url in zip(req.script, urls)
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
