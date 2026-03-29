from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.claude_client import generate_debate

router = APIRouter(prefix="/debate")


class DebateRequest(BaseModel):
    topic: str
    body: str | None = None
    comments: list[str] | None = None


@router.post("/generate")
async def generate(req: DebateRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="topic is required")
    try:
        script = await generate_debate(req.topic, req.body, req.comments)
        return {"script": script}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
