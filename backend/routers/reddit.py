from fastapi import APIRouter, HTTPException, Query
from services.reddit_scraper import fetch_posts, search_posts, fetch_post_by_url

router = APIRouter(prefix="/reddit")


@router.get("/posts")
async def get_posts():
    try:
        return {"posts": await fetch_posts()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    try:
        return {"posts": await search_posts(q)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/post")
async def get_post(url: str = Query(...)):
    try:
        return await fetch_post_by_url(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
