import httpx

SUBREDDIT = "uwaterloo"
HEADERS = {"User-Agent": "goosetakes/1.0"}


async def fetch_hot_posts(limit: int = 10) -> list[dict]:
    url = f"https://www.reddit.com/r/{SUBREDDIT}/hot.json?limit={limit}"
    async with httpx.AsyncClient(headers=HEADERS) as client:
        r = await client.get(url, follow_redirects=True)
        r.raise_for_status()
        children = r.json()["data"]["children"]

    return [
        {
            "id": p["data"]["id"],
            "title": p["data"]["title"],
            "score": p["data"]["score"],
            "url": f"https://reddit.com{p['data']['permalink']}",
            "num_comments": p["data"]["num_comments"],
        }
        for p in children
        if not p["data"]["stickied"]
    ]
