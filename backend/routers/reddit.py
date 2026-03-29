from fastapi import APIRouter, HTTPException
from services.reddit_scraper import fetch_hot_posts

router = APIRouter(prefix="/reddit")


@router.get("/hot")
async def get_hot_posts():
    try:
        posts = await fetch_hot_posts()
        return {"posts": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
