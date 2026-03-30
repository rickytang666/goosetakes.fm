import asyncio
import httpx
import re

SUBREDDIT = "uwaterloo"
HEADERS = {"User-Agent": "goosetake/1.0"}
MIN_SCORE = 10


def _parse_post(p: dict) -> dict:
    d = p["data"]
    return {
        "id": d["id"],
        "title": d["title"],
        "score": d["score"],
        "url": f"https://reddit.com{d['permalink']}",
        "num_comments": d["num_comments"],
        "body": d.get("selftext", "")[:500] or None,
    }


async def _get(client: httpx.AsyncClient, url: str) -> dict:
    r = await client.get(url, follow_redirects=True)
    r.raise_for_status()
    return r.json()


async def fetch_posts(limit: int = 50) -> list[dict]:
    """merge hot + new, dedupe, filter by min score, sort by score"""
    async with httpx.AsyncClient(headers=HEADERS) as client:
        hot, new = await asyncio.gather(
            _get(client, f"https://www.reddit.com/r/{SUBREDDIT}/hot.json?limit={limit}"),
            _get(client, f"https://www.reddit.com/r/{SUBREDDIT}/new.json?limit=100"),
        )

    seen = set()
    posts = []
    for listing in [hot, new]:
        for p in listing["data"]["children"]:
            pid = p["data"]["id"]
            if p["data"]["stickied"] or pid in seen:
                continue
            seen.add(pid)
            parsed = _parse_post(p)
            if parsed["score"] >= MIN_SCORE:
                posts.append(parsed)

    posts.sort(key=lambda p: p["score"], reverse=True)
    return posts[:limit]


async def search_posts(query: str, limit: int = 20) -> list[dict]:
    url = f"https://www.reddit.com/r/{SUBREDDIT}/search.json?q={query}&restrict_sr=1&sort=relevance&limit={limit}"
    async with httpx.AsyncClient(headers=HEADERS) as client:
        data = await _get(client, url)
    posts = [
        _parse_post(p) for p in data["data"]["children"]
        if not p["data"]["stickied"]
    ]
    return posts


async def fetch_post_by_url(url: str) -> dict:
    """fetch a single post + top 5 comments by reddit URL"""
    # normalize to json endpoint
    clean = re.sub(r'\?.*$', '', url.rstrip('/'))
    json_url = clean + ".json?limit=5"

    async with httpx.AsyncClient(headers=HEADERS) as client:
        data = await _get(client, json_url)

    post = _parse_post(data[0]["data"]["children"][0])

    comments = []
    for c in data[1]["data"]["children"]:
        if c["kind"] != "t1":
            continue
        body = c["data"].get("body", "").strip()
        if body and body != "[deleted]":
            comments.append(body[:200])
        if len(comments) >= 5:
            break

    post["comments"] = comments
    return post
